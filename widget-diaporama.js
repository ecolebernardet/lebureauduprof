// ── Téléphone : ouverture directe en plein écran (bouton vert), comme le Taquin ──
// open()   : bascule le plein écran du widget ; isOpen() : vrai s'il est en plein écran.
// setKey   : nom de la fonction de restauration (widget._xxSetData) : si le widget est
//            restauré depuis une sauvegarde, le plein écran automatique est annulé.
// launchOnly : n'ouvrir que si le widget vient d'être lancé depuis un panneau.
if (!window._wfPhoneAutoMax) {
    window._wfPhoneAutoMax = function (widget, open, isOpen, setKey, launchOnly) {
        var phone = false;
        if (typeof isMobileBoardMode === 'function') { try { phone = !!isMobileBoardMode(); } catch (e) {} }
        if (!phone && window.matchMedia) phone = window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse)').matches;
        if (!phone) return;
        if (launchOnly && !(typeof window._wfLastLaunch === 'number' && Date.now() - window._wfLastLaunch <= 2500)) return;
        var restored = false, auto = false;
        if (setKey && typeof widget[setKey] === 'function') {
            var orig = widget[setKey];
            widget[setKey] = function () {
                restored = true;
                if (auto && isOpen()) open();
                auto = false;
                return orig.apply(this, arguments);
            };
        }
        requestAnimationFrame(function () {
            if (restored || isOpen() || !widget.isConnected) return;
            auto = true;
            open();
        });
    };
}

/* ═══════════════════════════════════════════════════════════════════
   widget-diaporama.js — Widget « Diaporama »
   Le Bureau du Prof

   Projette en diaporama les images d'un dossier de l'ordinateur :
   - bouton « Choisir un dossier », ou glisser-déposer un dossier
     (ou quelques images) directement sur le widget
   - images classées par nom (1, 2, 10… dans le bon ordre)
   - lecture automatique avec durée réglable et barre de progression,
     transitions (fondu, glissement, zoom lent, aucune)
   - navigation : boutons ‹ ›, clic sur l'image (tiers gauche = image
     précédente, reste = suivante), glissement du doigt, clavier
     (← → Page↑ Page↓ des télécommandes de présentation, Espace,
     Début / Fin, F pour le plein écran, Échap pour en sortir)
   - miniatures, ordre aléatoire, nom de l'image, sous-dossiers
   - bouton ⛶ « Projeter » : vrai plein écran de l'écran entier

   Barre du haut :
   - ⚙ réglages, nom du dossier (cliquer pour en choisir un autre)
   - boutons fenêtre jaune (réduire), vert (plein écran dans le
     tableau), rouge (fermer), identiques à ceux de l'éphéméride

   Les images restent sur l'ordinateur : elles ne sont PAS copiées dans
   le tableau. Sur Chrome / Edge (et l'application), l'accès au dossier
   est mémorisé dans le navigateur (IndexedDB) : au rechargement, le
   diaporama reprend tout seul ou après un clic sur « Reprendre ».
   Sur les autres navigateurs, il suffit de rouvrir le dossier.

   Utilisation : createWidget('diaporama')
   Le template #template-diaporama est injecté dans le DOM par ce fichier.
   Les réglages (data-cfg), le nom du dossier et l'image affichée sont
   sauvegardés avec le board (voir diapoGetData / diapoSetData, save-load.js).
   ═══════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    const DEFAULT_CFG = {
        interval: 5,          // secondes par image
        transition: 'fondu',  // 'fondu' | 'glisse' | 'zoom' | 'aucune'
        fit: 'contain',       // 'contain' : image entière ; 'cover' : remplir le cadre
        bg: 'noir',           // 'noir' | 'blanc' | 'flou'
        showName: false,      // afficher le nom de l'image
        loop: true,           // recommencer au début à la fin
        shuffle: false,       // ordre aléatoire
        recursive: false,     // inclure les sous-dossiers
        autoplay: false,      // lancer la lecture dès l'ouverture du dossier
        thumbs: false         // bandeau de miniatures
    };

    const INTERVALS = [2, 3, 5, 8, 10, 15, 20, 30, 60];
    const TRANSITIONS = [['fondu', 'Fondu'], ['glisse', 'Glissement'], ['zoom', 'Zoom lent'], ['aucune', 'Aucune']];
    const FITS = [['contain', 'Image entière'], ['cover', 'Remplir le cadre']];
    const BGS = [['noir', 'Noir'], ['blanc', 'Blanc'], ['flou', 'Image floutée']];

    const IMG_RE = /\.(jpe?g|jfif|png|gif|webp|bmp|svg|avif)$/i;
    const MAX_DEPTH = 5;
    const collator = new Intl.Collator('fr', { numeric: true, sensitivity: 'base' });

    /* ── Outils ───────────────────────────────────────────────────── */
    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const isImgName = n => !!n && n[0] !== '.' && IMG_RE.test(n);
    const displayName = n => String(n || '').replace(/^.*\//, '').replace(/\.[^.]+$/, '');
    const genId = () => 'dia_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    const plural = (n, w) => n + ' ' + w + (n > 1 ? 's' : '');

    // Empêche le déplacement du widget quand on clique sur un contrôle
    const STOP = ' onpointerdown="event.stopPropagation()" onmousedown="event.stopPropagation()" ontouchstart="event.stopPropagation()"';

    /* ── Mémoire du dossier (IndexedDB) ───────────────────────────────
       Sur Chrome / Edge, le « handle » du dossier peut être gardé dans le
       navigateur : il permet de rouvrir le même dossier au rechargement. */
    const DB_NAME = 'lebureauduprof-diaporama', STORE = 'dossiers';
    let dbPromise = null;
    function idb() {
        if (!dbPromise) dbPromise = new Promise((res, rej) => {
            if (!window.indexedDB) { rej(new Error('IndexedDB indisponible')); return; }
            const r = indexedDB.open(DB_NAME, 1);
            r.onupgradeneeded = () => r.result.createObjectStore(STORE);
            r.onsuccess = () => res(r.result);
            r.onerror = () => rej(r.error);
        });
        return dbPromise;
    }
    async function idbGet(k) {
        try {
            const db = await idb();
            return await new Promise(res => {
                const q = db.transaction(STORE).objectStore(STORE).get(k);
                q.onsuccess = () => res(q.result || null);
                q.onerror = () => res(null);
            });
        } catch (e) { return null; }
    }
    async function idbPut(k, v) {
        try {
            const db = await idb();
            db.transaction(STORE, 'readwrite').objectStore(STORE).put(v, k);
        } catch (e) {}
    }

    /* ── État ─────────────────────────────────────────────────────── */
    // Réglages : attribut data-cfg ; dossier mémorisé : attribut data-state
    // (nom, nombre d'images, image affichée) ; le reste vit en mémoire.
    const RT = new WeakMap();
    function S(root) {
        let s = RT.get(root);
        if (!s) {
            s = { all: [], files: [], order: [], pos: 0, folder: '', urls: new Map(), front: 0,
                  playing: false, timer: null, token: 0, pendingHandle: null, idleT: null, inited: false };
            RT.set(root, s);
        }
        return s;
    }

    function getCfg(root) {
        let cfg;
        try { cfg = JSON.parse(root.getAttribute('data-cfg') || '{}'); } catch (e) { cfg = {}; }
        cfg = Object.assign({}, DEFAULT_CFG, cfg);
        if (INTERVALS.indexOf(+cfg.interval) === -1) cfg.interval = DEFAULT_CFG.interval;
        cfg.interval = +cfg.interval;
        return cfg;
    }
    function setCfg(root, cfg) {
        root.setAttribute('data-cfg', JSON.stringify(cfg));
        if (typeof saveBoard === 'function') saveBoard();
    }
    function getState(root) {
        try { return Object.assign({ folder: '', n: 0, index: 0 }, JSON.parse(root.getAttribute('data-state') || '{}')); }
        catch (e) { return { folder: '', n: 0, index: 0 }; }
    }
    function setState(root, st) { root.setAttribute('data-state', JSON.stringify(st)); }

    function urlOf(s, entry) {
        let u = s.urls.get(entry);
        if (!u) { u = URL.createObjectURL(entry.file); s.urls.set(entry, u); }
        return u;
    }
    function revokeAll(s) {
        s.urls.forEach(u => { try { URL.revokeObjectURL(u); } catch (e) {} });
        s.urls.clear();
    }
    const curEntry = s => s.files.length ? s.files[s.order[s.pos]] : null;

    /* ── Construction du widget (une seule fois par .dia-root) ─────── */
    function build(root) {
        if (root.querySelector(':scope > .dia-stage')) return;
        if (!root.getAttribute('data-dia-id')) root.setAttribute('data-dia-id', genId());
        root.innerHTML =
            '<div class="dia-bar">' +
                '<button type="button" class="dia-gear" data-dia-action="settings" title="Réglages" aria-label="Réglages"' + STOP + '>⚙</button>' +
                '<button type="button" class="dia-folder" data-dia-action="pick" title="Choisir un dossier d\'images"' + STOP + '>📁 Choisir un dossier</button>' +
                '<div class="wf-btns"' + STOP + '>' +
                    '<button type="button" class="wf-btn wf-btn-min" data-dia-action="wf-min" title="Réduire" aria-label="Réduire"></button>' +
                    '<button type="button" class="wf-btn wf-btn-max" data-dia-action="wf-max" title="Plein écran" aria-label="Plein écran"></button>' +
                    '<button type="button" class="wf-btn wf-btn-close" data-dia-action="wf-close" title="Fermer" aria-label="Fermer"></button>' +
                '</div>' +
            '</div>' +
            '<div class="dia-stage" tabindex="-1">' +
                '<div class="dia-blur"></div>' +
                '<img class="dia-img" alt="" draggable="false">' +
                '<img class="dia-img" alt="" draggable="false">' +
                '<div class="dia-caption"></div>' +
                '<div class="dia-prog"><span></span></div>' +
                '<div class="dia-ctrls">' +
                    '<button type="button" class="dia-cb" data-dia-action="prev" title="Image précédente (←)" aria-label="Image précédente">❮</button>' +
                    '<button type="button" class="dia-cb dia-play" data-dia-action="play" title="Lecture (Espace)" aria-label="Lecture">▶</button>' +
                    '<button type="button" class="dia-cb" data-dia-action="next" title="Image suivante (→)" aria-label="Image suivante">❯</button>' +
                    '<button type="button" class="dia-count" data-dia-action="jump" title="Choisir une image" aria-label="Choisir une image"></button>' +
                    '<span class="dia-sep"></span>' +
                    '<button type="button" class="dia-cb dia-small" data-dia-action="pick" title="Ouvrir un autre dossier" aria-label="Ouvrir un autre dossier">📁</button>' +
                    '<button type="button" class="dia-cb dia-small" data-dia-action="shuffle" title="Ordre aléatoire" aria-label="Ordre aléatoire">🔀</button>' +
                    '<button type="button" class="dia-cb dia-small" data-dia-action="thumbs" title="Miniatures" aria-label="Miniatures">▦</button>' +
                    '<button type="button" class="dia-cb dia-small" data-dia-action="projo" title="Projeter sur tout l\'écran (F)" aria-label="Projeter">⛶</button>' +
                    '<button type="button" class="dia-cb dia-small dia-exitfull" data-dia-action="exitfull" title="Quitter le plein écran (Échap)" aria-label="Quitter le plein écran">⤡</button>' +
                '</div>' +
                '<div class="dia-jump" hidden></div>' +
                '<div class="dia-msg"></div>' +
            '</div>' +
            '<div class="dia-thumbs" hidden' + STOP + '></div>' +
            '<div class="dia-settings-wrap"></div>' +
            '<input type="file" class="dia-input" webkitdirectory directory multiple hidden>';

        const stage = root.querySelector('.dia-stage');
        const input = root.querySelector('.dia-input');

        /* Clic et glissement sur l'image */
        let down = null;
        stage.addEventListener('pointerdown', e => {
            e.stopPropagation();          // pas de déplacement du widget depuis l'image
            lastRoot = root;
            if (e.target.closest('.dia-ctrls, .dia-msg, .dia-jump') || e.button > 0) return;
            if (root.classList.contains('jump-open')) { closeJump(root); return; }   // clic à côté : on ferme la liste
            down = { x: e.clientX, y: e.clientY };
            try { stage.setPointerCapture(e.pointerId); } catch (err) {}
            try { stage.focus({ preventScroll: true }); } catch (err) {}
        });
        stage.addEventListener('pointerup', e => {
            if (!down) return;
            const dx = e.clientX - down.x, dy = e.clientY - down.y;
            down = null;
            if (!S(root).files.length) return;
            if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) step(root, dx < 0 ? 1 : -1);
            else if (Math.abs(dx) < 8 && Math.abs(dy) < 8) {
                const r = stage.getBoundingClientRect();
                step(root, (e.clientX - r.left) < r.width * 0.3 ? -1 : 1);
            }
        });
        stage.addEventListener('pointercancel', () => { down = null; });
        ['mousedown', 'touchstart'].forEach(t => stage.addEventListener(t, e => e.stopPropagation(), { passive: true }));

        /* Choix du dossier par le sélecteur classique (Firefox, Safari…) */
        input.addEventListener('change', () => {
            const files = Array.from(input.files || []);
            input.value = '';
            if (files.length) loadFromInput(root, files);
        });

        /* Glisser-déposer un dossier ou des images sur le widget */
        root.addEventListener('dragover', e => {
            if (!e.dataTransfer || Array.prototype.indexOf.call(e.dataTransfer.types, 'Files') === -1) return;
            e.preventDefault(); e.stopPropagation();
            e.dataTransfer.dropEffect = 'copy';
            root.classList.add('dia-drag');
        });
        root.addEventListener('dragleave', e => {
            if (!root.contains(e.relatedTarget)) root.classList.remove('dia-drag');
        });
        root.addEventListener('drop', e => onDrop(root, e));

        /* Commandes masquées après 2,5 s sans bouger la souris (plein écran) */
        root.addEventListener('pointermove', () => {
            lastRoot = root;
            const s = S(root);
            root.classList.remove('dia-idle');
            clearTimeout(s.idleT);
            s.idleT = setTimeout(() => root.classList.add('dia-idle'), 2500);
        });

        updateUI(root);
    }

    /* ── Messages au centre de l'image ────────────────────────────── */
    function setMsg(root, html) {
        const m = root.querySelector('.dia-msg');
        if (!m) return;
        m.innerHTML = html || '';
        m.classList.toggle('is-on', !!html);
    }
    function msgEmpty() {
        return '<div class="dia-msg-box">' +
            '<div class="dia-big">🖼️</div>' +
            '<div class="dia-title">Diaporama</div>' +
            '<div>Choisis le dossier qui contient tes images.</div>' +
            '<button type="button" class="dia-btn" data-dia-action="pick">📁 Choisir un dossier</button>' +
            '<div class="dia-hint">ou glisse-dépose un dossier ici<br>JPG, PNG, GIF, WebP, SVG…</div>' +
        '</div>';
    }
    function msgResume(st, canResume, note) {
        const info = '« ' + esc(st.folder) + ' »' + (st.n ? ' (' + plural(st.n, 'image') + ')' : '');
        return '<div class="dia-msg-box">' +
            '<div class="dia-big">📁</div>' +
            '<div class="dia-title">' + info + '</div>' +
            (canResume
                ? '<button type="button" class="dia-btn" data-dia-action="resume">▶ Reprendre le diaporama</button>' +
                  '<button type="button" class="dia-link" data-dia-action="pick">Choisir un autre dossier</button>'
                : '<div class="dia-hint">Par sécurité, le navigateur demande de rouvrir le dossier.</div>' +
                  '<button type="button" class="dia-btn" data-dia-action="pick">📁 Rouvrir le dossier</button>') +
            (note ? '<div class="dia-hint">' + esc(note) + '</div>' : '') +
        '</div>';
    }
    function msgLoading(name) {
        return '<div class="dia-msg-box"><div class="dia-spin"></div><div>Ouverture de « ' + esc(name || 'dossier') + ' »…</div></div>';
    }
    function msgNoImage(name) {
        return '<div class="dia-msg-box"><div class="dia-big">🙈</div>' +
            '<div>Aucune image dans « ' + esc(name) + ' ».</div>' +
            '<button type="button" class="dia-btn" data-dia-action="pick">📁 Choisir un autre dossier</button></div>';
    }

    /* ── Choix du dossier ─────────────────────────────────────────── */
    function canDirPicker() {
        return typeof window.showDirectoryPicker === 'function' && window.isSecureContext !== false;
    }
    function pickFolder(root) {
        if (canDirPicker()) {
            window.showDirectoryPicker({ id: 'lbdp-diaporama', mode: 'read', startIn: 'pictures' })
                .then(h => loadFromHandle(root, h, -1, false))
                .catch(err => {
                    if (err && err.name === 'AbortError') return;     // l'utilisateur a annulé
                    const input = root.querySelector('.dia-input');    // sélecteur non autorisé ici
                    if (input) input.click();
                });
        } else {
            const input = root.querySelector('.dia-input');
            if (input) input.click();
        }
    }

    async function readHandle(dir, depth, prefix) {
        const list = [];
        for await (const h of dir.values()) {
            if (h.kind === 'file') {
                if (!isImgName(h.name)) continue;
                try { list.push({ name: prefix + h.name, file: await h.getFile(), depth }); } catch (e) {}
            } else if (h.kind === 'directory' && depth < MAX_DEPTH && h.name[0] !== '.') {
                list.push(...await readHandle(h, depth + 1, prefix + h.name + '/'));
            }
        }
        return list;
    }

    function readAllEntries(reader) {
        return new Promise(res => {
            const out = [];
            const next = () => reader.readEntries(batch => {
                if (!batch.length) { res(out); return; }
                out.push(...batch); next();
            }, () => res(out));
            next();
        });
    }
    async function readEntryDir(dirEntry, depth, prefix) {
        const list = [];
        for (const en of await readAllEntries(dirEntry.createReader())) {
            if (en.isFile && isImgName(en.name)) {
                const f = await new Promise(r => en.file(r, () => r(null)));
                if (f) list.push({ name: prefix + en.name, file: f, depth });
            } else if (en.isDirectory && depth < MAX_DEPTH && en.name[0] !== '.') {
                list.push(...await readEntryDir(en, depth + 1, prefix + en.name + '/'));
            }
        }
        return list;
    }

    async function loadFromHandle(root, h, keepIndex, restoring) {
        const s = S(root);
        stopPlay(root);
        setMsg(root, msgLoading(h.name));
        let list;
        try { list = await readHandle(h, 0, ''); }
        catch (e) { setMsg(root, msgResume({ folder: h.name, n: 0 }, false, 'Le dossier n\'a pas pu être lu.')); return; }
        s.pendingHandle = h;
        if (!restoring) root.setAttribute('data-dia-id', genId());
        idbPut(root.getAttribute('data-dia-id'), h);
        finishLoad(root, list, h.name, keepIndex, restoring);
    }

    function loadFromInput(root, files) {
        const list = [];
        let folder = '';
        files.forEach(f => {
            const rel = f.webkitRelativePath || f.name;
            const parts = rel.split('/');
            if (!folder && parts.length > 1) folder = parts[0];
            if (!isImgName(f.name) || parts.some(p => p[0] === '.')) return;
            const inner = parts.length > 1 ? parts.slice(1) : parts;
            list.push({ name: inner.join('/'), file: f, depth: inner.length - 1 });
        });
        S(root).pendingHandle = null;
        root.setAttribute('data-dia-id', genId());
        finishLoad(root, list, folder || 'Images', -1, false);
    }

    function onDrop(root, e) {
        e.preventDefault(); e.stopPropagation();
        root.classList.remove('dia-drag');
        const dt = e.dataTransfer;
        if (!dt) return;
        // Tout lire tout de suite : ces objets ne sont plus valables après l'événement
        const items = Array.from(dt.items || []).filter(i => i.kind === 'file');
        const files = Array.from(dt.files || []);
        if (items.length && typeof items[0].getAsFileSystemHandle === 'function') {
            const ps = items.map(i => i.getAsFileSystemHandle().catch(() => null));
            Promise.all(ps).then(hs => {
                const dir = hs.find(h => h && h.kind === 'directory');
                if (dir) loadFromHandle(root, dir, -1, false);
                else loadDroppedFiles(root, files);
            });
            return;
        }
        const entries = items.map(i => (typeof i.webkitGetAsEntry === 'function') ? i.webkitGetAsEntry() : null).filter(Boolean);
        const dirEntry = entries.find(en => en.isDirectory);
        if (dirEntry) {
            stopPlay(root);
            setMsg(root, msgLoading(dirEntry.name));
            readEntryDir(dirEntry, 0, '').then(list => {
                S(root).pendingHandle = null;
                root.setAttribute('data-dia-id', genId());
                finishLoad(root, list, dirEntry.name, -1, false);
            });
            return;
        }
        loadDroppedFiles(root, files);
    }
    function loadDroppedFiles(root, files) {
        const list = files.filter(f => isImgName(f.name)).map(f => ({ name: f.name, file: f, depth: 0 }));
        if (!list.length) return;
        S(root).pendingHandle = null;
        root.setAttribute('data-dia-id', genId());
        finishLoad(root, list, 'Images déposées', -1, false);
    }

    /* ── Liste des images ─────────────────────────────────────────── */
    function applyFilter(root) {
        const s = S(root);
        const cfg = getCfg(root);
        s.files = cfg.recursive ? s.all.slice() : s.all.filter(f => f.depth === 0);
        if (!s.files.length) s.files = s.all.slice();   // toutes les images sont dans des sous-dossiers
    }

    // Construit l'ordre de passage ; l'image firstFi est affichée en premier
    function buildOrder(root, firstFi) {
        const s = S(root);
        const n = s.files.length;
        s.order = Array.from({ length: n }, (_, i) => i);
        if (getCfg(root).shuffle && n > 1) {
            for (let i = n - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [s.order[i], s.order[j]] = [s.order[j], s.order[i]];
            }
            const k = s.order.indexOf(firstFi);
            if (k > 0) [s.order[0], s.order[k]] = [s.order[k], s.order[0]];
            s.pos = 0;
        } else {
            s.pos = Math.max(0, Math.min(n - 1, firstFi));
        }
    }

    function finishLoad(root, list, folder, keepIndex, restoring) {
        const s = S(root);
        stopPlay(root);
        closeJump(root);
        revokeAll(s);
        list.sort((a, b) => collator.compare(a.name, b.name));
        s.all = list;
        s.folder = folder;
        root.querySelectorAll('.dia-img').forEach(img => { img.removeAttribute('src'); img.classList.remove('is-on'); img.style.cssText = ''; });
        if (!list.length) {
            s.files = []; s.order = []; s.pos = 0;
            root.classList.add('is-empty');
            setState(root, { folder, n: 0, index: 0 });
            setMsg(root, msgNoImage(folder));
            renderThumbs(root);
            updateUI(root);
            return;
        }
        applyFilter(root);
        const fi = (keepIndex >= 0 && keepIndex < s.files.length) ? keepIndex : 0;
        buildOrder(root, fi);
        root.classList.remove('is-empty');
        setMsg(root, null);
        setState(root, { folder, n: s.files.length, index: fi });
        renderThumbs(root);
        show(root, s.pos, 0);
        if (getCfg(root).autoplay) startPlay(root);
        updateUI(root);
        if (!restoring && typeof saveBoard === 'function') saveBoard();
    }

    /* ── Affichage d'une image ────────────────────────────────────── */
    async function show(root, pos, dir) {
        const s = S(root);
        const n = s.order.length;
        if (!n) return;
        pos = ((pos % n) + n) % n;
        s.pos = pos;
        const entry = curEntry(s);
        const url = urlOf(s, entry);
        const token = ++s.token;
        const cfg = getCfg(root);
        const imgs = root.querySelectorAll('.dia-img');
        const cur = imgs[s.front], nxt = imgs[1 - s.front];

        updateUI(root);
        markThumb(root);

        nxt.src = url;
        try { await nxt.decode(); } catch (e) {}
        if (token !== s.token) return;   // une autre image a été demandée entre-temps

        nxt.classList.toggle('kb-alt', pos % 2 === 1);
        if (cfg.transition === 'glisse' && dir && cur.classList.contains('is-on')) {
            // l'ancienne image sort d'un côté, la nouvelle entre de l'autre
            nxt.style.transition = 'none';
            nxt.style.transform = 'translateX(' + (dir * 100) + '%)';
            nxt.style.opacity = '1';
            cur.style.opacity = '1';
            void nxt.offsetWidth;
            nxt.style.transition = '';
            nxt.style.transform = 'translateX(0)';
            cur.style.transform = 'translateX(' + (-dir * 100) + '%)';
            cur.classList.remove('is-on');
            nxt.classList.add('is-on');
            setTimeout(() => {
                cur.style.cssText = '';
                if (token === s.token) { nxt.style.transform = ''; nxt.style.opacity = ''; }
            }, 600);
        } else {
            cur.style.cssText = ''; nxt.style.cssText = '';
            cur.classList.remove('is-on');
            nxt.classList.add('is-on');
        }
        s.front = 1 - s.front;

        // Fond flouté
        const blur = root.querySelector('.dia-blur');
        if (blur) {
            blur.style.backgroundImage = cfg.bg === 'flou' ? 'url("' + url + '")' : '';
            blur.classList.toggle('is-on', cfg.bg === 'flou');
        }

        // Image suivante préchargée pour un passage sans attente
        if (n > 1) {
            const nextEntry = s.files[s.order[(pos + 1) % n]];
            const pre = new Image();
            pre.decoding = 'async';
            pre.src = urlOf(s, nextEntry);
        }

        schedule(root);
    }

    // Navigation manuelle (boutons, clavier, clic, glissement)
    function step(root, d) {
        const s = S(root);
        const n = s.order.length;
        if (!n) return;
        const target = s.pos + d;
        if (!getCfg(root).loop && (target < 0 || target >= n)) return;
        show(root, target, d);
    }
    function go(root, pos) {
        const s = S(root);
        if (!s.order.length || pos === s.pos) return;
        show(root, pos, pos > s.pos ? 1 : -1);
    }

    /* ── Lecture automatique ──────────────────────────────────────── */
    function restartProg(root, on) {
        const p = root.querySelector('.dia-prog');
        if (!p) return;
        p.classList.remove('is-run');
        if (on) { void p.offsetWidth; p.classList.add('is-run'); }
    }
    function schedule(root) {
        const s = S(root);
        clearTimeout(s.timer);
        if (!s.playing) { restartProg(root, false); return; }
        const cfg = getCfg(root);
        const n = s.order.length;
        if (s.pos >= n - 1 && !cfg.loop) {    // dernière image : on s'arrête dessus
            s.timer = setTimeout(() => stopPlay(root), cfg.interval * 1000);
            restartProg(root, true);
            return;
        }
        restartProg(root, true);
        s.timer = setTimeout(() => { if (root.isConnected) show(root, s.pos + 1, 1); }, cfg.interval * 1000);
    }
    function startPlay(root) {
        const s = S(root);
        if (!s.order.length) return;
        s.playing = true;
        if (s.pos >= s.order.length - 1 && !getCfg(root).loop) show(root, 0, 1);
        else schedule(root);
        updateUI(root);
    }
    function stopPlay(root) {
        const s = S(root);
        s.playing = false;
        clearTimeout(s.timer);
        restartProg(root, false);
        updateUI(root);
    }
    function togglePlay(root) {
        if (S(root).playing) stopPlay(root); else startPlay(root);
    }

    /* ── Miniatures ───────────────────────────────────────────────── */
    function renderThumbs(root) {
        const strip = root.querySelector('.dia-thumbs');
        if (!strip) return;
        const s = S(root);
        const on = getCfg(root).thumbs && s.files.length > 0;
        strip.hidden = !on;
        if (!on) { strip.innerHTML = ''; return; }
        strip.innerHTML = s.order.map((fi, p) => {
            const f = s.files[fi];
            return '<button type="button" class="dia-th" data-dia-action="go" data-pos="' + p + '" title="' + esc(displayName(f.name)) + '">' +
                   '<img loading="lazy" decoding="async" alt="" draggable="false" src="' + urlOf(s, f) + '"></button>';
        }).join('');
        markThumb(root);
    }
    function markThumb(root) {
        const strip = root.querySelector('.dia-thumbs');
        if (!strip || strip.hidden) return;
        const s = S(root);
        let cur = null;
        strip.querySelectorAll('.dia-th').forEach(b => {
            const is = +b.getAttribute('data-pos') === s.pos;
            b.classList.toggle('is-cur', is);
            if (is) cur = b;
        });
        if (cur) {
            // défilement du bandeau seulement (pas de la page)
            const left = cur.offsetLeft - strip.clientWidth / 2 + cur.offsetWidth / 2;
            try { strip.scrollTo({ left, behavior: 'smooth' }); } catch (e) { strip.scrollLeft = left; }
        }
    }

    /* ── Choix d'une image par son numéro (clic sur « 3 / 24 ») ────── */
    function openJump(root) {
        const s = S(root);
        const box = root.querySelector('.dia-jump');
        if (!box || !s.files.length) return;
        const n = s.order.length;
        box.innerHTML =
            '<div class="dia-jump-head">' +
                '<label>Aller à l’image n°&nbsp;<input type="number" class="dia-jump-input" min="1" max="' + n + '" value="' + (s.pos + 1) + '"></label>' +
                '<span class="dia-jump-tot">/ ' + n + '</span>' +
                '<button type="button" class="dia-jump-ok" data-dia-action="jump-ok">OK</button>' +
                '<button type="button" class="dia-jump-x" data-dia-action="jump-close" title="Fermer" aria-label="Fermer">✕</button>' +
            '</div>' +
            '<div class="dia-jump-list">' +
                s.order.map((fi, p) => {
                    const f = s.files[fi];
                    return '<button type="button" class="dia-jump-item' + (p === s.pos ? ' is-cur' : '') + '" data-dia-action="go" data-pos="' + p + '">' +
                        '<span class="dia-jump-num">' + (p + 1) + '</span>' +
                        '<img loading="lazy" decoding="async" alt="" draggable="false" src="' + urlOf(s, f) + '">' +
                        '<span class="dia-jump-name">' + esc(displayName(f.name)) + '</span></button>';
                }).join('') +
            '</div>';
        box.hidden = false;
        root.classList.add('jump-open');
        const list = box.querySelector('.dia-jump-list');
        const cur = box.querySelector('.dia-jump-item.is-cur');
        if (list && cur) list.scrollTop = cur.offsetTop - list.clientHeight / 2 + cur.offsetHeight / 2;
        const input = box.querySelector('.dia-jump-input');
        if (input) { try { input.focus({ preventScroll: true }); input.select(); } catch (e) {} }
    }
    function closeJump(root) {
        const box = root.querySelector('.dia-jump');
        if (!box || box.hidden) return;
        box.hidden = true;
        box.innerHTML = '';
        root.classList.remove('jump-open');
        try { root.querySelector('.dia-stage').focus({ preventScroll: true }); } catch (e) {}
    }
    function jumpToTyped(root) {
        const input = root.querySelector('.dia-jump-input');
        const n = S(root).order.length;
        const v = input ? parseInt(input.value, 10) : NaN;
        if (!isFinite(v) || v < 1 || v > n) { if (input) { input.classList.add('is-bad'); input.select(); } return; }
        closeJump(root);
        go(root, v - 1);
    }

    /* ── Mise à jour de l'interface ───────────────────────────────── */
    function updateUI(root) {
        const stage = root.querySelector('.dia-stage');
        if (!stage) return;
        const cfg = getCfg(root), s = S(root), st = getState(root);
        const n = s.files.length;
        stage.dataset.trans = cfg.transition;
        stage.dataset.bg = cfg.bg;
        stage.dataset.name = cfg.showName ? '1' : '0';
        stage.style.setProperty('--dia-fit', cfg.fit);
        stage.style.setProperty('--dia-int', cfg.interval + 's');

        const folderBtn = root.querySelector('.dia-folder');
        if (folderBtn) {
            folderBtn.textContent = n ? '📁 ' + s.folder + ' · ' + plural(n, 'image')
                                      : (st.folder ? '📁 ' + st.folder : '📁 Choisir un dossier');
        }
        const count = root.querySelector('.dia-count');
        if (count) count.textContent = n ? (s.pos + 1) + ' / ' + n : '';
        const play = root.querySelector('.dia-play');
        if (play) {
            play.textContent = s.playing ? '❚❚' : '▶';
            play.title = s.playing ? 'Pause (Espace)' : 'Lecture (Espace)';
        }
        const tog = (a, on) => { const b = root.querySelector('[data-dia-action="' + a + '"].dia-cb'); if (b) b.classList.toggle('is-on', on); };
        tog('shuffle', cfg.shuffle);
        tog('thumbs', cfg.thumbs);
        const cap = root.querySelector('.dia-caption');
        if (cap) { const e = curEntry(s); cap.textContent = e ? displayName(e.name) : ''; }
        root.classList.toggle('is-empty', !n);
        root.classList.toggle('is-playing', s.playing);
    }

    /* ── Réglages ─────────────────────────────────────────────────── */
    function buildSettings(cfg) {
        const opts = (list, val) => list.map(([v, l]) => '<option value="' + v + '"' + (String(val) === String(v) ? ' selected' : '') + '>' + l + '</option>').join('');
        const chk = (k, lbl) => '<label class="dia-chk"><input type="checkbox" data-dia-cfg="' + k + '"' + (cfg[k] ? ' checked' : '') + '> ' + lbl + '</label>';
        return '<div class="dia-settings"' + STOP + '>' +
            '<div class="dia-set-title">Réglages du diaporama</div>' +
            '<div class="dia-grid">' +
                '<label class="dia-lbl">Durée de chaque image<select data-dia-cfg="interval">' +
                    opts(INTERVALS.map(v => [v, v + ' secondes']), cfg.interval) + '</select></label>' +
                '<label class="dia-lbl">Transition<select data-dia-cfg="transition">' + opts(TRANSITIONS, cfg.transition) + '</select></label>' +
                '<label class="dia-lbl">Cadrage<select data-dia-cfg="fit">' + opts(FITS, cfg.fit) + '</select></label>' +
                '<label class="dia-lbl">Fond<select data-dia-cfg="bg">' + opts(BGS, cfg.bg) + '</select></label>' +
            '</div>' +
            chk('autoplay', 'Lancer la lecture dès l’ouverture du dossier') +
            chk('loop', 'Recommencer au début après la dernière image') +
            chk('shuffle', 'Ordre aléatoire') +
            chk('showName', 'Afficher le nom de l’image') +
            chk('thumbs', 'Afficher les miniatures') +
            chk('recursive', 'Inclure les images des sous-dossiers') +
            '<button type="button" class="dia-set-btn" data-dia-action="pick">📁 Choisir un autre dossier</button>' +
            '<div class="dia-note">Les images restent sur ton ordinateur : elles ne sont pas copiées dans le tableau. ' +
                'Au prochain chargement, il suffira de cliquer sur « Reprendre » (Chrome, Edge) ou de rouvrir le dossier.</div>' +
            '<div class="dia-note">Clavier : ← → (ou télécommande de présentation) pour changer d’image, Espace pour lecture / pause, F pour le plein écran, Échap pour en sortir.</div>' +
            '<button type="button" class="dia-done" data-dia-action="settings-close">Terminé</button>' +
        '</div>';
    }
    function toggleSettings(root, force) {
        const wrap = root.querySelector('.dia-settings-wrap');
        if (!wrap) return;
        const open = force !== undefined ? force : !wrap.innerHTML;
        wrap.innerHTML = open ? buildSettings(getCfg(root)) : '';
    }

    /* ── Boutons fenêtre : réduire / plein écran / fermer ───────────── */
    function toggleFull(root, force) {
        const full = force !== undefined ? force : !root.classList.contains('dia-full');
        root.classList.toggle('dia-full', full);
        const widget = root.closest('.widget');
        if (widget) widget.classList.toggle('dia-is-full', full);
        const b = root.querySelector('[data-dia-action="wf-max"]');
        if (b) b.title = full ? 'Quitter le plein écran' : 'Plein écran';
        if (!full) root.classList.remove('dia-projo');
        if (!full && document.fullscreenElement === root) { try { document.exitFullscreen(); } catch (e) {} }
        if (full) {
            const s = S(root);
            root.classList.remove('dia-idle');
            clearTimeout(s.idleT);
            s.idleT = setTimeout(() => root.classList.add('dia-idle'), 2500);
            try { root.querySelector('.dia-stage').focus({ preventScroll: true }); } catch (e) {}
        }
        setTimeout(() => markThumb(root), 50);
    }

    // Vrai plein écran (tout l'écran, barres du navigateur comprises)
    function projo(root) {
        if (document.fullscreenElement === root || root.classList.contains('dia-projo')) { toggleFull(root, false); return; }
        toggleFull(root, true);
        root.classList.add('dia-projo');
        if (typeof root.requestFullscreen === 'function') {
            root.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
        }
    }
    document.addEventListener('fullscreenchange', () => {
        // sortie du vrai plein écran (Échap) : on quitte aussi le plein écran du tableau
        document.querySelectorAll('.dia-root.dia-full').forEach(r => {
            if (r._diaWasFs && document.fullscreenElement !== r) toggleFull(r, false);
            r._diaWasFs = document.fullscreenElement === r;
        });
    });

    function minimizeWidget(root) {
        const widget = root.closest('.widget');
        if (!widget || typeof window._wfMiniBarCollapse !== 'function') return;
        if (root.classList.contains('dia-full')) toggleFull(root, false);
        stopPlay(root);
        toggleSettings(root, false);
        closeJump(root);
        const box = root.closest('.editor-container') || root;
        box.style.visibility = 'hidden'; // le diaporama ne doit pas passer par-dessus la mini-barre
        window._wfMiniBarCollapse(widget, '🖼️ Diaporama', {
            onExpand: () => { box.style.visibility = ''; updateUI(root); markThumb(root); }
        });
    }

    function closeWidget(root) {
        const widget = root.closest('.widget');
        if (!widget) return;
        if (root.classList.contains('dia-full')) toggleFull(root, false);
        if (typeof snapshotNow === 'function') snapshotNow();
        widget.remove();
        if (typeof saveBoard === 'function') saveBoard();
    }

    function cleanup(root) {
        const s = RT.get(root);
        if (!s) return;
        clearTimeout(s.timer); clearTimeout(s.idleT);
        s.playing = false;
        revokeAll(s);
        RT.delete(root);
    }

    /* ── Reprise après rechargement du tableau ────────────────────── */
    async function tryRestore(root) {
        const st = getState(root);
        const s = S(root);
        if (s.files.length) return;
        if (!st.folder) { setMsg(root, msgEmpty()); updateUI(root); return; }
        const h = await idbGet(root.getAttribute('data-dia-id'));
        if (S(root).files.length) return;
        if (h && typeof h.queryPermission === 'function') {
            s.pendingHandle = h;
            let p = 'prompt';
            try { p = await h.queryPermission({ mode: 'read' }); } catch (e) {}
            if (p === 'granted') { loadFromHandle(root, h, st.index, true); return; }
            setMsg(root, msgResume(st, true));
        } else {
            setMsg(root, msgResume(st, false));
        }
        updateUI(root);
    }

    async function resume(root) {
        const s = S(root);
        const h = s.pendingHandle;
        if (!h) { pickFolder(root); return; }
        let p = 'denied';
        try { p = await h.requestPermission({ mode: 'read' }); } catch (e) {}
        const st = getState(root);
        if (p === 'granted') loadFromHandle(root, h, st.index, true);
        else setMsg(root, msgResume(st, true, 'Accès refusé : tu peux réessayer ou choisir le dossier.'));
    }

    function init(root) {
        const s = S(root);
        build(root);
        if (s.inited) return;
        s.inited = true;
        tryRestore(root);
    }

    /* ── Événements (délégués : survivent à la sauvegarde/restauration) ── */
    let lastRoot = null;

    document.addEventListener('click', function (e) {
        const btn = e.target.closest && e.target.closest('[data-dia-action]');
        if (!btn) return;
        const root = btn.closest('.dia-root');
        if (!root) return;
        e.stopPropagation();
        lastRoot = root;
        const act = btn.getAttribute('data-dia-action');
        switch (act) {
            case 'wf-min':   minimizeWidget(root); break;
            case 'wf-max':   toggleFull(root); break;
            case 'wf-close': closeWidget(root); break;
            case 'exitfull': toggleFull(root, false); break;
            case 'projo':    projo(root); break;
            case 'pick':     toggleSettings(root, false); closeJump(root); pickFolder(root); break;
            case 'resume':   resume(root); break;
            case 'prev':     step(root, -1); break;
            case 'next':     step(root, 1); break;
            case 'play':     togglePlay(root); break;
            case 'go':       closeJump(root); go(root, +btn.getAttribute('data-pos')); break;
            case 'jump':     if (root.classList.contains('jump-open')) closeJump(root); else openJump(root); break;
            case 'jump-ok':  jumpToTyped(root); break;
            case 'jump-close': closeJump(root); break;
            case 'settings': toggleSettings(root); break;
            case 'settings-close': toggleSettings(root, false); break;
            case 'shuffle':
            case 'thumbs': {
                const cfg = getCfg(root);
                cfg[act] = !cfg[act];
                setCfg(root, cfg);
                applyCfgChange(root, act);
                break;
            }
        }
    }, true);

    // Réglages modifiés (listes et cases à cocher du panneau ⚙)
    document.addEventListener('change', function (e) {
        const t = e.target;
        if (!t.hasAttribute || !t.hasAttribute('data-dia-cfg')) return;
        const root = t.closest('.dia-root');
        if (!root) return;
        const key = t.getAttribute('data-dia-cfg');
        const cfg = getCfg(root);
        cfg[key] = t.type === 'checkbox' ? t.checked : (key === 'interval' ? +t.value : t.value);
        setCfg(root, cfg);
        applyCfgChange(root, key);
    });

    function applyCfgChange(root, key) {
        const s = S(root);
        const cur = curEntry(s);
        if (key === 'shuffle' || key === 'recursive') {
            if (key === 'recursive') applyFilter(root);
            const fi = cur ? Math.max(0, s.files.indexOf(cur)) : 0;
            buildOrder(root, fi);
            if (s.files.length) setState(root, { folder: s.folder, n: s.files.length, index: fi });
            renderThumbs(root);
            if (s.files.length && curEntry(s) !== cur) show(root, s.pos, 0);
        }
        if (key === 'thumbs') renderThumbs(root);
        if (key === 'interval' && s.playing) schedule(root);
        if (key === 'bg') {
            const blur = root.querySelector('.dia-blur');
            const e = curEntry(s);
            if (blur) {
                const on = getCfg(root).bg === 'flou' && e;
                blur.style.backgroundImage = on ? 'url("' + urlOf(s, e) + '")' : '';
                blur.classList.toggle('is-on', !!on);
            }
        }
        // les cases du panneau ⚙ suivent les boutons 🔀 et ▦
        const box = root.querySelector('.dia-settings [data-dia-cfg="' + key + '"]');
        if (box && box.type === 'checkbox') box.checked = !!getCfg(root)[key];
        updateUI(root);
        markThumb(root);
    }

    // Clic en dehors de la fenêtre « Aller à l'image » : on la ferme
    document.addEventListener('pointerdown', function (e) {
        // (les clics dans l'image sont gérés par le widget lui-même)
        document.querySelectorAll('.dia-root.jump-open').forEach(r => {
            const stage = r.querySelector('.dia-stage');
            if (!stage || !stage.contains(e.target)) closeJump(r);
        });
    }, true);

    /* ── Clavier ──────────────────────────────────────────────────── */
    const isEditable = el => !!(el && el.closest && el.closest('input, textarea, select, [contenteditable="true"], [contenteditable=""]'));
    function activeRoot() {
        const full = Array.from(document.querySelectorAll('.dia-root.dia-full')).pop();
        if (full) return full;
        const ae = document.activeElement;
        if (ae && ae.closest) {
            const r = ae.closest('.dia-root');
            if (r) return isEditable(ae) ? null : r;
            const w = ae.closest('.widget');
            const r2 = w && w.querySelector('.dia-root');
            if (r2) return r2;
            if (isEditable(ae)) return null;   // saisie en cours dans un autre widget
        }
        if (lastRoot && lastRoot.isConnected && lastRoot.matches(':hover')) return lastRoot;
        return null;
    }

    document.addEventListener('keydown', function (e) {
        // Saisie dans les réglages : pas de raccourcis du board
        if (e.target.closest && e.target.closest('.dia-settings')) { e.stopPropagation(); return; }
        // Fenêtre « Aller à l'image » : Entrée valide, Échap ferme, pas de raccourcis du board
        const jump = e.target.closest && e.target.closest('.dia-jump');
        if (jump) {
            const r = jump.closest('.dia-root');
            if (e.key === 'Enter' && e.target.classList.contains('dia-jump-input')) { e.preventDefault(); jumpToTyped(r); }
            else if (e.key === 'Escape') { e.preventDefault(); closeJump(r); }
            e.stopPropagation();
            return;
        }
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        const root = activeRoot();
        if (!root) return;
        const s = S(root);
        const n = s.order.length;
        const k = e.key;
        // Espace / Entrée sur un bouton du widget : c'est le bouton qui agit
        if ((k === ' ' || k === 'Enter') && e.target.closest && e.target.closest('button')) return;
        let done = true;
        if ((k === 'ArrowRight' || k === 'PageDown') && n) step(root, 1);
        else if ((k === 'ArrowLeft' || k === 'PageUp') && n) step(root, -1);
        else if (k === ' ' && n) togglePlay(root);
        else if (k === 'Home' && n) go(root, 0);
        else if (k === 'End' && n) go(root, n - 1);
        else if (k === 'f' || k === 'F') toggleFull(root);
        else if (k === 'Escape' && root.classList.contains('dia-full')) toggleFull(root, false);
        else done = false;
        if (done) { e.preventDefault(); e.stopPropagation(); }
    }, true);

    /* ── Redimensionnement libre ──────────────────────────────────
       La poignée du board (.custom-resize-handle) est interceptée pour
       ce widget : largeur et hauteur suivent la souris. ─────────────── */
    const MIN_W = 280, MIN_H = 200, MAX_W = 3600, MAX_H = 2400;

    function diaBox(widget) {
        const root = widget.querySelector('.dia-root');
        return root ? (root.closest('.editor-container') || root) : null;
    }
    function widgetExtra(widget, box) {
        return {
            w: /px$/.test(widget.style.width)  ? widget.offsetWidth  - box.offsetWidth  : null,
            h: /px$/.test(widget.style.height) ? widget.offsetHeight - box.offsetHeight : null
        };
    }
    function applySize(widget, box, w, h, extra) {
        w = Math.round(Math.min(MAX_W, Math.max(MIN_W, w)));
        h = Math.round(Math.min(MAX_H, Math.max(MIN_H, h)));
        box.style.width = w + 'px';
        box.style.height = h + 'px';
        if (extra.w !== null) widget.style.width  = (w + extra.w) + 'px';
        if (extra.h !== null) widget.style.height = (h + extra.h) + 'px';
    }
    function startResize(e, widget) {
        const box = diaBox(widget);
        if (!box) return;
        e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
        const w0 = box.offsetWidth, h0 = box.offsetHeight;
        const extra = widgetExtra(widget, box);
        const x0 = e.clientX, y0 = e.clientY;
        const move = ev => applySize(widget, box, w0 + ev.clientX - x0, h0 + ev.clientY - y0, extra);
        const up = () => {
            window.removeEventListener('pointermove', move, true);
            window.removeEventListener('pointerup', up, true);
            window.removeEventListener('pointercancel', up, true);
            document.body.style.cursor = '';
            if (typeof saveBoard === 'function') saveBoard();
        };
        document.body.style.cursor = 'nwse-resize';
        window.addEventListener('pointermove', move, true);
        window.addEventListener('pointerup', up, true);
        window.addEventListener('pointercancel', up, true);
    }
    function onResizeDown(e) {
        const handle = e.target.closest && e.target.closest('.custom-resize-handle');
        if (!handle) return;
        const widget = handle.closest('.widget');
        if (!widget || !widget.querySelector('.dia-root')) return;
        if (widget.classList.contains('dia-is-full') || widget.querySelector('.wf-mini-bar')) return;
        if (e.type === 'pointerdown') { startResize(e, widget); return; }
        // on bloque aussi mousedown / touchstart pour que le redimensionnement du board ne démarre pas
        e.stopPropagation(); e.stopImmediatePropagation();
        if (e.cancelable) e.preventDefault();
    }
    ['pointerdown', 'mousedown', 'touchstart'].forEach(t =>
        document.addEventListener(t, onResizeDown, { capture: true, passive: false }));

    /* ── Hydratation : nouveaux widgets et boards rechargés ──────── */
    function hydrate(node) {
        if (!(node instanceof Element)) return;
        const roots = node.matches('.dia-root') ? [node] : Array.from(node.querySelectorAll('.dia-root'));
        roots.forEach(r => {
            init(r);
            // Sur téléphone, ouverture directe en plein écran (bouton vert) —
            // seulement pour un widget qui vient d'être lancé depuis un panneau
            const w = r.closest('.widget');
            if (w && !w._diaAutoMax) {
                w._diaAutoMax = true;
                window._wfPhoneAutoMax(w, () => toggleFull(r), () => r.classList.contains('dia-full'), null, true);
            }
        });
    }
    const mo = new MutationObserver(muts => {
        for (const m of muts) {
            m.addedNodes.forEach(n => {
                if (n instanceof Element && (n.matches('.widget, .dia-root') || n.querySelector('.dia-root'))) {
                    // on ne ré-hydrate pas pour nos propres mises à jour internes
                    if (n.closest('.dia-root') && !n.matches('.dia-root')) return;
                    hydrate(n);
                }
            });
            // Widget supprimé : arrêt de la lecture et libération de la mémoire
            m.removedNodes.forEach(n => {
                if (!(n instanceof Element)) return;
                const roots = n.matches('.dia-root') ? [n] : Array.from(n.querySelectorAll('.dia-root'));
                roots.forEach(r => setTimeout(() => { if (!r.isConnected) cleanup(r); }, 0));
            });
        }
    });

    /* ── Template et styles ───────────────────────────────────────── */
    function injectTemplate() {
        if (document.getElementById('template-diaporama')) return;
        const tpl = document.createElement('template');
        tpl.id = 'template-diaporama';
        tpl.innerHTML =
            '<div class="editor-container" style="width:640px;height:420px;">' +
                '<div class="dia-root" data-cfg=\'' + JSON.stringify(DEFAULT_CFG) + '\'></div>' +
            '</div>';
        document.body.appendChild(tpl);
    }

    function injectStyles() {
        if (document.getElementById('dia-styles')) return;
        const st = document.createElement('style');
        st.id = 'dia-styles';
        st.textContent = `
.dia-root{
  container-type:inline-size; position:relative; width:100%; height:100%; box-sizing:border-box;
  display:flex; flex-direction:column; overflow:hidden; background:#18181c; color:#eee;
  font-family:system-ui,-apple-system,"Segoe UI",sans-serif; font-size:13px; user-select:none;
}
.dia-bar{flex:none;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:8px;
  padding:5px 10px;background:#232329;border-bottom:1px solid #2f2f37}
.dia-gear{border:0;background:none;color:#8d8d99;font-size:16px;line-height:1;cursor:pointer;padding:3px 5px;border-radius:5px}
.dia-gear:hover{color:#fff;background:rgba(255,255,255,.08)}
.dia-folder{justify-self:center;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
  border:0;background:rgba(255,255,255,.07);color:#ddd;border-radius:99px;padding:3px 12px;font:inherit;font-size:12px;cursor:pointer}
.dia-folder:hover{background:rgba(255,255,255,.14);color:#fff}
.dia-bar :focus-visible{outline:2px solid #4a90e2;outline-offset:1px}
.dia-stage{position:relative;flex:1;min-height:0;overflow:hidden;background:#000;outline:none;touch-action:none;cursor:pointer}
.dia-stage[data-bg="blanc"]{background:#fff}
.dia-root.is-empty .dia-stage{cursor:default;background:#101013}
.dia-blur{position:absolute;inset:-40px;background-size:cover;background-position:center;
  filter:blur(28px) brightness(.65);transform:scale(1.08);opacity:0;transition:opacity .6s}
.dia-stage[data-bg="flou"] .dia-blur.is-on{opacity:1}
.dia-img{position:absolute;inset:0;width:100%;height:100%;object-fit:var(--dia-fit,contain);
  opacity:0;pointer-events:none;-webkit-user-drag:none}
.dia-img.is-on{opacity:1}
.dia-stage[data-trans="fondu"] .dia-img{transition:opacity .7s ease}
.dia-stage[data-trans="glisse"] .dia-img{transition:transform .55s cubic-bezier(.4,0,.2,1)}
.dia-stage[data-trans="zoom"] .dia-img{transition:opacity 1s ease}
.dia-stage[data-trans="zoom"] .dia-img.is-on{animation:dia-kb var(--dia-int,5s) linear forwards}
.dia-stage[data-trans="zoom"] .dia-img.kb-alt.is-on{animation-name:dia-kb2}
@keyframes dia-kb{from{transform:scale(1)}to{transform:scale(1.12) translate(-1.5%,-1%)}}
@keyframes dia-kb2{from{transform:scale(1.12) translate(1.5%,1%)}to{transform:scale(1)}}
.dia-caption{position:absolute;left:12px;top:10px;max-width:calc(100% - 24px);padding:4px 10px;border-radius:6px;
  background:rgba(0,0,0,.55);color:#fff;font-size:clamp(12px,2.6cqw,28px);z-index:2;display:none;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;pointer-events:none}
.dia-stage[data-name="1"] .dia-caption:not(:empty){display:block}
.dia-prog{position:absolute;left:0;right:0;bottom:0;height:3px;z-index:2;pointer-events:none;opacity:0}
.dia-prog.is-run{opacity:1}
.dia-prog span{display:block;height:100%;width:100%;background:rgba(255,255,255,.75);transform-origin:left;transform:scaleX(0)}
.dia-prog.is-run span{animation:dia-prog var(--dia-int,5s) linear forwards}
@keyframes dia-prog{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.dia-ctrls{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);z-index:3;display:flex;align-items:center;gap:2px;
  padding:4px 8px;border-radius:99px;background:rgba(18,18,22,.75);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);
  opacity:0;transition:opacity .2s;cursor:default;white-space:nowrap;max-width:calc(100% - 16px)}
.dia-stage:hover .dia-ctrls,.dia-stage:focus-within .dia-ctrls{opacity:1}
.dia-root.is-empty .dia-ctrls,.dia-root.is-empty .dia-prog{display:none}
.dia-cb{width:34px;height:34px;flex:none;display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:50%;
  background:transparent;color:#fff;font-size:17px;line-height:1;cursor:pointer;padding:0}
.dia-cb:hover{background:rgba(255,255,255,.16)}
.dia-cb:focus-visible{outline:2px solid #4a90e2}
.dia-cb.dia-play{width:40px;height:40px;background:#fff;color:#111;font-size:15px;margin:0 2px}
.dia-cb.dia-play:hover{background:#e6e6e6}
.dia-cb.dia-small{width:30px;height:30px;font-size:14px;color:#ccc}
.dia-cb.is-on{color:#ffd54a;background:rgba(255,213,74,.14)}
.dia-exitfull{display:none !important}
.dia-root.dia-projo .dia-exitfull{display:inline-flex !important}
.dia-count{min-width:54px;height:28px;padding:0 8px;text-align:center;font:inherit;font-size:12px;color:#ddd;font-variant-numeric:tabular-nums;
  border:1px solid rgba(255,255,255,.18);border-radius:99px;background:transparent;cursor:pointer}
.dia-count:hover,.dia-root.jump-open .dia-count{background:rgba(255,255,255,.16);color:#fff}
.dia-count:focus-visible{outline:2px solid #4a90e2}
/* Fenêtre « Aller à l'image » */
.dia-root.jump-open .dia-ctrls{opacity:1 !important;pointer-events:auto !important}
.dia-root.jump-open,.dia-root.jump-open .dia-stage{cursor:default !important}
.dia-jump{position:absolute;left:50%;bottom:62px;transform:translateX(-50%);z-index:6;width:min(340px,calc(100% - 20px));
  max-height:calc(100% - 80px);display:flex;flex-direction:column;border-radius:12px;background:rgba(24,24,30,.96);
  box-shadow:0 8px 28px rgba(0,0,0,.5);color:#eee;cursor:default;overflow:hidden}
.dia-jump[hidden]{display:none}
.dia-jump-head{flex:none;display:flex;align-items:center;gap:6px;padding:8px 10px;border-bottom:1px solid rgba(255,255,255,.1);font-size:13px}
.dia-jump-head label{display:flex;align-items:center;white-space:nowrap}
.dia-jump-input{width:58px;padding:4px 6px;font:inherit;border:1px solid #555;border-radius:6px;background:#111;color:#fff;text-align:center;user-select:auto}
.dia-jump-input.is-bad{border-color:#ff5f57}
.dia-jump-tot{color:#aaa}
.dia-jump-ok{margin-left:auto;padding:4px 12px;border:0;border-radius:6px;background:#4a90e2;color:#fff;font:inherit;font-weight:600;cursor:pointer}
.dia-jump-ok:hover{background:#3b7fd0}
.dia-jump-x{width:26px;height:26px;border:0;border-radius:50%;background:transparent;color:#aaa;cursor:pointer;font-size:13px}
.dia-jump-x:hover{background:rgba(255,255,255,.12);color:#fff}
.dia-jump-list{flex:1;min-height:0;overflow-y:auto;padding:4px;scrollbar-width:thin}
.dia-jump-item{display:flex;align-items:center;gap:8px;width:100%;padding:4px 6px;border:0;border-radius:7px;background:transparent;
  color:#ddd;font:inherit;font-size:12px;text-align:left;cursor:pointer}
.dia-jump-item:hover{background:rgba(255,255,255,.1);color:#fff}
.dia-jump-item.is-cur{background:rgba(255,213,74,.16);color:#ffd54a}
.dia-jump-num{flex:none;min-width:26px;text-align:right;font-variant-numeric:tabular-nums;color:#999}
.dia-jump-item.is-cur .dia-jump-num{color:#ffd54a}
.dia-jump-item img{flex:none;width:48px;height:34px;object-fit:cover;border-radius:4px;background:#000}
.dia-jump-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dia-sep{width:1px;height:20px;background:rgba(255,255,255,.18);margin:0 4px;flex:none}
.dia-msg{position:absolute;inset:0;z-index:5;display:none;align-items:center;justify-content:center;text-align:center;
  padding:16px;cursor:default;background:#101013;color:#e6e6ea;line-height:1.4}
.dia-msg.is-on{display:flex}
.dia-msg-box{max-width:420px}
.dia-big{font-size:42px;line-height:1;margin-bottom:8px}
.dia-title{font-weight:700;font-size:15px;margin-bottom:4px;word-break:break-word}
.dia-btn{display:inline-block;margin-top:12px;padding:9px 18px;border-radius:99px;border:0;background:#4a90e2;color:#fff;
  font:inherit;font-weight:600;cursor:pointer}
.dia-btn:hover{background:#3b7fd0}
.dia-link{display:block;margin:10px auto 0;background:none;border:0;color:#9cc4f5;text-decoration:underline;cursor:pointer;font:inherit;font-size:12px}
.dia-hint{font-size:12px;color:#9a9aa6;margin-top:10px}
.dia-spin{width:30px;height:30px;margin:0 auto 10px;border:3px solid rgba(255,255,255,.2);border-top-color:#fff;border-radius:50%;animation:dia-spin 1s linear infinite}
@keyframes dia-spin{to{transform:rotate(360deg)}}
.dia-root.dia-drag .dia-stage::after{content:'Dépose ton dossier ici';position:absolute;inset:8px;z-index:6;display:flex;align-items:center;justify-content:center;
  border:3px dashed #4a90e2;border-radius:10px;background:rgba(74,144,226,.18);color:#fff;font-weight:700;font-size:16px;pointer-events:none}
.dia-thumbs{flex:none;display:flex;gap:6px;overflow-x:auto;overflow-y:hidden;padding:6px;background:#121216;height:76px;box-sizing:border-box;scrollbar-width:thin}
.dia-thumbs[hidden]{display:none}
.dia-th{flex:none;height:100%;aspect-ratio:4/3;padding:0;border:2px solid transparent;border-radius:5px;overflow:hidden;background:#000;cursor:pointer;opacity:.65}
.dia-th:hover{opacity:1}
.dia-th.is-cur{border-color:#ffd54a;opacity:1}
.dia-th img{width:100%;height:100%;object-fit:cover;display:block;pointer-events:none}
.dia-settings-wrap:empty{display:none}
.dia-settings{position:absolute;inset:0;z-index:8;background:#fff;color:#222;padding:14px 16px;overflow-y:auto;font-size:13px;user-select:auto;cursor:default}
.dia-set-title{font-weight:700;font-size:15px;margin-bottom:10px}
.dia-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:4px 12px;margin-bottom:8px}
.dia-lbl{display:block;font-weight:600;margin:4px 0}
.dia-settings select{display:block;width:100%;box-sizing:border-box;margin-top:4px;padding:5px 6px;font:inherit;font-weight:400;
  border:1px solid #bbb;border-radius:4px;background:#fff;color:#222}
.dia-chk{display:flex;align-items:center;gap:6px;padding:3px 0;cursor:pointer}
.dia-set-btn{margin-top:10px;padding:7px 12px;border:1px solid #bbb;border-radius:6px;background:#f5f5f5;color:#222;font:inherit;cursor:pointer}
.dia-set-btn:hover{background:#eaeaea}
.dia-note{margin-top:10px;font-size:12px;color:#666;line-height:1.4}
.dia-done{margin-top:12px;width:100%;padding:8px;border:0;border-radius:4px;background:#222;color:#fff;font:inherit;font-weight:600;cursor:pointer}
.dia-settings :focus-visible{outline:2px solid #4a90e2;outline-offset:1px}
/* Plein écran (bouton vert) : le widget occupe tout le tableau, la barre du haut reste affichée.
   Projection (bouton ⛶) : vrai plein écran, la barre du haut disparaît pour ne montrer que l'image. */
.dia-root.dia-full{position:fixed;z-index:9999;inset:0;width:auto;height:auto;border-radius:0;background:#000}
.dia-root.dia-projo .dia-bar{display:none}
.dia-root.dia-full:not(.dia-idle) .dia-ctrls{opacity:1}
.dia-root.dia-full.dia-idle,.dia-root.dia-full.dia-idle .dia-stage{cursor:none}
.dia-root.dia-full.dia-idle .dia-ctrls{opacity:0 !important;pointer-events:none}
.dia-root:fullscreen{width:100%;height:100%}
/* Téléphone : plein écran en laissant 40 px à gauche pour les onglets latéraux (comme le Taquin) */
@media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
  .dia-root.dia-full:not(:fullscreen){left:40px;height:100vh;height:100dvh}
}
/* Écrans tactiles : commandes toujours visibles */
@media (hover: none) {
  .dia-ctrls{opacity:1}
}
.widget.dia-is-full > .drag-handle,
.widget.dia-is-full > .widget-rotate-handle,
.widget.dia-is-full > .widget-action-bar,
.widget.dia-is-full > .widget-ctx-menu,
.widget.dia-is-full > .custom-resize-handle{display:none !important}
@media print{.dia-bar,.dia-ctrls,.dia-settings,.dia-thumbs,.dia-prog{display:none}}
`;
        document.head.appendChild(st);
    }

    /* ── Code partagé avec les autres widgets (boutons fenêtre +
          mini-barre « Réduire »). Chaque bloc n'est installé qu'une fois,
          quel que soit le widget chargé en premier. ─────────────────── */
    function installSharedWindowButtons() {
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
    }

    function initAll() {
        installSharedWindowButtons();
        injectStyles();
        injectTemplate();
        document.querySelectorAll('.dia-root').forEach(init);
        mo.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAll);
    else initAll();

    // Sauvegarde / chargement (utilisés par save-load.js)
    // On sauvegarde les réglages, le nom du dossier et l'image affichée.
    // Les images elles-mêmes ne sont pas copiées dans le tableau.
    window.diapoGetData = function (widget) {
        const root = widget && widget.querySelector('.dia-root');
        if (!root) return null;
        const s = S(root), st = getState(root);
        const loaded = s.files.length > 0;
        return {
            id:     root.getAttribute('data-dia-id') || null,
            cfg:    getCfg(root),
            folder: loaded ? s.folder : (st.folder || ''),
            count:  loaded ? s.files.length : (st.n || 0),
            index:  loaded ? s.order[s.pos] : (st.index || 0)
        };
    };
    window.diapoSetData = function (widget, data) {
        const root = widget && widget.querySelector('.dia-root');
        if (!root || !data) return;
        if (data.cfg) root.setAttribute('data-cfg', JSON.stringify(data.cfg));
        if (data.id) root.setAttribute('data-dia-id', data.id);
        setState(root, { folder: data.folder || '', n: data.count || 0, index: data.index || 0 });
        const s = S(root);
        build(root);
        s.inited = true;
        tryRestore(root);
    };
})();
