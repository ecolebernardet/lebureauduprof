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
// 📌 Onglet « Édition » (PDF) : liste de classe, feuille de pointage, grandes et
//    petites étiquettes, fiches de suivi. Repris de maclasse.html.
//    Utilise jsPDF + jsPDF-AutoTable (chargés automatiquement depuis cdnjs au
//    premier usage si la page ne les fournit pas déjà ; connexion Internet requise).
//    API : window.ClasseEdition.generate(kind, classId?) → Promise<nomDeFichier>
//          kind = 'liste' | 'pointage' | 'grandes' | 'petites' | 'suivi'
//
// 📌 API globale pour les autres widgets (window.ClasseListe) :
//   ClasseListe.getClasses()          → [{ id, name, count }]
//   ClasseListe.getActiveId()         → id de la classe active (ou null)
//   ClasseListe.getStudents(classId)  → [{ id, prenom, nom, sexe, niveau, dob }]
//                                       (même format que widget-tirage ; sexe = 'F' | 'G' | '')
//                                       dob = 'AAAA-MM-JJ' ou '' (saisie/affichage en JJ/MM/AAAA)
//   ClasseListe.normDob(txt) / formatDob(iso) → conversions de dates de naissance
//                                       classId omis = classe active
//   ClasseListe.getClass(classId)     → { id, name, students:[…] } ou null
//   ClasseListe.getLevels(classId)    → ['CE1','CE2'] (classe à 2 ou 3 niveaux) ou [] (un seul niveau)
//   ClasseListe.setLevels(classId, levels) → définit les niveaux (2 ou 3, max.)
//                                       Si la classe a plusieurs niveaux, chaque élève porte son
//                                       propre « niveau » dans getStudents ; sinon niveau = nom de classe.
//   ClasseListe.getViewMode(classId)  → 'split' (2 colonnes) | 'levels' (une colonne par niveau)
//   ClasseListe.setViewMode(classId, mode) → change la présentation (classe à plusieurs niveaux)
//   ClasseListe.getSortMode(classId)  → 'prenom' | 'nom' (critère de tri de la classe)
//   ClasseListe.setSortMode(classId, mode) → change le critère et re-trie
//                                       (la liste est TOUJOURS triée automatiquement)
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
                    if (d && Array.isArray(d.classes)) { d.classes.forEach(sortClass); return d; }
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

        // ── Dates de naissance : stockées en ISO « AAAA-MM-JJ » ──
        // Accepte JJ/MM/AAAA, JJ-MM-AAAA, JJ.MM.AAAA, JJMMAAAA, AAAA-MM-JJ ; renvoie '' si invalide
        function normDob(v) {
            const t = String(v == null ? '' : v).trim();
            if (!t) return '';
            let y, m, d, x;
            if ((x = t.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})$/)))      { y = +x[1]; m = +x[2]; d = +x[3]; }
            else if ((x = t.match(/^(\d{1,2})[-\/. ](\d{1,2})[-\/. ](\d{4})$/))) { d = +x[1]; m = +x[2]; y = +x[3]; }
            else if ((x = t.match(/^(\d{2})(\d{2})(\d{4})$/)))                 { d = +x[1]; m = +x[2]; y = +x[3]; }
            else return '';
            if (y < 1900 || y > 2100) return '';
            const dt = new Date(Date.UTC(y, m - 1, d));
            if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return '';
            return y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
        }
        function formatDob(iso) {
            const x = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
            return x ? x[3] + '/' + x[2] + '/' + x[1] : '';
        }

        // ── Niveaux (classe à 2 ou 3 niveaux) ──
        function normLevels(v) {
            const arr = Array.isArray(v) ? v : String(v || '').split(/[,;\/]+/);
            const out = [];
            arr.forEach(x => {
                const l = String(x).trim().toUpperCase();
                if (l && !out.includes(l)) out.push(l);
            });
            return out.slice(0, 3);
        }
        function levelsOf(c) { return Array.isArray(c.levels) ? c.levels : []; }
        function isMulti(c)  { return levelsOf(c).length >= 2; }
        // Renvoie un niveau valide pour la classe ('' si un seul niveau)
        function resolveLevel(c, v) {
            if (!isMulti(c)) return '';
            const l = String(v || '').trim().toUpperCase();
            return levelsOf(c).includes(l) ? l : levelsOf(c)[0];
        }

        // ── Tri automatique (prénom ou nom, selon le réglage de la classe) ──
        function cmpText(a, b) {
            return String(a || '').localeCompare(String(b || ''), 'fr', { sensitivity: 'base' });
        }
        function sortClass(c) {
            if (!c || !Array.isArray(c.students)) return;
            const mode  = c.sortBy === 'nom' ? 'nom' : 'prenom';
            const other = mode === 'nom' ? 'prenom' : 'nom';
            c.students.sort((a, b) => {
                const ka = a[mode] || '', kb = b[mode] || '';
                if (!ka !== !kb) return ka ? -1 : 1;          // champ vide → en fin de liste
                return cmpText(ka, kb) || cmpText(a[other], b[other]) || (a.id - b.id);
            });
        }

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
                return data.classes.map(c => ({ id: c.id, name: c.name, count: c.students.length, levels: levelsOf(c).slice() }));
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
                const classNiveau = (c.name || 'CLASSE').trim().toUpperCase();
                return c.students.map(s => ({
                    id: s.id, prenom: s.prenom, nom: s.nom || '',
                    sexe: s.sexe || '',
                    niveau: isMulti(c) ? resolveLevel(c, s.niveau) : classNiveau,
                    classe: c.name, dob: s.dob || ''
                }));
            },

            setActive(id, source) {
                if (!find(id)) return;
                data.activeId = id;
                commit(source);
            },
            createClass(name, source) {
                const id = 'c' + (data.nextClassId++);
                data.classes.push({ id, name: (name || 'Ma classe').trim() || 'Ma classe', nextStudentId: 1, sortBy: 'prenom', levels: [], students: [] });
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
                        nom: String(e.nom || '').trim(), sexe: normSexe(e.sexe),
                        niveau: resolveLevel(c, e.niveau), dob: normDob(e.dob)
                    });
                    n++;
                });
                if (n) { sortClass(c); commit(source); }
                return n;
            },
            updateStudent(id, sid, patch, source) {
                const c = find(id); if (!c) return;
                const s = c.students.find(x => x.id === sid); if (!s) return;
                if ('prenom' in patch) s.prenom = String(patch.prenom).trim() || s.prenom;
                if ('nom'    in patch) s.nom    = String(patch.nom).trim();
                if ('sexe'   in patch) s.sexe   = normSexe(patch.sexe);
                if ('niveau' in patch) s.niveau = resolveLevel(c, patch.niveau);
                if ('dob'    in patch) s.dob    = normDob(patch.dob);
                sortClass(c);
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
                sortClass(c);
                commit(source);
            },
            getSortMode(id) {
                const c = find(id || this.getActiveId());
                return c && c.sortBy === 'nom' ? 'nom' : 'prenom';
            },
            setSortMode(id, mode, source) {
                const c = find(id); if (!c) return;
                c.sortBy = mode === 'nom' ? 'nom' : 'prenom';
                sortClass(c);
                commit(source);
            },

            normLevels,
            normDob,
            formatDob,
            getLevels(id) {
                const c = find(id || this.getActiveId());
                return c ? levelsOf(c).slice() : [];
            },
            /** levels : tableau ou texte « CE1, CE2 » — moins de 2 niveaux = classe à un seul niveau */
            setLevels(id, levels, source) {
                const c = find(id); if (!c) return;
                let lv = normLevels(levels);
                if (lv.length < 2) lv = [];
                c.levels = lv;
                if (!lv.length) c.viewMode = 'split';
                c.students.forEach(s => { s.niveau = resolveLevel(c, s.niveau); });
                commit(source);
            },

            getViewMode(id) {
                const c = find(id || this.getActiveId());
                return c && c.viewMode === 'levels' && isMulti(c) ? 'levels' : 'split';
            },
            setViewMode(id, mode, source) {
                const c = find(id); if (!c) return;
                c.viewMode = mode === 'levels' ? 'levels' : 'split';
                commit(source);
            },

            // Sauvegarde dans le JSON du board (secours si le localStorage est vide)
            exportData() { return clone(data); },
            hasAnyStudent() { return data.classes.some(c => c.students.length > 0); },
            hydrate(d, source) {
                if (!d || !Array.isArray(d.classes)) return;
                data = clone(d);
                data.classes.forEach(sortClass);
                commit(source);
            }
        };
    })();
}

// ─────────────────────────────────────────────────────────────────────────
// MODULE ÉDITION : génération des documents PDF (repris de maclasse.html)
// Aucune dépendance au DOM du widget : utilisable seul via window.ClasseEdition
// ─────────────────────────────────────────────────────────────────────────
if (!window.ClasseEdition) {
    (function () {
        const LIB_JSPDF     = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        const LIB_AUTOTABLE = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js';
        const LS_PROF = 'nom_enseignant';          // même clé que maclasse.html
        const LS_YEAR = 'annee_scolaire_classe';

        const KINDS = [
            { id: 'liste',    icon: '📄', title: 'Liste de classe',     desc: 'Format tableau classique A4',          color: '#3b82f6', tint: 'rgba(59,130,246,.12)' },
            { id: 'pointage', icon: '☑️', title: 'Feuille de pointage', desc: 'Grille avec 15 cases de suivi',        color: '#10b981', tint: 'rgba(16,185,129,.12)' },
            { id: 'grandes',  icon: '🏷️', title: 'Grandes étiquettes',  desc: '8 étiquettes par page A4',             color: '#f59e0b', tint: 'rgba(245,158,11,.14)' },
            { id: 'petites',  icon: '🔖', title: 'Petites étiquettes',  desc: '27 étiquettes par page (format 3×9)',  color: '#f43f5e', tint: 'rgba(244,63,94,.12)' },
            { id: 'suivi',    icon: '🗂️', title: 'Fiches de suivi',     desc: '2 fiches A5 par page (paysage)',       color: '#a855f7', tint: 'rgba(168,85,247,.12)' }
        ];

        // ── Réglages (enseignant, année scolaire) ─────────────────────────
        function lsGet(k) { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } }
        function lsSet(k, v) { try { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch (e) {} }
        function autoYear() {
            const d = new Date(), y = d.getFullYear();
            return d.getMonth() >= 7 ? y + '-' + (y + 1) : (y - 1) + '-' + y;   // année scolaire à partir d'août
        }
        function getProf() { return lsGet(LS_PROF); }
        function setProf(v) { lsSet(LS_PROF, String(v || '').trim()); }
        function getYear() { return lsGet(LS_YEAR).trim() || autoYear(); }
        function setYear(v) { lsSet(LS_YEAR, String(v || '').trim()); }

        // ── Chargement de jsPDF + AutoTable (une seule fois) ──────────────
        function hasJsPdf()     { return !!(window.jspdf && window.jspdf.jsPDF); }
        function hasAutoTable() { return hasJsPdf() && !!(window.jspdf.jsPDF.API && window.jspdf.jsPDF.API.autoTable); }

        function loadScript(src) {
            return new Promise((resolve, reject) => {
                const el = document.createElement('script');
                el.src = src;
                el.async = true;
                el.onload  = () => resolve();
                el.onerror = () => { el.remove(); reject(new Error('Impossible de charger la bibliothèque PDF (vérifiez la connexion Internet).')); };
                document.head.appendChild(el);
            });
        }

        let libPromise = null;
        function ensureLib() {
            if (hasJsPdf() && hasAutoTable()) return Promise.resolve(window.jspdf.jsPDF);
            if (!libPromise) {
                libPromise = (async () => {
                    if (!hasJsPdf())     await loadScript(LIB_JSPDF);
                    if (!hasAutoTable()) await loadScript(LIB_AUTOTABLE);
                    if (!hasJsPdf()) throw new Error('Bibliothèque PDF indisponible.');
                    return window.jspdf.jsPDF;
                })().catch(e => { libPromise = null; throw e; });
            }
            return libPromise;
        }

        // ── Utilitaires ───────────────────────────────────────────────────
        function today() {
            const n = new Date();
            return n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0') + '-' + String(n.getDate()).padStart(2, '0');
        }
        function slug(t) {
            return String(t || '').toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
        }
        // Réduit la police jusqu'à ce que le texte tienne dans maxW (prénoms longs)
        function fit(doc, text, maxW, size, min) {
            let sz = size;
            doc.setFontSize(sz);
            while (sz > min && doc.getTextWidth(text) > maxW) { sz -= 0.5; doc.setFontSize(sz); }
            return sz;
        }
        function upNom(s) { return String(s.nom || '').trim().toUpperCase(); }
        function fullName(s) { return (String(s.prenom || '').trim() + ' ' + upNom(s)).trim(); }
        // « Prénom NOM » ou « NOM Prénom » selon le tri de la classe
        function dispName(s, mode) {
            const p = String(s.prenom || '').trim(), n = upNom(s);
            return (mode === 'nom' ? n + ' ' + p : p + ' ' + n).trim();
        }
        function dobText(s) { return window.ClasseListe.formatDob(s.dob); }
        function table(doc, opts) {
            if (typeof doc.autoTable === 'function') doc.autoTable(opts);
            else if (typeof window.autoTable === 'function') window.autoTable(doc, opts);
            else throw new Error('Module de tableaux PDF indisponible.');
        }
        function bandCell(text, span) {
            return { content: text, colSpan: span, styles: { fillColor: [160, 160, 160], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'left' } };
        }
        function bandFix(span) {
            return function (data) {
                if (data.section === 'body' && data.cell.raw && data.cell.raw.colSpan === span) data.cell.styles.fillColor = [160, 160, 160];
            };
        }

        // ── Contexte : classe active, élèves triés, regroupement par niveau ──
        function context(classId) {
            const CL = window.ClasseListe;
            const id  = classId || CL.getActiveId();
            const cls = CL.getClass(id);
            if (!cls) throw new Error('Aucune classe sélectionnée.');
            const students = CL.getStudents(id);           // déjà triés selon le tri de la classe
            if (!students.length) { const e = new Error('La liste est vide !'); e.empty = true; throw e; }
            const levels = CL.getLevels(id);
            const multi  = levels.length >= 2;
            const groups = multi
                ? levels.map(l => ({ level: l, list: students.filter(s => s.niveau === l) })).filter(g => g.list.length)
                : [{ level: null, list: students }];
            return {
                cls, students, levels, multi, groups,
                mode: CL.getSortMode(id),
                prof: getProf(), year: getYear(),
                label: multi ? levels.join(' / ') : cls.name
            };
        }

        // ── 1) Liste de classe (tableau A4) ───────────────────────────────
        function buildListe(jsPDF, c) {
            const doc = new jsPDF();
            const title = c.prof ? 'Liste de la classe de ' + c.prof : 'Liste de la classe ' + c.cls.name;
            fit(doc, title, 180, 18, 11);
            doc.text(title, 105, 15, { align: 'center' });
            doc.setFontSize(12);
            doc.text(c.label, 105, 22, { align: 'center' });

            const ncols = c.multi ? 5 : 4;
            const body = [];
            let n = 1;
            c.groups.forEach(g => {
                if (c.multi) body.push([bandCell(g.level, ncols)]);
                g.list.forEach(s => {
                    const row = [n++, dispName(s, c.mode), dobText(s) || '-', (s.sexe || '').toUpperCase() || '-'];
                    if (c.multi) row.push(s.niveau);
                    body.push(row);
                });
            });

            table(doc, {
                head: [],
                body,
                startY: 30,
                theme: 'grid',
                alternateRowStyles: { fillColor: [230, 230, 230] },
                styles: { fontSize: 9, lineColor: [0, 0, 0] },
                didParseCell: bandFix(ncols)
            });
            return doc;
        }

        // ── 2) Feuille de pointage (15 cases) ─────────────────────────────
        function buildPointage(jsPDF, c) {
            const doc = new jsPDF('p', 'mm', 'a4');
            const title = 'Feuille de pointage ' + c.label + (c.prof ? ' - ' + c.prof : '');
            fit(doc, title, 190, 16, 10);
            doc.text(title, 105, 15, { align: 'center' });

            const body = [];
            let n = 1;
            c.groups.forEach(g => {
                if (c.multi) body.push([bandCell(g.level, 17)]);
                g.list.forEach(s => body.push([n++, dispName(s, c.mode), ...Array(15).fill('')]));
            });

            table(doc, {
                head: [[...Array(17).fill('')]],
                body,
                startY: 25,
                theme: 'grid',
                alternateRowStyles: { fillColor: [230, 230, 230] },
                headStyles: { fillColor: [255, 255, 255], lineWidth: 0.1, lineColor: [0, 0, 0], minCellHeight: 16 },
                styles: { fontSize: 7, cellPadding: 1.5, lineColor: [0, 0, 0], textColor: [0, 0, 0] },
                columnStyles: {
                    0: { cellWidth: 7, halign: 'center' },
                    1: { cellWidth: 'auto' },
                    ...Object.fromEntries([...Array(15)].map((_, i) => [i + 2, { cellWidth: 8 }]))
                },
                didParseCell: function (data) {
                    if (data.section === 'head' && (data.column.index === 0 || data.column.index === 1)) data.cell.styles.lineWidth = 0;
                    bandFix(17)(data);
                }
            });
            return doc;
        }

        // ── 3) Grandes étiquettes (8 par page : 2 × 4) ────────────────────
        function buildGrandes(jsPDF, c) {
            const doc = new jsPDF();
            const margin = 10, gap = 10, cols = 2, rows = 4;
            const cw = (210 - 2 * margin - gap) / cols;
            const ch = (297 - 2 * margin - 3 * gap) / rows;

            c.students.forEach((s, i) => {
                const pos = i % (cols * rows);
                if (i > 0 && pos === 0) doc.addPage();
                const x = margin + (pos % cols) * (cw + gap);
                const y = margin + Math.floor(pos / cols) * (ch + gap);

                doc.setDrawColor(200);
                doc.roundedRect(x, y, cw, ch, 3, 3, 'S');

                doc.setFont('helvetica', 'normal');
                doc.setTextColor(40);
                fit(doc, s.prenom, cw - 10, 24, 12);
                doc.text(s.prenom, x + cw / 2, y + ch / 2, { align: 'center' });

                const nom = upNom(s);
                if (nom) {
                    doc.setTextColor(100);
                    fit(doc, nom, cw - 10, 10, 6);
                    doc.text(nom, x + cw / 2, y + ch / 2 + 10, { align: 'center' });
                }

                doc.setTextColor(100);
                doc.setFontSize(8);
                doc.text(s.niveau, x + cw - 5, y + ch - 5, { align: 'right' });
            });
            return doc;
        }

        // ── 4) Petites étiquettes (27 par page : 3 × 9) ───────────────────
        function buildPetites(jsPDF, c) {
            const doc = new jsPDF('p', 'mm', 'a4');
            const mx = 10, my = 12, cols = 3, rows = 9, gap = 4;
            const cw = (210 - 2 * mx - (cols - 1) * gap) / cols;
            const ch = (297 - 2 * my - (rows - 1) * gap) / rows;

            c.students.forEach((s, i) => {
                const pos = i % (cols * rows);
                if (i > 0 && pos === 0) doc.addPage();
                const x = mx + (pos % cols) * (cw + gap);
                const y = my + Math.floor(pos / cols) * (ch + gap);

                doc.setDrawColor(220);
                doc.setLineWidth(0.1);
                doc.rect(x, y, cw, ch, 'S');

                doc.setFont('helvetica', 'bold');
                doc.setTextColor(0);
                fit(doc, s.prenom, cw - 4, 11, 7);
                doc.text(s.prenom, x + cw / 2, y + ch / 2 - 1, { align: 'center' });

                const nom = upNom(s);
                if (nom) {
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(100);
                    fit(doc, nom, cw - 4, 8, 5);
                    doc.text(nom, x + cw / 2, y + ch / 2 + 4, { align: 'center' });
                }

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(6);
                doc.setTextColor(180);
                doc.text(s.niveau, x + cw - 2, y + ch - 2, { align: 'right' });
            });
            return doc;
        }

        // ── 5) Fiches de suivi (2 fiches A5 par page A4 paysage) ──────────
        function buildSuivi(jsPDF, c) {
            const doc = new jsPDF('l', 'mm', 'a4');
            const head1 = 'Suivi Pédagogique - ' + (c.prof ? 'Classe de ' + c.prof : 'Classe ' + c.cls.name);

            c.students.forEach((s, i) => {
                if (i > 0 && i % 2 === 0) doc.addPage('a4', 'l');
                const position = i % 2;
                const ox = position * 148.5;

                doc.setFillColor(248, 248, 248);
                doc.rect(ox + 10, 10, 128.5, 20, 'F');
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(120);
                fit(doc, head1, 118, 8, 6);
                doc.text(head1, ox + 15, 18);
                doc.setFontSize(8);
                doc.text('Année Scolaire ' + c.year, ox + 15, 24);

                doc.setTextColor(0);
                doc.setFont('helvetica', 'bold');
                const name = fullName(s);
                fit(doc, name, 118, 16, 10);
                doc.text(name, ox + 74.25, 45, { align: 'center' });

                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                const birth = dobText(s);
                doc.text('Niveau : ' + s.niveau + (birth ? ' - Né(e) le : ' + birth : ''), ox + 74.25, 52, { align: 'center' });

                doc.setDrawColor(200);
                doc.line(ox + 30, 58, ox + 118, 58);

                doc.setFontSize(9);
                doc.setTextColor(150);
                doc.setFont('helvetica', 'italic');
                doc.text('OBSERVATIONS / NOTES :', ox + 15, 68);

                doc.setDrawColor(230);
                doc.roundedRect(ox + 10, 72, 128.5, 120, 2, 2, 'S');

                doc.setDrawColor(240);
                for (let k = 0; k < 10; k++) doc.line(ox + 15, 85 + k * 11, ox + 133.5, 85 + k * 11);

                if (position === 0) {
                    doc.setDrawColor(220);
                    doc.setLineDashPattern([2, 2], 0);
                    doc.line(148.5, 5, 148.5, 205);
                    doc.setLineDashPattern([], 0);
                }
            });
            return doc;
        }

        const BUILDERS = {
            liste:    { build: buildListe,    file: 'liste_classe' },
            pointage: { build: buildPointage, file: 'liste_pointage' },
            grandes:  { build: buildGrandes,  file: 'etiquettes' },
            petites:  { build: buildPetites,  file: 'petitesetiquettes' },
            suivi:    { build: buildSuivi,    file: 'fiches_suivi_classe' }
        };

        function finalize(doc, fileName) {
            try {
                if (window.Android && typeof window.Android.savePdfFromBase64 === 'function') {
                    window.Android.savePdfFromBase64(doc.output('datauristring').split(',')[1], fileName);
                } else {
                    doc.save(fileName);
                }
            } catch (e) {
                console.error('Erreur export PDF :', e);
                doc.save(fileName);
            }
        }

        function fileNameFor(kind, c) {
            const who = [c.prof, c.cls.name].map(slug).filter(Boolean).join('_') || 'classe';
            return 'outilsprofs_' + BUILDERS[kind].file + '_' + who + '_' + today() + '.pdf';
        }

        window.ClasseEdition = {
            KINDS,
            getProf, setProf, getYear, setYear, autoYear,
            ensureLib,
            /** Construit le PDF (sans l'enregistrer) et le renvoie */
            async build(kind, classId) {
                if (!BUILDERS[kind]) throw new Error('Document inconnu : ' + kind);
                const c = context(classId);
                const jsPDF = await ensureLib();
                return BUILDERS[kind].build(jsPDF, c);
            },
            /** Construit + enregistre le PDF ; renvoie le nom du fichier */
            async generate(kind, classId) {
                if (!BUILDERS[kind]) throw new Error('Document inconnu : ' + kind);
                const c = context(classId);
                const jsPDF = await ensureLib();
                const doc = BUILDERS[kind].build(jsPDF, c);
                const name = fileNameFor(kind, c);
                finalize(doc, name);
                return name;
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
        width: 800px;
        height: 600px;
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

    /* ── Niveaux (classe à 2 ou 3 niveaux) ── */
    .classe-add-level {
        padding: 7px 6px;
        border-radius: 8px;
        border: 1.5px solid #d1d5db;
        font-size: 12px;
        font-family: inherit;
        font-weight: 700;
        color: #4f46e5;
        background: #fff;
        cursor: pointer;
        user-select: none;
    }
    .classe-add-level:focus { outline: none; border-color: #6366f1; }
    .classe-niv {
        min-width: 34px; max-width: 56px; height: 22px;
        border-radius: 6px;
        border: 1px solid #c7d2fe;
        background: #eef2ff;
        color: #4f46e5;
        font-size: 10px;
        font-weight: 800;
        cursor: pointer;
        flex-shrink: 0;
        padding: 0 4px;
        font-family: inherit;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        transition: all .15s;
    }
    .classe-niv[data-i="1"] { border-color: #99f6e4; background: #f0fdfa; color: #0d9488; }
    .classe-niv[data-i="2"] { border-color: #fde68a; background: #fffbeb; color: #b45309; }

    /* ── Onglets Enregistrement / Édition ── */
    .classe-modes {
        display: flex;
        flex-shrink: 0;
        border-bottom: 1px solid #e5e7eb;
    }
    .classe-mode {
        flex: 1;
        padding: 8px 6px 6px;
        border: none;
        border-bottom: 3px solid transparent;
        background: transparent;
        color: #9ca3af;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.3px;
        text-transform: uppercase;
        font-family: inherit;
        cursor: pointer;
        transition: color .15s, border-color .15s;
    }
    .classe-mode:hover { color: #6b7280; }
    .classe-mode.active { color: #374151; border-bottom-color: #6366f1; }

    /* ── Panneau Édition ── */
    .classe-edition {
        display: none;
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        flex-direction: column;
        gap: 12px;
        padding: 12px;
        scrollbar-width: thin;
        scrollbar-color: #d1d5db transparent;
    }
    .classe-inner[data-mode="doc"] .classe-edition { display: flex; }
    .classe-inner[data-mode="doc"] .classe-addbar,
    .classe-inner[data-mode="doc"] .classe-toolbar,
    .classe-inner[data-mode="doc"] .classe-list,
    .classe-inner[data-mode="doc"] .classe-footer { display: none; }
    .classe-edit-info { font-size: 11px; font-weight: 700; color: #6b7280; }
    .classe-edit-fields { display: flex; flex-wrap: wrap; gap: 8px 12px; align-items: flex-end; }
    .classe-edit-field {
        display: flex; flex-direction: column; gap: 3px;
        font-size: 9px; font-weight: 800; text-transform: uppercase;
        color: #9ca3af; letter-spacing: .3px;
    }
    .classe-edit-field .classe-add-input { flex: none; width: 190px; }
    .classe-edit-field .classe-edit-year { width: 110px; }
    .classe-doc-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
        gap: 10px;
    }
    .classe-doc-card {
        display: flex; align-items: center; gap: 12px;
        padding: 12px 14px;
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        cursor: pointer;
        text-align: left;
        font-family: inherit;
        color: #374151;
        transition: box-shadow .15s, transform .1s, border-color .15s;
    }
    .classe-doc-card:hover { border-color: var(--c); box-shadow: 0 2px 10px rgba(0,0,0,0.08); }
    .classe-doc-card:active { transform: scale(0.98); }
    .classe-doc-card:disabled { opacity: .55; cursor: wait; }
    .classe-doc-ico {
        width: 38px; height: 38px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 18px; flex-shrink: 0;
        background: var(--t);
        transition: background .15s;
    }
    .classe-doc-card:hover .classe-doc-ico { background: var(--c); }
    .classe-doc-txt { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .classe-doc-txt b { font-size: 12px; font-weight: 800; text-transform: uppercase; }
    .classe-doc-txt small { font-size: 10px; color: #6b7280; font-weight: 500; }
    .classe-edit-status { font-size: 11px; font-weight: 600; color: #9ca3af; min-height: 16px; word-break: break-all; }
    .classe-edit-status.ok  { color: #059669; }
    .classe-edit-status.err { color: #dc2626; }

    /* ── Sélecteur de tri ── */
    .classe-sortgroup {
        display: inline-flex;
        align-items: center;
        gap: 0;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        overflow: hidden;
        background: #f3f4f6;
    }
    .classe-sort-label {
        padding: 0 8px;
        font-size: 10px;
        font-weight: 700;
        color: #4b5563;
        white-space: nowrap;
    }
    .classe-sort-opt, .classe-view-opt {
        padding: 5px 10px;
        border: none;
        border-left: 1px solid #e5e7eb;
        background: transparent;
        color: #6b7280;
        font-size: 10px;
        font-weight: 700;
        font-family: inherit;
        cursor: pointer;
        transition: background .15s, color .15s;
    }
    .classe-sort-opt:hover, .classe-view-opt:hover { background: #e5e7eb; }
    .classe-sort-opt.active, .classe-view-opt.active { background: #6366f1; color: #fff; }

    /* ── Présentation « une colonne par niveau » ── */
    .classe-list[data-view="levels"] { grid-auto-flow: row; align-items: start; }
    .classe-col { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
    .classe-col-head {
        position: sticky; top: 0; z-index: 1;
        text-align: center;
        font-size: 11px; font-weight: 800;
        padding: 4px 6px;
        border-radius: 8px;
        background: #eef2ff; color: #4f46e5; border: 1px solid #c7d2fe;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .classe-col-head[data-i="1"] { background: #f0fdfa; color: #0d9488; border-color: #99f6e4; }
    .classe-col-head[data-i="2"] { background: #fffbeb; color: #b45309; border-color: #fde68a; }
    .classe-list[data-view="levels"] .classe-niv { min-width: 30px; max-width: 30px; padding: 0 2px; }

    /* ── Liste élèves ── */
    .classe-list {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        padding: 4px 12px 10px;
        display: grid;
        /* 2 colonnes : 1re moitié à gauche, 2e moitié à droite
           (le nombre de lignes est fixé en JS = moitié des élèves) */
        grid-template-columns: repeat(2, minmax(0, 1fr));
        grid-auto-flow: column;
        gap: 6px 12px;
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
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 5px;
        background: #f8f9fa;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 3px 6px;
    }
    .classe-row.just-added { animation: classeJustAdded 1.6s ease-out; }
    @keyframes classeJustAdded {
        0%, 40% { background: #e0e7ff; border-color: #6366f1; }
        100%    { background: #f8f9fa; border-color: #e5e7eb; }
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
    .classe-in-dob {
        flex: 0 0 84px; width: 84px;
        font-size: 11px; font-weight: 500; color: #6b7280;
        text-align: center;
    }
    .classe-in-dob::placeholder { color: #c4c9d1; }
    /* 3 colonnes (un niveau par colonne) : la date passe sur une 2e ligne */
    .classe-list[data-cols="3"] .classe-row { flex-wrap: wrap; }
    .classe-list[data-cols="3"] .classe-in-dob {
        order: 10; flex: none;
        width: calc(100% - 25px); margin-left: 25px;
        text-align: left;
    }
    .classe-list[data-mode="nom"] .classe-in-nom    { font-weight: 700; color: #374151; }
    .classe-list[data-mode="nom"] .classe-in-prenom { font-weight: 500; color: #6b7280; }
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
    const CL_DEFAULT_W = 800;
    const CL_DEFAULT_H = 600;
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
            let nom = parts[1] || '', sexe = parts[2] || '', dob = parts[4] || '';
            // "Léa;F" → le 2e champ est un sexe, pas un nom
            if (parts.length === 2 && /^(f|g|m|h)$/i.test(nom)) { sexe = nom; nom = ''; }
            // "Léa;15/03/2015" ou "Léa;Martin;15/03/2015" → date de naissance
            else if (parts.length === 2 && CL.normDob(nom))     { dob = nom;  nom = ''; }
            else if (parts.length === 3 && CL.normDob(sexe))    { dob = sexe; sexe = ''; }
            out.push({ prenom, nom, sexe: CL.normSexe(sexe), niveau: parts[3] || '', dob });
        });
        return out;
    }

    // ── HTML interne partagé (création + restauration) ────────────────────
    function classeInnerHTML() {
        const docCards = (window.ClasseEdition ? window.ClasseEdition.KINDS : []).map(k => `
                    <button class="classe-doc-card" data-doc="${k.id}" style="--c:${k.color};--t:${k.tint};">
                        <span class="classe-doc-ico">${k.icon}</span>
                        <span class="classe-doc-txt"><b>${k.title}</b><small>${k.desc}</small></span>
                    </button>`).join('');
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
                • La liste est <b>toujours triée par ordre alphabétique</b> : un nouvel élève se place directement au bon endroit.
                Choisissez le tri par <b>Prénom</b> ou par <b>Nom</b> avec les boutons « Trier par ».<br>
                • <b>Onglet Édition</b> : génère en PDF la liste de classe, la feuille de pointage, les grandes et petites étiquettes
                et les fiches de suivi de la classe active. Le tri Prénom / Nom choisi est appliqué aux documents.<br>
                • <b>Classe à 2 ou 3 niveaux</b> : cliquez sur <b>🎓</b> pour les définir (ex : <em>CE1, CE2</em>).
                Choisissez ensuite le niveau des nouveaux élèves à côté du champ d'ajout ; cliquez sur le niveau d'un élève pour le changer.
                Le bouton <b>Affichage</b> permet de présenter la liste en <b>2 colonnes</b> ou avec <b>une colonne par niveau</b>.<br>
                • <b>Date de naissance</b> : tapez les chiffres (ex : <em>12032015</em>), les « / » s'ajoutent tout seuls.
                Import possible avec <em>Prénom;NOM;sexe;niveau;JJ/MM/AAAA</em>.<br>
                • Cliquez sur un prénom/nom pour le corriger, sur <b>F / G</b> pour changer le sexe (couleur dans le tirage).<br>
                • Plusieurs classes possibles (onglets). La classe active est proposée par défaut
                dans les widgets <b>Tirage</b> et <b>Équipes</b>.<br>
                • Les listes sont mémorisées sur cet ordinateur.</p>
            </div>
            <div class="classe-modes">
                <button class="classe-mode active" data-mode="edit">👥 Enregistrement</button>
                <button class="classe-mode" data-mode="doc">🖨️ Édition</button>
            </div>
            <div class="classe-tabs"></div>
            <div class="classe-addbar">
                <input type="text" class="classe-add-input" placeholder="Ajouter un prénom puis Entrée…" autocomplete="off">
                <select class="classe-add-level" title="Niveau des nouveaux élèves" style="display:none;"></select>
                <button class="classe-btn classe-add-btn" title="Ajouter">➕</button>
            </div>
            <div class="classe-toolbar">
                <button class="classe-btn classe-btn-soft classe-bulk-btn">📋 Coller une liste</button>
                <button class="classe-btn classe-btn-soft classe-file-btn">📄 Importer un fichier</button>
                <button class="classe-btn classe-btn-soft classe-export-btn">💾 Exporter</button>
                <div class="classe-sortgroup" title="Les élèves sont rangés automatiquement par ordre alphabétique">
                    <span class="classe-sort-label">🔤 Trier par</span>
                    <button class="classe-sort-opt" data-sort="prenom">Prénom</button>
                    <button class="classe-sort-opt" data-sort="nom">Nom</button>
                </div>
                <div class="classe-sortgroup classe-viewgroup" style="display:none;" title="Présentation de la liste (classe à plusieurs niveaux)">
                    <span class="classe-sort-label">▦ Affichage</span>
                    <button class="classe-view-opt" data-view="split">2 colonnes</button>
                    <button class="classe-view-opt" data-view="levels">Par niveau</button>
                </div>
                <button class="classe-btn classe-btn-soft classe-clear-btn">🗑️ Vider</button>
                <input type="file" class="classe-file-input" accept=".txt,.csv" style="display:none;">
            </div>
            <div class="classe-list"></div>
            <div class="classe-edition">
                <div class="classe-edit-info"></div>
                <div class="classe-edit-fields">
                    <label class="classe-edit-field">Enseignant
                        <input type="text" class="classe-add-input classe-edit-prof" placeholder="ex : M. PROF" autocomplete="off">
                    </label>
                    <label class="classe-edit-field">Année scolaire
                        <input type="text" class="classe-add-input classe-edit-year" placeholder="2026-2027" autocomplete="off">
                    </label>
                    <div class="classe-sortgroup" title="Le tri choisi s'applique aux documents">
                        <span class="classe-sort-label">🔤 Trier par</span>
                        <button class="classe-sort-opt" data-sort="prenom">Prénom</button>
                        <button class="classe-sort-opt" data-sort="nom">Nom</button>
                    </div>
                </div>
                <div class="classe-doc-grid">${docCards}
                </div>
                <div class="classe-edit-status">Choisissez un document : il sera généré en PDF pour la classe active.</div>
            </div>
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
        // Si le widget a déjà été initialisé (ex. restauration du board), on repart
        // d'un DOM neuf pour ne PAS empiler les écouteurs (sinon chaque clic
        // se déclenche plusieurs fois : double export, etc.)
        if (widget._classeInited) outer.innerHTML = classeInnerHTML();
        widget._classeInited = true;

        const stopEvt = e => e.stopPropagation();
        ['mousedown', 'keydown', 'keyup'].forEach(ev => {
            outer.addEventListener(ev, stopEvt);
            cleanups.push(() => outer.removeEventListener(ev, stopEvt));
        });

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
        const addLevelSel  = widget.querySelector('.classe-add-level');
        const bulkBtn      = widget.querySelector('.classe-bulk-btn');
        const fileBtn      = widget.querySelector('.classe-file-btn');
        const exportBtn    = widget.querySelector('.classe-export-btn');
        const sortOpts     = widget.querySelectorAll('.classe-sort-opt');
        const viewGroup    = widget.querySelector('.classe-viewgroup');
        const viewOpts     = widget.querySelectorAll('.classe-view-opt');
        const innerEl      = widget.querySelector('.classe-inner');
        const modeBtns     = widget.querySelectorAll('.classe-mode');
        const editInfo     = widget.querySelector('.classe-edit-info');
        const editStatus   = widget.querySelector('.classe-edit-status');
        const profInput    = widget.querySelector('.classe-edit-prof');
        const yearInput    = widget.querySelector('.classe-edit-year');
        const docBtns      = widget.querySelectorAll('.classe-doc-card');
        const CE           = window.ClasseEdition;
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
        let addLevel = '';   // niveau proposé aux nouveaux élèves (classe à plusieurs niveaux)

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
        const onEscape = (e) => { if (e.key === 'Escape' && _isMax) toggleMax(); };
        outer.addEventListener('keydown', onEscape);
        cleanups.push(() => outer.removeEventListener('keydown', onEscape));

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
                if ((opts.input || opts.textarea) && !opts.allowEmpty && !val.trim()) return;
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
            const lv = cls.levels || [];
            const lvTxt = lv.length >= 2
                ? ' · ' + lv.map(l => l + ' : ' + cls.students.filter(s => s.niveau === l).length).join(' · ')
                : '';
            statsEl.textContent = n + ' élève' + (n > 1 ? 's' : '') + (f || g ? ' · ' + f + ' F · ' + g + ' G' : '') + lvTxt;
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

            const levelsBtn = document.createElement('button');
            levelsBtn.className = 'classe-tab-tool';
            levelsBtn.textContent = '🎓';
            {
                const cur = activeClass();
                const lv = cur && cur.levels ? cur.levels : [];
                levelsBtn.title = 'Niveaux de la classe' + (lv.length ? ' : ' + lv.join(' / ') : ' (un seul niveau)');
                if (lv.length) { levelsBtn.style.background = '#eef2ff'; levelsBtn.style.borderColor = '#c7d2fe'; }
            }
            levelsBtn.addEventListener('click', () => {
                const cls = activeClass(); if (!cls) return;
                showModal({
                    title: 'Niveaux de la classe',
                    text: 'Classe à 2 ou 3 niveaux : indiquez-les séparés par des virgules (ex : CE1, CE2).\nLaissez vide pour une classe à un seul niveau.',
                    input: { value: (cls.levels || []).join(', '), placeholder: 'CE1, CE2' },
                    allowEmpty: true,
                    confirmLabel: 'Valider',
                    onConfirm: (val) => {
                        const lv = CL.normLevels(val);
                        if (String(val).trim() && lv.length < 2) { flash('Indiquez au moins 2 niveaux.', 'err'); return; }
                        CL.setLevels(cls.id, lv, widget);
                        refreshAll();
                        flash(lv.length ? '✓ Niveaux : ' + lv.join(' / ') : '✓ Un seul niveau', 'ok');
                    }
                });
            });

            tools.appendChild(levelsBtn);
            tools.appendChild(renameBtn);
            tools.appendChild(delBtn);
            tabsEl.appendChild(tools);
        }

        // ── Tri : état du sélecteur + détection d'un changement d'ordre ───
        function renderSortMode() {
            const mode = CL.getSortMode(CL.getActiveId());
            sortOpts.forEach(b => b.classList.toggle('active', b.dataset.sort === mode));
        }

        function renderViewMode() {
            const id   = CL.getActiveId();
            const mode = CL.getViewMode(id);
            viewGroup.style.display = CL.getLevels(id).length >= 2 ? '' : 'none';
            viewOpts.forEach(b => b.classList.toggle('active', b.dataset.view === mode));
        }

        function renderAddLevel() {
            const lv = CL.getLevels(CL.getActiveId());
            addLevelSel.innerHTML = '';
            if (lv.length < 2) { addLevelSel.style.display = 'none'; addLevel = ''; return; }
            lv.forEach(l => {
                const o = document.createElement('option');
                o.value = l; o.textContent = l;
                addLevelSel.appendChild(o);
            });
            if (!lv.includes(addLevel)) addLevel = lv[0];
            addLevelSel.value = addLevel;
            addLevelSel.style.display = '';
        }
        addLevelSel.addEventListener('change', () => { addLevel = addLevelSel.value; addInput.focus(); });

        // Après modification d'un élève : si son rang a changé, on réaffiche la liste
        function refreshIfReordered(cls) {
            const fresh = CL.getClass(cls.id);
            if (!fresh) return;
            const before = cls.students.map(x => x.id).join(',');
            const after  = fresh.students.map(x => x.id).join(',');
            if (before !== after) refreshAll(true);
        }

        // ── Liste des élèves ──────────────────────────────────────────────
        const SEXE_LABEL = { '': '–', 'F': 'F', 'G': 'G' };
        const SEXE_NEXT  = { '': 'F', 'F': 'G', 'G': '' };

        function renderList() {
            const cls = activeClass();
            listEl.innerHTML = '';
            listEl.style.gridTemplateRows = '';
            listEl.style.gridTemplateColumns = '';
            if (!cls) return;
            const sortMode = CL.getSortMode(cls.id);
            listEl.dataset.mode = sortMode;
            const levels = cls.levels || [];
            const byLevel = levels.length >= 2 && CL.getViewMode(cls.id) === 'levels';
            listEl.dataset.view = byLevel ? 'levels' : 'split';
            listEl.dataset.cols = byLevel ? levels.length : 2;
            if (levels.length >= 2) cls.students.forEach(s => { if (!levels.includes(s.niveau)) s.niveau = levels[0]; });

            if (!cls.students.length) {
                const empty = document.createElement('div');
                empty.className = 'classe-empty';
                empty.innerHTML = '👋 Aucun élève pour l\'instant.<br>Tapez un prénom ci-dessus puis Entrée,<br>ou utilisez « Coller une liste ».';
                listEl.appendChild(empty);
                return;
            }

            const cols = {};
            const counters = {};
            if (byLevel) {
                // Une colonne par niveau (tri conservé à l'intérieur de chaque colonne)
                listEl.style.gridTemplateColumns = 'repeat(' + levels.length + ', minmax(0, 1fr))';
                levels.forEach((l, k) => {
                    const col = document.createElement('div');
                    col.className = 'classe-col';
                    const head = document.createElement('div');
                    head.className = 'classe-col-head';
                    head.dataset.i = k;
                    head.textContent = l + ' · ' + cls.students.filter(x => x.niveau === l).length;
                    col.appendChild(head);
                    listEl.appendChild(col);
                    cols[l] = col;
                });
            } else {
                // Colonne de gauche = première moitié (la plus grande si effectif impair)
                listEl.style.gridTemplateRows = 'repeat(' + Math.ceil(cls.students.length / 2) + ', auto)';
            }

            cls.students.forEach((s, i) => {
                const row = document.createElement('div');
                row.className = 'classe-row';
                row.dataset.sid = s.id;

                const num = document.createElement('span');
                num.className = 'classe-num';
                num.textContent = byLevel ? (counters[s.niveau] = (counters[s.niveau] || 0) + 1) : i + 1;

                const inP = document.createElement('input');
                inP.className = 'classe-in classe-in-prenom';
                inP.value = s.prenom;
                inP.placeholder = 'Prénom';
                inP.addEventListener('change', () => {
                    const v = inP.value.trim();
                    if (!v) { inP.value = s.prenom; return; }
                    s.prenom = v;
                    CL.updateStudent(cls.id, s.id, { prenom: v }, widget);
                    refreshIfReordered(cls);
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
                    refreshIfReordered(cls);
                });
                inN.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); inN.blur(); } });

                const inD = document.createElement('input');
                inD.className = 'classe-in classe-in-dob';
                inD.type = 'text';
                inD.inputMode = 'numeric';
                inD.maxLength = 10;
                inD.placeholder = 'JJ/MM/AAAA';
                inD.title = 'Date de naissance (JJ/MM/AAAA)';
                inD.value = CL.formatDob(s.dob);
                // Saisie fluide : on tape les chiffres, les « / » s'ajoutent
                inD.addEventListener('input', () => {
                    const d = inD.value.replace(/\D/g, '').slice(0, 8);
                    inD.value = d.length > 4 ? d.slice(0, 2) + '/' + d.slice(2, 4) + '/' + d.slice(4)
                              : d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2)
                              : d;
                });
                // Collage d'une date complète (JJ/MM/AAAA, AAAA-MM-JJ…)
                inD.addEventListener('paste', (e) => {
                    const txt = (e.clipboardData || window.clipboardData).getData('text');
                    const iso = CL.normDob(txt);
                    if (!iso) return;
                    e.preventDefault();
                    inD.value = CL.formatDob(iso);
                    inD.dispatchEvent(new Event('change'));
                });
                inD.addEventListener('change', () => {
                    const raw = inD.value.trim();
                    const iso = CL.normDob(raw);
                    if (raw && !iso) {
                        inD.value = CL.formatDob(s.dob);
                        flash('Date invalide (format JJ/MM/AAAA).', 'err');
                        return;
                    }
                    s.dob = iso;
                    inD.value = CL.formatDob(iso);
                    CL.updateStudent(cls.id, s.id, { dob: iso }, widget);
                });
                inD.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); inD.blur(); } });

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

                let niv = null;
                if (levels.length >= 2) {
                    if (!levels.includes(s.niveau)) s.niveau = levels[0];
                    niv = document.createElement('button');
                    niv.className = 'classe-niv';
                    const paintNiv = () => {
                        const i = Math.max(0, levels.indexOf(s.niveau));
                        niv.dataset.i = i;
                        niv.textContent = levels[i];
                    };
                    paintNiv();
                    niv.title = 'Niveau : cliquer pour changer (' + levels.join(' → ') + ')';
                    niv.addEventListener('click', () => {
                        const i = levels.indexOf(s.niveau);
                        s.niveau = levels[(i + 1) % levels.length];
                        paintNiv();
                        CL.updateStudent(cls.id, s.id, { niveau: s.niveau }, widget);
                        if (byLevel) refreshAll(true);   // l'élève change de colonne
                        else renderStats();
                    });
                }

                const del = document.createElement('button');
                del.className = 'classe-del';
                del.textContent = '×';
                del.title = 'Retirer cet élève';
                del.addEventListener('click', () => {
                    CL.removeStudent(cls.id, s.id, widget);
                    refreshAll(true);
                });

                row.appendChild(num);
                // Tri par nom → NOM puis prénom ; sinon prénom puis NOM
                if (sortMode === 'nom') { row.appendChild(inN); row.appendChild(inP); }
                else                    { row.appendChild(inP); row.appendChild(inN); }
                row.appendChild(inD);
                if (niv) row.appendChild(niv);
                row.appendChild(sx);
                row.appendChild(del);
                (byLevel ? cols[s.niveau] : listEl).appendChild(row);
            });
        }

        function refreshAll(keepScroll) {
            const st = listEl.scrollTop;
            renderTabs();
            renderSortMode();
            renderAddLevel();
            renderViewMode();
            renderEdition();
            renderList();
            renderStats();
            if (keepScroll) listEl.scrollTop = st;
        }

        // ── Ajout ─────────────────────────────────────────────────────────
        function addFromText(text, fromBulk) {
            const cls = activeClass(); if (!cls) return;
            const entries = parseStudentsText(text);
            if (!entries.length) { flash('Aucun prénom trouvé.', 'err'); return; }
            const lvAdd = cls.levels || [];
            if (lvAdd.length >= 2) entries.forEach(e => {
                const m = lvAdd.find(l => l === String(e.niveau || '').trim().toUpperCase());
                e.niveau = m || addLevel || lvAdd[0];
            });
            const knownIds = new Set(cls.students.map(x => x.id));
            const n = CL.addStudents(cls.id, entries, widget);
            refreshAll();
            // Mettre en évidence le(s) nouvel(s) élève(s) et faire défiler jusqu'au premier
            const fresh = CL.getClass(cls.id);
            const added = fresh ? fresh.students.filter(x => !knownIds.has(x.id)) : [];
            let firstRow = null;
            added.forEach(x => {
                const row = listEl.querySelector('.classe-row[data-sid="' + x.id + '"]');
                if (!row) return;
                row.classList.add('just-added');
                if (!firstRow) firstRow = row;
            });
            if (firstRow) firstRow.scrollIntoView({ block: 'nearest' });
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
                text: 'Un prénom par ligne, ou séparés par des virgules.\nFormat complet : Prénom;NOM;sexe;niveau;naissance (JJ/MM/AAAA)',
                textarea: { placeholder: 'Léa\nHugo\nMaïa;Durand;F\nLucas;Martin;G;;12/03/2015' },
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
        let lastExport = 0;
        exportBtn.addEventListener('click', (e) => {
            e.stopImmediatePropagation();
            const now = Date.now();
            if (now - lastExport < 1000) return;
            lastExport = now;
            const cls = activeClass();
            if (!cls || !cls.students.length) { flash('Rien à exporter.', 'err'); return; }
            const txt = CL.getStudents(cls.id).map(s => [s.prenom, s.nom || '', s.sexe || '', s.niveau, CL.formatDob(s.dob)].join(';')).join('\n');
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
        sortOpts.forEach(btn => btn.addEventListener('click', () => {
            const cls = activeClass(); if (!cls) return;
            CL.setSortMode(cls.id, btn.dataset.sort, widget);
            refreshAll();
            const msg = '✓ Tri par ' + (btn.dataset.sort === 'nom' ? 'nom' : 'prénom');
            if (innerEl.dataset.mode === 'doc') editFlash(msg, 'ok'); else flash(msg, 'ok');
        }));

        viewOpts.forEach(btn => btn.addEventListener('click', () => {
            const cls = activeClass(); if (!cls) return;
            CL.setViewMode(cls.id, btn.dataset.view, widget);
            refreshAll();
        }));

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

        // ── Onglets Enregistrement / Édition ──────────────────────────────
        function setMode(mode) {
            mode = mode === 'doc' ? 'doc' : 'edit';
            innerEl.dataset.mode = mode;
            widget.dataset.classeMode = mode;
            modeBtns.forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
            if (mode === 'doc') renderEdition();
        }
        modeBtns.forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));

        // ── Module Édition : génération des PDF ───────────────────────────
        let docBusy = false;

        function editFlash(msg, cls) {
            editStatus.textContent = msg;
            editStatus.className = 'classe-edit-status' + (cls ? ' ' + cls : '');
        }

        function renderEdition() {
            const cls = activeClass();
            if (!cls) { editInfo.textContent = ''; return; }
            const n  = cls.students.length;
            const lv = cls.levels || [];
            editInfo.textContent = cls.name + ' · ' + n + ' élève' + (n > 1 ? 's' : '') + (lv.length >= 2 ? ' · ' + lv.join(' / ') : '');
        }

        if (CE) {
            profInput.value = CE.getProf();
            yearInput.value = CE.getYear();
            profInput.addEventListener('change', () => CE.setProf(profInput.value));
            yearInput.addEventListener('change', () => { CE.setYear(yearInput.value); yearInput.value = CE.getYear(); });
        }

        docBtns.forEach(btn => btn.addEventListener('click', async () => {
            if (docBusy) return;
            if (!CE) { editFlash('Module Édition indisponible.', 'err'); return; }
            const cls = activeClass(); if (!cls) return;
            CE.setProf(profInput.value);
            CE.setYear(yearInput.value);
            docBusy = true;
            docBtns.forEach(b => b.disabled = true);
            editFlash('⏳ Génération en cours…');
            try {
                const file = await CE.generate(btn.dataset.doc, cls.id);
                editFlash('✓ ' + file, 'ok');
            } catch (err) {
                editFlash(err && err.empty ? 'La liste est vide !' : ((err && err.message) || 'Erreur lors de la génération.'), 'err');
                console.warn('ClasseEdition', err);
            } finally {
                docBusy = false;
                docBtns.forEach(b => b.disabled = false);
            }
        }));

        // ── Rendu initial ─────────────────────────────────────────────────
        refreshAll();
        setMode(widget.dataset.classeMode);

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
