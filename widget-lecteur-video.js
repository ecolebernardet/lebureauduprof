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
   widget-lecteur-video.js — Widget « Lecteur vidéo »
   Le Bureau du Prof

   Lit une vidéo (ou un son) qui se trouve sur l'ordinateur :
   - bouton « Ouvrir une vidéo », ou glisser-déposer le fichier sur le
     widget… ou directement sur le tableau (le lecteur s'ouvre tout seul,
     voir le glisser-déposer du tableau dans index.html)
   - commandes en grand, adaptées au tableau : lecture / pause, −10 s / +10 s,
     barre de lecture, vitesse (0,5× à 2×), volume, lecture en boucle
   - repères 🔖 : marquer des moments de la vidéo pour y revenir d'un clic
     (traits sur la barre de lecture, touches 1 à 9), modifiables dans ⚙
   - clic sur l'image : lecture / pause ; double-clic : plein écran
   - clavier : Espace ou K (lecture / pause), ← → (5 s), J / L (10 s),
     , et ; (image par image, en pause), ↑ ↓ (volume), M (muet),
     F (plein écran), Échap (en sortir), Début / Fin, 1 à 9 (repères)
   - bouton ⛶ « Projeter » : vrai plein écran de l'écran entier

   Barre du haut :
   - ⚙ réglages, nom du fichier (cliquer pour en ouvrir un autre)
   - boutons fenêtre jaune (réduire), vert (plein écran dans le
     tableau), rouge (fermer), identiques à ceux de l'éphéméride

   La vidéo reste sur l'ordinateur : elle n'est PAS copiée dans le tableau.
   Sur Chrome / Edge (et l'application), l'accès au fichier est mémorisé
   dans le navigateur (IndexedDB) : au rechargement, la vidéo revient
   toute seule ou après un clic sur « Reprendre », au moment où on
   l'avait laissée. Sur les autres navigateurs, il suffit de la rouvrir.

   Utilisation : createWidget('lecteur-video')
   Ouverture d'un fichier : lvOpenFile(widget, fichier, promesseHandle?)
   Le template #template-lecteur-video est injecté dans le DOM par ce fichier.
   Les réglages (data-cfg), le nom du fichier, le moment de lecture et les
   repères sont sauvegardés avec le board (voir lvGetData / lvSetData, save-load.js).
   ═══════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    const DEFAULT_CFG = {
        speed: 1,           // vitesse de lecture
        volume: 1,          // 0 à 1
        muted: false,
        loop: false,        // lecture en boucle
        fit: 'contain',     // 'contain' : image entière ; 'cover' : remplir le cadre
        autoplay: false,    // lancer la lecture dès l'ouverture
        resume: true        // reprendre au moment où on s'était arrêté
    };
    const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const FITS = [['contain', 'Image entière'], ['cover', 'Remplir le cadre']];

    const VIDEO_RE = /\.(mp4|m4v|webm|ogv|mov|mkv|avi)$/i;
    const AUDIO_RE = /\.(mp3|wav|ogg|oga|m4a|aac|flac|opus|weba)$/i;
    const isAudioFile = f => !!f && ((f.type || '').indexOf('audio/') === 0 || AUDIO_RE.test(f.name || ''));
    const isMediaFile = f => !!f && ((f.type || '').indexOf('video/') === 0 || VIDEO_RE.test(f.name || '') || isAudioFile(f));

    /* ── Outils ───────────────────────────────────────────────────── */
    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const pad = n => String(n).padStart(2, '0');
    const genId = () => 'lv_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    const baseName = n => String(n || '').replace(/\.[^.]+$/, '');
    function fmt(t) {
        if (!isFinite(t) || t < 0) t = 0;
        t = Math.floor(t);
        const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
        return h ? h + ':' + pad(m) + ':' + pad(s) : m + ':' + pad(s);
    }
    const fmtSpeed = v => String(v).replace('.', ',') + '×';

    // Empêche le déplacement du widget quand on clique sur un contrôle
    const STOP = ' onpointerdown="event.stopPropagation()" onmousedown="event.stopPropagation()" ontouchstart="event.stopPropagation()"';

    /* ── Mémoire du fichier (IndexedDB) ───────────────────────────────
       Sur Chrome / Edge, le « handle » du fichier peut être gardé dans le
       navigateur : il permet de rouvrir la même vidéo au rechargement. */
    const DB_NAME = 'lebureauduprof-lecteur-video', STORE = 'videos';
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
    // Réglages : attribut data-cfg ; fichier mémorisé : attribut data-state
    // (nom, moment de lecture, son seul ou vidéo, repères) ; le reste vit en mémoire.
    const RT = new WeakMap();
    function S(root) {
        let s = RT.get(root);
        if (!s) {
            s = { file: null, url: null, pendingHandle: null, pendingSeek: 0, pendingPlay: false,
                  raf: 0, idleT: null, inited: false, dragging: false, failed: false };
            RT.set(root, s);
        }
        return s;
    }
    function getCfg(root) {
        let cfg;
        try { cfg = JSON.parse(root.getAttribute('data-cfg') || '{}'); } catch (e) { cfg = {}; }
        cfg = Object.assign({}, DEFAULT_CFG, cfg);
        cfg.speed = SPEEDS.indexOf(+cfg.speed) === -1 ? 1 : +cfg.speed;
        cfg.volume = Math.max(0, Math.min(1, isFinite(+cfg.volume) ? +cfg.volume : 1));
        return cfg;
    }
    function setCfg(root, cfg, noSave) {
        root.setAttribute('data-cfg', JSON.stringify(cfg));
        if (!noSave && typeof saveBoard === 'function') saveBoard();
    }
    function getState(root) {
        const d = { name: '', t: 0, audio: false, markers: [] };
        try { return Object.assign(d, JSON.parse(root.getAttribute('data-state') || '{}')); } catch (e) { return d; }
    }
    function setState(root, st) { root.setAttribute('data-state', JSON.stringify(st)); }
    const vid = root => root.querySelector('.lv-video');
    const loaded = root => !!S(root).file && !S(root).failed;

    /* ── Construction du widget (une seule fois par .lv-root) ──────── */
    function build(root) {
        if (root.querySelector(':scope > .lv-stage')) return;
        if (!root.getAttribute('data-lv-id')) root.setAttribute('data-lv-id', genId());
        root.innerHTML =
            '<div class="lv-bar">' +
                '<button type="button" class="lv-gear" data-lv-action="settings" title="Réglages" aria-label="Réglages"' + STOP + '>⚙</button>' +
                '<button type="button" class="lv-name" data-lv-action="open" title="Ouvrir une vidéo"' + STOP + '>🎬 Ouvrir une vidéo</button>' +
                '<div class="wf-btns"' + STOP + '>' +
                    '<button type="button" class="wf-btn wf-btn-min" data-lv-action="wf-min" title="Réduire" aria-label="Réduire"></button>' +
                    '<button type="button" class="wf-btn wf-btn-max" data-lv-action="wf-max" title="Plein écran" aria-label="Plein écran"></button>' +
                    '<button type="button" class="wf-btn wf-btn-close" data-lv-action="wf-close" title="Fermer" aria-label="Fermer"></button>' +
                '</div>' +
            '</div>' +
            '<div class="lv-stage" tabindex="-1">' +
                '<video class="lv-video" playsinline preload="metadata"></video>' +
                '<div class="lv-audio-art"><div class="lv-audio-ico">🎵</div><div class="lv-audio-name"></div></div>' +
                '<button type="button" class="lv-big" data-lv-action="play" title="Lecture" aria-label="Lecture">▶</button>' +
                '<div class="lv-ctrls">' +
                    '<div class="lv-seek" title="Aller à ce moment">' +
                        '<div class="lv-track"><div class="lv-fill"></div><div class="lv-mks"></div><div class="lv-knob"></div></div>' +
                        '<div class="lv-tip"></div>' +
                    '</div>' +
                    '<div class="lv-row">' +
                        '<button type="button" class="lv-cb lv-play" data-lv-action="play" title="Lecture (Espace)" aria-label="Lecture">▶</button>' +
                        '<button type="button" class="lv-cb lv-sm-hide" data-lv-action="back" title="Reculer de 10 secondes (J)" aria-label="Reculer de 10 secondes">−10</button>' +
                        '<button type="button" class="lv-cb lv-sm-hide" data-lv-action="fwd" title="Avancer de 10 secondes (L)" aria-label="Avancer de 10 secondes">+10</button>' +
                        '<span class="lv-time">0:00 / 0:00</span>' +
                        '<span class="lv-flex"></span>' +
                        '<button type="button" class="lv-cb lv-small lv-sm-hide" data-lv-action="mark" title="Ajouter un repère à ce moment" aria-label="Ajouter un repère">🔖</button>' +
                        '<button type="button" class="lv-cb lv-speed" data-lv-action="speed" title="Vitesse de lecture" aria-label="Vitesse de lecture">1×</button>' +
                        '<button type="button" class="lv-cb lv-small" data-lv-action="mute" title="Couper le son (M)" aria-label="Couper le son">🔊</button>' +
                        '<input type="range" class="lv-vol lv-sm-hide" min="0" max="1" step="0.05" value="1" title="Volume" aria-label="Volume">' +
                        '<button type="button" class="lv-cb lv-small" data-lv-action="loop" title="Lecture en boucle" aria-label="Lecture en boucle">🔁</button>' +
                        '<button type="button" class="lv-cb lv-small" data-lv-action="open" title="Ouvrir une autre vidéo" aria-label="Ouvrir une autre vidéo">📂</button>' +
                        '<button type="button" class="lv-cb lv-small" data-lv-action="projo" title="Projeter sur tout l\'écran" aria-label="Projeter">⛶</button>' +
                        '<button type="button" class="lv-cb lv-small lv-exitfull" data-lv-action="exitfull" title="Quitter le plein écran (Échap)" aria-label="Quitter le plein écran">⤡</button>' +
                    '</div>' +
                '</div>' +
                '<div class="lv-msg"></div>' +
            '</div>' +
            '<div class="lv-settings-wrap"></div>' +
            '<input type="file" class="lv-input" accept="video/*,audio/*,.mkv,.mov,.m4v,.avi" hidden>';

        const stage = root.querySelector('.lv-stage');
        const v = vid(root);
        const input = root.querySelector('.lv-input');

        /* Clic sur l'image : lecture / pause ; double-clic : plein écran */
        stage.addEventListener('pointerdown', e => {
            e.stopPropagation();          // pas de déplacement du widget depuis la vidéo
            lastRoot = root;
            try { stage.focus({ preventScroll: true }); } catch (err) {}
        });
        ['mousedown', 'touchstart'].forEach(t => stage.addEventListener(t, e => e.stopPropagation(), { passive: true }));
        stage.addEventListener('click', e => {
            if (e.target.closest('.lv-ctrls, .lv-msg, .lv-big')) return;
            if (loaded(root)) togglePlay(root);
        });
        stage.addEventListener('dblclick', e => {
            if (e.target.closest('.lv-ctrls, .lv-msg, .lv-big')) return;
            toggleFull(root);             // les deux clics ont annulé leur effet sur la lecture
        });

        /* Barre de lecture : clic ou glissement, survol = moment indiqué */
        const seek = root.querySelector('.lv-seek');
        const ratioAt = e => {
            const r = seek.querySelector('.lv-track').getBoundingClientRect();
            return Math.max(0, Math.min(1, (e.clientX - r.left) / (r.width || 1)));
        };
        seek.addEventListener('pointerdown', e => {
            e.stopPropagation(); e.preventDefault();
            if (!loaded(root) || !isFinite(v.duration)) return;
            const mk = e.target.closest('.lv-mk');
            if (mk) { seekTo(root, +mk.getAttribute('data-t')); return; }
            const s = S(root);
            s.dragging = true;
            root.classList.add('lv-dragging');
            try { seek.setPointerCapture(e.pointerId); } catch (err) {}
            seekTo(root, ratioAt(e) * v.duration);
        });
        seek.addEventListener('pointermove', e => {
            if (!loaded(root) || !isFinite(v.duration)) return;
            const ratio = ratioAt(e);
            const tip = root.querySelector('.lv-tip');
            const mk = e.target.closest('.lv-mk');
            tip.textContent = mk ? mk.getAttribute('data-l') + ' · ' + fmt(+mk.getAttribute('data-t')) : fmt(ratio * v.duration);
            tip.style.left = (ratio * 100) + '%';
            tip.classList.add('is-on');
            if (S(root).dragging) seekTo(root, ratio * v.duration);
        });
        const endDrag = () => { S(root).dragging = false; root.classList.remove('lv-dragging'); };
        seek.addEventListener('pointerup', endDrag);
        seek.addEventListener('pointercancel', endDrag);
        seek.addEventListener('pointerleave', () => root.querySelector('.lv-tip').classList.remove('is-on'));

        /* Volume */
        const vol = root.querySelector('.lv-vol');
        vol.addEventListener('pointerdown', e => e.stopPropagation());
        vol.addEventListener('input', () => {
            v.volume = +vol.value;
            if (v.volume > 0 && v.muted) v.muted = false;
            const cfg = getCfg(root); cfg.volume = v.volume; cfg.muted = v.muted; setCfg(root, cfg, true);
            updateUI(root);
        });
        vol.addEventListener('change', () => { if (typeof saveBoard === 'function') saveBoard(); });

        /* Événements de la vidéo */
        v.addEventListener('loadedmetadata', () => onMeta(root));
        v.addEventListener('play', () => { updateUI(root); loopUI(root); });
        v.addEventListener('pause', () => {
            updateUI(root); progressUI(root);
            // On mémorise le moment où la vidéo est arrêtée (pour la reprendre plus tard)
            if (loaded(root) && isFinite(v.currentTime)) {
                const st = getState(root);
                st.t = Math.round(v.currentTime * 10) / 10;
                setState(root, st);
                if (typeof saveBoard === 'function') saveBoard();
            }
        });
        v.addEventListener('ended', () => updateUI(root));
        v.addEventListener('seeked', () => progressUI(root));
        v.addEventListener('timeupdate', () => { if (v.paused) progressUI(root); });
        v.addEventListener('volumechange', () => updateUI(root));
        v.addEventListener('error', () => {
            if (!S(root).file) return;
            S(root).failed = true;
            setMsg(root, msgError(S(root).file.name));
            updateUI(root);
        });

        /* Choix du fichier par le sélecteur classique (Firefox, Safari…) */
        input.addEventListener('change', () => {
            const f = input.files && input.files[0];
            input.value = '';
            if (f) loadFile(root, f, null, false);
        });

        /* Glisser-déposer une vidéo sur le widget */
        root.addEventListener('dragover', e => {
            if (!e.dataTransfer || Array.prototype.indexOf.call(e.dataTransfer.types, 'Files') === -1) return;
            e.preventDefault(); e.stopPropagation();
            e.dataTransfer.dropEffect = 'copy';
            root.classList.add('lv-drag');
        });
        root.addEventListener('dragleave', e => {
            if (!root.contains(e.relatedTarget)) root.classList.remove('lv-drag');
        });
        root.addEventListener('drop', e => {
            e.preventDefault(); e.stopPropagation();
            root.classList.remove('lv-drag');
            const dt = e.dataTransfer;
            if (!dt) return;
            const files = Array.from(dt.files || []);
            const idx = files.findIndex(isMediaFile);
            if (idx < 0) return;
            const items = Array.from(dt.items || []).filter(i => i.kind === 'file');
            let hp = null;
            try { if (items[idx] && typeof items[idx].getAsFileSystemHandle === 'function') hp = items[idx].getAsFileSystemHandle(); } catch (err) {}
            openFileWithHandle(root, files[idx], hp);
        });

        /* Commandes masquées après 2,5 s sans bouger la souris (plein écran) */
        root.addEventListener('pointermove', () => {
            lastRoot = root;
            const s = S(root);
            root.classList.remove('lv-idle');
            clearTimeout(s.idleT);
            s.idleT = setTimeout(() => root.classList.add('lv-idle'), 2500);
        });

        updateUI(root);
    }

    /* ── Messages ─────────────────────────────────────────────────── */
    function setMsg(root, html) {
        const m = root.querySelector('.lv-msg');
        if (!m) return;
        m.innerHTML = html || '';
        m.classList.toggle('is-on', !!html);
    }
    function msgEmpty() {
        return '<div class="lv-msg-box">' +
            '<div class="lv-bigico">🎬</div>' +
            '<div class="lv-title">Lecteur vidéo</div>' +
            '<div>Ouvre une vidéo ou un son de ton ordinateur.</div>' +
            '<button type="button" class="lv-btn" data-lv-action="open">📂 Ouvrir une vidéo</button>' +
            '<div class="lv-hint">ou glisse-dépose le fichier ici (ou directement sur le tableau)<br>MP4, WebM, MOV… et sons MP3, WAV, OGG</div>' +
        '</div>';
    }
    function msgResume(st, canResume, note) {
        const info = '« ' + esc(st.name) + ' »' + (st.t > 1 ? ' — arrêtée à ' + fmt(st.t) : '');
        return '<div class="lv-msg-box">' +
            '<div class="lv-bigico">' + (st.audio ? '🎵' : '🎬') + '</div>' +
            '<div class="lv-title">' + info + '</div>' +
            (canResume
                ? '<button type="button" class="lv-btn" data-lv-action="resume">▶ Reprendre la vidéo</button>' +
                  '<button type="button" class="lv-link" data-lv-action="open">Ouvrir une autre vidéo</button>'
                : '<div class="lv-hint">Par sécurité, le navigateur demande de rouvrir le fichier.</div>' +
                  '<button type="button" class="lv-btn" data-lv-action="open">📂 Rouvrir la vidéo</button>') +
            (note ? '<div class="lv-hint">' + esc(note) + '</div>' : '') +
        '</div>';
    }
    function msgError(name) {
        return '<div class="lv-msg-box"><div class="lv-bigico">⚠️</div>' +
            '<div class="lv-title">« ' + esc(name) + ' » ne peut pas être lue par le navigateur.</div>' +
            '<div class="lv-hint">Formats les plus sûrs : MP4 (H.264) ou WebM. Les fichiers AVI et certains MKV ou MOV ne sont pas lus.</div>' +
            '<button type="button" class="lv-btn" data-lv-action="open">📂 Ouvrir une autre vidéo</button></div>';
    }
    function msgNotMedia(name) {
        return '<div class="lv-msg-box"><div class="lv-bigico">🙈</div>' +
            '<div class="lv-title">« ' + esc(name) + ' » n’est pas une vidéo.</div>' +
            '<button type="button" class="lv-btn" data-lv-action="open">📂 Ouvrir une vidéo</button></div>';
    }

    /* ── Ouverture d'un fichier ───────────────────────────────────── */
    const PICKER_TYPES = [{
        description: 'Vidéos et sons',
        accept: {
            'video/*': ['.mp4', '.m4v', '.webm', '.ogv', '.mov', '.mkv', '.avi'],
            'audio/*': ['.mp3', '.wav', '.ogg', '.oga', '.m4a', '.aac', '.flac', '.opus', '.weba']
        }
    }];
    function openPicker(root) {
        if (typeof window.showOpenFilePicker === 'function' && window.isSecureContext !== false) {
            window.showOpenFilePicker({ id: 'lbdp-lecteur-video', startIn: 'videos', multiple: false, types: PICKER_TYPES })
                .then(async hs => { const h = hs[0]; loadFile(root, await h.getFile(), h, false); })
                .catch(err => {
                    if (err && err.name === 'AbortError') return;    // l'utilisateur a annulé
                    const input = root.querySelector('.lv-input');    // sélecteur non autorisé ici
                    if (input) input.click();
                });
        } else {
            const input = root.querySelector('.lv-input');
            if (input) input.click();
        }
    }

    // hp : promesse d'un handle (glisser-déposer sur Chrome / Edge), ou null
    function openFileWithHandle(root, file, hp) {
        if (hp && typeof hp.then === 'function') {
            hp.then(h => loadFile(root, file, (h && h.kind === 'file') ? h : null, false))
              .catch(() => loadFile(root, file, null, false));
        } else {
            loadFile(root, file, null, false);
        }
    }

    function releaseMedia(root) {
        const s = S(root);
        const v = vid(root);
        if (v) {
            try { v.pause(); } catch (e) {}
            v.removeAttribute('src');
            try { v.load(); } catch (e) {}
        }
        if (s.url) { try { URL.revokeObjectURL(s.url); } catch (e) {} }
        s.url = null; s.file = null; s.failed = false;
        cancelAnimationFrame(s.raf);
    }

    function loadFile(root, file, handle, restoring) {
        const s = S(root);
        const cfg = getCfg(root);
        const st = getState(root);
        toggleSettings(root, false);
        if (!isMediaFile(file)) { setMsg(root, msgNotMedia(file && file.name || '?')); return; }
        releaseMedia(root);
        // Même vidéo que la dernière fois (reprise, ou fichier rouvert) : on garde les repères et le moment
        const same = restoring || (st.name && file.name === st.name);
        if (!same) root.setAttribute('data-lv-id', genId());
        const audio = isAudioFile(file);
        setState(root, { name: file.name, t: same ? st.t : 0, audio, markers: same ? (st.markers || []) : [] });
        s.file = file;
        s.url = URL.createObjectURL(file);
        s.pendingHandle = handle || null;
        s.pendingSeek = (same && cfg.resume) ? (st.t || 0) : 0;
        s.pendingPlay = !restoring && cfg.autoplay;
        if (handle) idbPut(root.getAttribute('data-lv-id'), handle);

        root.classList.toggle('lv-audio', audio);
        const an = root.querySelector('.lv-audio-name');
        if (an) an.textContent = baseName(file.name);
        setMsg(root, null);
        const v = vid(root);
        v.src = s.url;
        v.loop = cfg.loop;
        try { v.load(); } catch (e) {}
        renderMarkers(root);
        updateUI(root);
        if (!restoring && typeof saveBoard === 'function') saveBoard();
    }

    function onMeta(root) {
        const s = S(root), v = vid(root), cfg = getCfg(root);
        v.playbackRate = cfg.speed;
        v.defaultPlaybackRate = cfg.speed;
        v.volume = cfg.volume;
        v.muted = cfg.muted;
        v.loop = cfg.loop;
        if (!v.videoWidth) root.classList.add('lv-audio');   // fichier vidéo sans image (son seul)
        if (s.pendingSeek > 0 && isFinite(v.duration) && s.pendingSeek < v.duration - 1) {
            try { v.currentTime = s.pendingSeek; } catch (e) {}
        }
        s.pendingSeek = 0;
        if (s.pendingPlay) { s.pendingPlay = false; v.play().catch(() => {}); }
        renderMarkers(root);
        updateUI(root);
        progressUI(root);
    }

    /* ── Lecture ──────────────────────────────────────────────────── */
    function togglePlay(root) {
        const v = vid(root);
        if (!loaded(root)) return;
        if (v.paused || v.ended) v.play().catch(() => {}); else v.pause();
    }
    function seekTo(root, t) {
        const v = vid(root);
        if (!loaded(root) || !isFinite(v.duration)) return;
        v.currentTime = Math.max(0, Math.min(v.duration, t));
        progressUI(root);
    }
    const seekBy = (root, d) => seekTo(root, vid(root).currentTime + d);

    // Mise à jour fluide de la barre pendant la lecture
    function loopUI(root) {
        const s = S(root);
        cancelAnimationFrame(s.raf);
        const tick = () => {
            if (!root.isConnected) return;
            progressUI(root);
            if (!vid(root).paused) s.raf = requestAnimationFrame(tick);
        };
        tick();
    }
    function progressUI(root) {
        const v = vid(root);
        const d = isFinite(v.duration) ? v.duration : 0;
        const r = d ? Math.min(1, v.currentTime / d) : 0;
        const fill = root.querySelector('.lv-fill'), knob = root.querySelector('.lv-knob');
        if (fill) fill.style.width = (r * 100) + '%';
        if (knob) knob.style.left = (r * 100) + '%';
        const time = root.querySelector('.lv-time');
        if (time) time.textContent = fmt(v.currentTime) + ' / ' + fmt(d);
    }

    /* ── Repères ──────────────────────────────────────────────────── */
    function addMarker(root) {
        const v = vid(root);
        if (!loaded(root)) return;
        const st = getState(root);
        const t = Math.round(v.currentTime * 10) / 10;
        if (st.markers.some(m => Math.abs(m.t - t) < 0.5)) return;
        st.markers.push({ t, l: 'Repère ' + (st.markers.length + 1) });
        st.markers.sort((a, b) => a.t - b.t);
        setState(root, st);
        renderMarkers(root);
        refreshSettings(root);
        flash(root, '🔖 Repère ajouté à ' + fmt(t));
        if (typeof saveBoard === 'function') saveBoard();
    }
    function renderMarkers(root) {
        const box = root.querySelector('.lv-mks');
        if (!box) return;
        const v = vid(root);
        const d = isFinite(v.duration) ? v.duration : 0;
        const st = getState(root);
        box.innerHTML = d ? st.markers.map((m, i) =>
            '<span class="lv-mk" style="left:' + Math.min(100, m.t / d * 100) + '%" data-t="' + m.t + '" data-l="' + esc((i + 1) + '. ' + m.l) + '"></span>'
        ).join('') : '';
    }
    function goMarker(root, i) {
        const m = getState(root).markers[i];
        if (m) { seekTo(root, m.t); flash(root, '🔖 ' + m.l); }
    }

    // Petit message temporaire au centre de la vidéo
    function flash(root, text) {
        const stage = root.querySelector('.lv-stage');
        if (!stage) return;
        let f = stage.querySelector('.lv-flash');
        if (!f) { f = document.createElement('div'); f.className = 'lv-flash'; stage.appendChild(f); }
        f.textContent = text;
        f.classList.remove('is-on'); void f.offsetWidth; f.classList.add('is-on');
        clearTimeout(f._t);
        f._t = setTimeout(() => f.classList.remove('is-on'), 1200);
    }

    /* ── Mise à jour de l'interface ───────────────────────────────── */
    function updateUI(root) {
        const stage = root.querySelector('.lv-stage');
        if (!stage) return;
        const s = S(root), cfg = getCfg(root), st = getState(root), v = vid(root);
        const ok = loaded(root);
        stage.style.setProperty('--lv-fit', cfg.fit);
        root.classList.toggle('is-empty', !ok);
        root.classList.toggle('lv-paused', !ok || v.paused || v.ended);

        const nameBtn = root.querySelector('.lv-name');
        if (nameBtn) {
            const n = s.file ? s.file.name : st.name;
            nameBtn.textContent = n ? (isAudioFile(s.file || { name: n }) ? '🎵 ' : '🎬 ') + n : '🎬 Ouvrir une vidéo';
            nameBtn.title = n ? 'Ouvrir une autre vidéo' : 'Ouvrir une vidéo';
        }
        const playing = ok && !v.paused && !v.ended;
        const play = root.querySelector('.lv-play');
        if (play) { play.textContent = playing ? '❚❚' : '▶'; play.title = playing ? 'Pause (Espace)' : 'Lecture (Espace)'; }
        const speed = root.querySelector('.lv-speed');
        if (speed) speed.textContent = fmtSpeed(ok ? v.playbackRate : cfg.speed);
        const mute = root.querySelector('[data-lv-action="mute"]');
        const silent = v.muted || v.volume === 0;
        if (mute) { mute.textContent = silent ? '🔇' : (v.volume < 0.5 ? '🔉' : '🔊'); mute.title = silent ? 'Remettre le son (M)' : 'Couper le son (M)'; }
        const vol = root.querySelector('.lv-vol');
        if (vol && document.activeElement !== vol) vol.value = v.muted ? 0 : v.volume;
        const loop = root.querySelector('[data-lv-action="loop"]');
        if (loop) loop.classList.toggle('is-on', cfg.loop);
        progressUI(root);
    }

    /* ── Réglages ─────────────────────────────────────────────────── */
    function buildSettings(root) {
        const cfg = getCfg(root), st = getState(root);
        const opts = (list, val) => list.map(([v, l]) => '<option value="' + v + '"' + (String(val) === String(v) ? ' selected' : '') + '>' + l + '</option>').join('');
        const chk = (k, lbl) => '<label class="lv-chk"><input type="checkbox" data-lv-cfg="' + k + '"' + (cfg[k] ? ' checked' : '') + '> ' + lbl + '</label>';
        const marks = st.markers.length
            ? st.markers.map((m, i) =>
                '<div class="lv-mrow">' +
                    '<span class="lv-mnum">' + (i + 1) + '</span>' +
                    '<input type="text" data-lv-mklabel="' + i + '" value="' + esc(m.l) + '" aria-label="Nom du repère">' +
                    '<button type="button" class="lv-mgo" data-lv-action="mk-go" data-i="' + i + '" title="Aller à ce repère">▶ ' + fmt(m.t) + '</button>' +
                    '<button type="button" class="lv-mdel" data-lv-action="mk-del" data-i="' + i + '" title="Supprimer ce repère" aria-label="Supprimer">✕</button>' +
                '</div>').join('')
            : '<div class="lv-note">Aucun repère. Pendant la lecture, clique sur 🔖 pour marquer un moment important.</div>';
        return '<div class="lv-settings"' + STOP + '>' +
            '<div class="lv-set-title">Réglages du lecteur</div>' +
            '<div class="lv-grid">' +
                '<label class="lv-lbl">Vitesse<select data-lv-cfg="speed">' + opts(SPEEDS.map(v => [v, fmtSpeed(v) + (v === 1 ? ' (normale)' : '')]), cfg.speed) + '</select></label>' +
                '<label class="lv-lbl">Cadrage<select data-lv-cfg="fit">' + opts(FITS, cfg.fit) + '</select></label>' +
            '</div>' +
            chk('autoplay', 'Lancer la lecture dès l’ouverture de la vidéo') +
            chk('resume', 'Reprendre là où on s’était arrêté') +
            chk('loop', 'Lecture en boucle') +
            '<div class="lv-lbl">Repères' + (st.markers.length ? ' <span class="lv-n">(touches 1 à 9 pour y aller)</span>' : '') + '</div>' +
            '<div class="lv-marks">' + marks + '</div>' +
            '<button type="button" class="lv-set-btn" data-lv-action="open">📂 Ouvrir une autre vidéo</button>' +
            '<div class="lv-note">La vidéo reste sur ton ordinateur : elle n’est pas copiée dans le tableau. ' +
                'Au prochain chargement, il suffira de cliquer sur « Reprendre » (Chrome, Edge) ou de rouvrir le fichier.</div>' +
            '<div class="lv-note">Clavier : Espace lecture / pause · ← → 5 s · J L 10 s · , et ; image par image (en pause) · ↑ ↓ volume · M muet · F plein écran · Échap pour en sortir.</div>' +
            '<button type="button" class="lv-done" data-lv-action="settings-close">Terminé</button>' +
        '</div>';
    }
    function toggleSettings(root, force) {
        const wrap = root.querySelector('.lv-settings-wrap');
        if (!wrap) return;
        const open = force !== undefined ? force : !wrap.innerHTML;
        wrap.innerHTML = open ? buildSettings(root) : '';
    }
    function refreshSettings(root) {
        const wrap = root.querySelector('.lv-settings-wrap');
        if (wrap && wrap.innerHTML) wrap.innerHTML = buildSettings(root);
    }

    /* ── Boutons fenêtre : réduire / plein écran / fermer ───────────── */
    function toggleFull(root, force) {
        const full = force !== undefined ? force : !root.classList.contains('lv-full');
        root.classList.toggle('lv-full', full);
        const widget = root.closest('.widget');
        if (widget) widget.classList.toggle('lv-is-full', full);
        const b = root.querySelector('[data-lv-action="wf-max"]');
        if (b) b.title = full ? 'Quitter le plein écran' : 'Plein écran';
        if (!full) root.classList.remove('lv-projo');
        if (!full && document.fullscreenElement === root) { try { document.exitFullscreen(); } catch (e) {} }
        if (full) {
            const s = S(root);
            root.classList.remove('lv-idle');
            clearTimeout(s.idleT);
            s.idleT = setTimeout(() => root.classList.add('lv-idle'), 2500);
            try { root.querySelector('.lv-stage').focus({ preventScroll: true }); } catch (e) {}
        }
    }

    // Vrai plein écran (tout l'écran) : la barre du haut disparaît
    function projo(root) {
        if (document.fullscreenElement === root || root.classList.contains('lv-projo')) { toggleFull(root, false); return; }
        toggleFull(root, true);
        root.classList.add('lv-projo');
        if (typeof root.requestFullscreen === 'function') {
            root.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
        }
    }
    document.addEventListener('fullscreenchange', () => {
        // sortie du vrai plein écran (Échap) : on quitte aussi le plein écran du tableau
        document.querySelectorAll('.lv-root.lv-full').forEach(r => {
            if (r._lvWasFs && document.fullscreenElement !== r) toggleFull(r, false);
            r._lvWasFs = document.fullscreenElement === r;
        });
    });

    function minimizeWidget(root) {
        const widget = root.closest('.widget');
        if (!widget || typeof window._wfMiniBarCollapse !== 'function') return;
        if (root.classList.contains('lv-full')) toggleFull(root, false);
        const v = vid(root);
        if (v) v.pause();
        toggleSettings(root, false);
        const box = root.closest('.editor-container') || root;
        box.style.visibility = 'hidden'; // le lecteur ne doit pas passer par-dessus la mini-barre
        const n = S(root).file ? baseName(S(root).file.name) : 'Lecteur vidéo';
        window._wfMiniBarCollapse(widget, '🎬 ' + n, {
            onExpand: () => { box.style.visibility = ''; updateUI(root); }
        });
    }

    function closeWidget(root) {
        const widget = root.closest('.widget');
        if (!widget) return;
        if (root.classList.contains('lv-full')) toggleFull(root, false);
        if (typeof snapshotNow === 'function') snapshotNow();
        widget.remove();
        if (typeof saveBoard === 'function') saveBoard();
    }

    // Widget retiré du tableau : la vidéo est arrêtée (sinon le son continuerait)
    function cleanup(root) {
        const s = RT.get(root);
        if (!s) return;
        clearTimeout(s.idleT);
        releaseMedia(root);
        RT.delete(root);
    }

    /* ── Reprise après rechargement du tableau ────────────────────── */
    async function tryRestore(root) {
        const st = getState(root);
        const s = S(root);
        if (s.file) return;
        if (!st.name) { setMsg(root, msgEmpty()); updateUI(root); return; }
        const h = await idbGet(root.getAttribute('data-lv-id'));
        if (S(root).file) return;
        if (h && typeof h.queryPermission === 'function') {
            s.pendingHandle = h;
            let p = 'prompt';
            try { p = await h.queryPermission({ mode: 'read' }); } catch (e) {}
            if (p === 'granted') {
                try { loadFile(root, await h.getFile(), h, true); return; }
                catch (e) { setMsg(root, msgResume(st, false, 'Le fichier a peut-être été déplacé ou renommé.')); updateUI(root); return; }
            }
            setMsg(root, msgResume(st, true));
        } else {
            setMsg(root, msgResume(st, false));
        }
        updateUI(root);
    }

    async function resume(root) {
        const s = S(root);
        const h = s.pendingHandle;
        if (!h) { openPicker(root); return; }
        let p = 'denied';
        try { p = await h.requestPermission({ mode: 'read' }); } catch (e) {}
        const st = getState(root);
        if (p !== 'granted') { setMsg(root, msgResume(st, true, 'Accès refusé : tu peux réessayer ou rouvrir le fichier.')); return; }
        try { loadFile(root, await h.getFile(), h, true); }
        catch (e) { setMsg(root, msgResume(st, false, 'Le fichier a peut-être été déplacé ou renommé.')); }
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
        const btn = e.target.closest && e.target.closest('[data-lv-action]');
        if (!btn) return;
        const root = btn.closest('.lv-root');
        if (!root) return;
        e.stopPropagation();
        lastRoot = root;
        const v = vid(root);
        const act = btn.getAttribute('data-lv-action');
        switch (act) {
            case 'wf-min':   minimizeWidget(root); break;
            case 'wf-max':   toggleFull(root); break;
            case 'wf-close': closeWidget(root); break;
            case 'exitfull': toggleFull(root, false); break;
            case 'projo':    projo(root); break;
            case 'open':     openPicker(root); break;
            case 'resume':   resume(root); break;
            case 'play':     togglePlay(root); break;
            case 'back':     seekBy(root, -10); break;
            case 'fwd':      seekBy(root, 10); break;
            case 'mark':     addMarker(root); break;
            case 'mute': {
                if (v.muted || v.volume === 0) { v.muted = false; if (v.volume === 0) v.volume = 0.5; }
                else v.muted = true;
                const cfg = getCfg(root); cfg.muted = v.muted; cfg.volume = v.volume; setCfg(root, cfg);
                break;
            }
            case 'speed': {
                const cfg = getCfg(root);
                cfg.speed = SPEEDS[(SPEEDS.indexOf(cfg.speed) + 1) % SPEEDS.length];
                v.playbackRate = cfg.speed; v.defaultPlaybackRate = cfg.speed;
                setCfg(root, cfg);
                flash(root, 'Vitesse ' + fmtSpeed(cfg.speed));
                refreshSettings(root);
                break;
            }
            case 'loop': {
                const cfg = getCfg(root);
                cfg.loop = !cfg.loop; v.loop = cfg.loop;
                setCfg(root, cfg);
                flash(root, cfg.loop ? '🔁 Lecture en boucle' : 'Lecture en boucle désactivée');
                refreshSettings(root);
                break;
            }
            case 'mk-go':    goMarker(root, +btn.getAttribute('data-i')); break;
            case 'mk-del': {
                const st = getState(root);
                st.markers.splice(+btn.getAttribute('data-i'), 1);
                setState(root, st);
                renderMarkers(root);
                refreshSettings(root);
                if (typeof saveBoard === 'function') saveBoard();
                break;
            }
            case 'settings': toggleSettings(root); break;
            case 'settings-close': toggleSettings(root, false); break;
        }
        updateUI(root);
    }, true);

    // Réglages modifiés (listes, cases à cocher, noms des repères)
    document.addEventListener('change', function (e) {
        const t = e.target;
        if (!t.closest) return;
        const root = t.closest('.lv-root');
        if (!root || !t.closest('.lv-settings')) return;
        const v = vid(root);
        if (t.hasAttribute('data-lv-mklabel')) {
            const st = getState(root);
            const m = st.markers[+t.getAttribute('data-lv-mklabel')];
            if (m) { m.l = t.value.trim() || m.l; setState(root, st); renderMarkers(root); }
            if (typeof saveBoard === 'function') saveBoard();
            return;
        }
        if (!t.hasAttribute('data-lv-cfg')) return;
        const key = t.getAttribute('data-lv-cfg');
        const cfg = getCfg(root);
        cfg[key] = t.type === 'checkbox' ? t.checked : (key === 'speed' ? +t.value : t.value);
        setCfg(root, cfg);
        if (key === 'speed') { v.playbackRate = cfg.speed; v.defaultPlaybackRate = cfg.speed; }
        if (key === 'loop') v.loop = cfg.loop;
        updateUI(root);
    });

    /* ── Clavier ──────────────────────────────────────────────────── */
    const isEditable = el => !!(el && el.closest && el.closest('input, textarea, select, [contenteditable="true"], [contenteditable=""]'));
    function activeRoot() {
        const full = Array.from(document.querySelectorAll('.lv-root.lv-full')).pop();
        if (full) return full;
        const ae = document.activeElement;
        if (ae && ae.closest) {
            const r = ae.closest('.lv-root');
            if (r) return r;
            const w = ae.closest('.widget');
            const r2 = w && w.querySelector('.lv-root');
            if (r2) return r2;
            if (isEditable(ae)) return null;   // saisie en cours dans un autre widget
        }
        if (lastRoot && lastRoot.isConnected && lastRoot.matches(':hover')) return lastRoot;
        return null;
    }

    document.addEventListener('keydown', function (e) {
        // Saisie dans les réglages : pas de raccourcis du board
        if (e.target.closest && e.target.closest('.lv-settings')) { e.stopPropagation(); return; }
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        const root = activeRoot();
        if (!root) return;
        const k = e.key;
        // Curseur de volume : il garde ses flèches
        if (e.target.classList && e.target.classList.contains('lv-vol') && /^Arrow/.test(k)) { e.stopPropagation(); return; }
        // Espace / Entrée sur un bouton du widget : c'est le bouton qui agit
        if ((k === ' ' || k === 'Enter') && e.target.closest && e.target.closest('button')) return;
        if (isEditable(e.target) && !(e.target.classList && e.target.classList.contains('lv-vol'))) return;
        const v = vid(root);
        const ok = loaded(root);
        let done = true;
        if ((k === ' ' || k === 'k' || k === 'K') && ok) togglePlay(root);
        else if (k === 'ArrowRight' && ok) seekBy(root, 5);
        else if (k === 'ArrowLeft' && ok) seekBy(root, -5);
        else if ((k === 'l' || k === 'L') && ok) seekBy(root, 10);
        else if ((k === 'j' || k === 'J') && ok) seekBy(root, -10);
        else if ((k === ';' || k === '.') && ok && v.paused) seekBy(root, 1 / 25);   // ; (clavier français) ou .
        else if (k === ',' && ok && v.paused) seekBy(root, -1 / 25);
        else if (k === 'Home' && ok) seekTo(root, 0);
        else if (k === 'End' && ok) seekTo(root, v.duration);
        else if ((k === 'ArrowUp' || k === 'ArrowDown') && ok) {
            v.muted = false;
            v.volume = Math.max(0, Math.min(1, Math.round((v.volume + (k === 'ArrowUp' ? 0.1 : -0.1)) * 10) / 10));
            const cfg = getCfg(root); cfg.volume = v.volume; cfg.muted = false; setCfg(root, cfg, true);
            flash(root, 'Volume ' + Math.round(v.volume * 100) + ' %');
        }
        else if (k === 'm' || k === 'M') { v.muted = !v.muted; const cfg = getCfg(root); cfg.muted = v.muted; setCfg(root, cfg, true); }
        else if (/^[1-9]$/.test(k) && ok && getState(root).markers[+k - 1]) goMarker(root, +k - 1);
        else if (k === 'f' || k === 'F') toggleFull(root);
        else if (k === 'Escape' && root.classList.contains('lv-full')) toggleFull(root, false);
        else done = false;
        if (done) { e.preventDefault(); e.stopPropagation(); updateUI(root); }
    }, true);

    /* ── Redimensionnement libre ──────────────────────────────────
       La poignée du board (.custom-resize-handle) est interceptée pour
       ce widget : largeur et hauteur suivent la souris. ─────────────── */
    const MIN_W = 300, MIN_H = 200, MAX_W = 3600, MAX_H = 2400;

    function lvBox(widget) {
        const root = widget.querySelector('.lv-root');
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
        const box = lvBox(widget);
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
        if (!widget || !widget.querySelector('.lv-root')) return;
        if (widget.classList.contains('lv-is-full') || widget.querySelector('.wf-mini-bar')) return;
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
        const roots = node.matches('.lv-root') ? [node] : Array.from(node.querySelectorAll('.lv-root'));
        roots.forEach(r => {
            init(r);
            // Sur téléphone, ouverture directe en plein écran (bouton vert) —
            // seulement pour un widget qui vient d'être lancé depuis un panneau
            const w = r.closest('.widget');
            if (w && !w._lvAutoMax) {
                w._lvAutoMax = true;
                window._wfPhoneAutoMax(w, () => toggleFull(r), () => r.classList.contains('lv-full'), null, true);
            }
        });
    }
    const mo = new MutationObserver(muts => {
        for (const m of muts) {
            m.addedNodes.forEach(n => {
                if (n instanceof Element && (n.matches('.widget, .lv-root') || n.querySelector('.lv-root'))) {
                    // on ne ré-hydrate pas pour nos propres mises à jour internes
                    if (n.closest('.lv-root') && !n.matches('.lv-root')) return;
                    hydrate(n);
                }
            });
            m.removedNodes.forEach(n => {
                if (!(n instanceof Element)) return;
                const roots = n.matches('.lv-root') ? [n] : Array.from(n.querySelectorAll('.lv-root'));
                roots.forEach(r => setTimeout(() => { if (!r.isConnected) cleanup(r); }, 0));
            });
        }
    });

    /* ── Template et styles ───────────────────────────────────────── */
    function injectTemplate() {
        if (document.getElementById('template-lecteur-video')) return;
        const tpl = document.createElement('template');
        tpl.id = 'template-lecteur-video';
        tpl.innerHTML =
            '<div class="editor-container" style="width:640px;height:400px;">' +
                '<div class="lv-root" data-cfg=\'' + JSON.stringify(DEFAULT_CFG) + '\'></div>' +
            '</div>';
        document.body.appendChild(tpl);
    }

    function injectStyles() {
        if (document.getElementById('lv-styles')) return;
        const st = document.createElement('style');
        st.id = 'lv-styles';
        st.textContent = `
.lv-root{
  container-type:inline-size; position:relative; width:100%; height:100%; box-sizing:border-box;
  display:flex; flex-direction:column; overflow:hidden; background:#18181c; color:#eee;
  font-family:system-ui,-apple-system,"Segoe UI",sans-serif; font-size:13px; user-select:none;
}
.lv-bar{flex:none;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:8px;
  padding:5px 10px;background:#232329;border-bottom:1px solid #2f2f37}
.lv-gear{border:0;background:none;color:#8d8d99;font-size:16px;line-height:1;cursor:pointer;padding:3px 5px;border-radius:5px}
.lv-gear:hover{color:#fff;background:rgba(255,255,255,.08)}
.lv-name{justify-self:center;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
  border:0;background:rgba(255,255,255,.07);color:#ddd;border-radius:99px;padding:3px 12px;font:inherit;font-size:12px;cursor:pointer}
.lv-name:hover{background:rgba(255,255,255,.14);color:#fff}
.lv-bar :focus-visible{outline:2px solid #4a90e2;outline-offset:1px}
.lv-stage{position:relative;flex:1;min-height:0;overflow:hidden;background:#000;outline:none;cursor:pointer}
.lv-root.is-empty .lv-stage{cursor:default;background:#101013}
.lv-video{position:absolute;inset:0;width:100%;height:100%;object-fit:var(--lv-fit,contain);background:#000;display:block}
.lv-root.is-empty .lv-video{visibility:hidden}
/* Son seul : grande note de musique et nom du fichier */
.lv-audio-art{position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;gap:10px;
  background:radial-gradient(circle at 50% 40%,#2b2b52,#111118);pointer-events:none;padding:0 20px 70px;text-align:center}
.lv-root.lv-audio:not(.is-empty) .lv-audio-art{display:flex}
.lv-audio-ico{font-size:clamp(40px,14cqw,140px);line-height:1}
.lv-root.lv-audio:not(.lv-paused) .lv-audio-ico{animation:lv-beat 1.2s ease-in-out infinite}
@keyframes lv-beat{50%{transform:scale(1.08)}}
.lv-audio-name{font-size:clamp(13px,3cqw,30px);font-weight:600;color:#fff;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
/* Gros bouton lecture au centre, quand la vidéo est en pause */
.lv-big{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:2;width:clamp(56px,13cqw,110px);height:clamp(56px,13cqw,110px);
  border:0;border-radius:50%;background:rgba(0,0,0,.55);color:#fff;font-size:clamp(22px,5cqw,44px);cursor:pointer;
  display:none;align-items:center;justify-content:center;padding-left:.15em;box-shadow:0 4px 18px rgba(0,0,0,.4)}
.lv-big:hover{background:rgba(74,144,226,.85)}
.lv-root.lv-paused:not(.is-empty) .lv-big{display:flex}
.lv-root.lv-audio .lv-big{top:auto;bottom:80px;transform:translateX(-50%)}
/* Commandes */
.lv-ctrls{position:absolute;left:0;right:0;bottom:0;z-index:3;padding:18px 10px 6px;cursor:default;
  background:linear-gradient(to top,rgba(0,0,0,.82),rgba(0,0,0,.45) 60%,transparent);opacity:0;transition:opacity .2s}
.lv-stage:hover .lv-ctrls,.lv-root.lv-paused .lv-ctrls,.lv-root.lv-dragging .lv-ctrls{opacity:1}
.lv-root.is-empty .lv-ctrls,.lv-root.is-empty .lv-big{display:none !important}
.lv-seek{position:relative;height:18px;display:flex;align-items:center;cursor:pointer;touch-action:none;margin:0 4px}
.lv-track{position:relative;width:100%;height:5px;border-radius:3px;background:rgba(255,255,255,.28);transition:height .12s}
.lv-seek:hover .lv-track,.lv-root.lv-dragging .lv-track{height:8px}
.lv-fill{position:absolute;left:0;top:0;bottom:0;width:0;border-radius:3px;background:#4a90e2}
.lv-knob{position:absolute;top:50%;left:0;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;background:#fff;
  box-shadow:0 1px 4px rgba(0,0,0,.5);transform:scale(0);transition:transform .12s}
.lv-seek:hover .lv-knob,.lv-root.lv-dragging .lv-knob{transform:scale(1)}
.lv-mks{position:absolute;inset:0}
.lv-mk{position:absolute;top:-5px;bottom:-5px;width:4px;margin-left:-2px;border-radius:2px;background:#ffd54a;cursor:pointer;
  box-shadow:0 0 0 1px rgba(0,0,0,.5)}
.lv-mk:hover{transform:scaleX(1.6)}
.lv-tip{position:absolute;bottom:20px;transform:translateX(-50%);padding:3px 8px;border-radius:5px;background:rgba(0,0,0,.85);
  color:#fff;font-size:12px;white-space:nowrap;pointer-events:none;opacity:0;transition:opacity .1s;font-variant-numeric:tabular-nums}
.lv-tip.is-on{opacity:1}
.lv-row{display:flex;align-items:center;gap:2px;margin-top:2px;white-space:nowrap}
.lv-cb{height:34px;min-width:34px;flex:none;display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:8px;
  background:transparent;color:#fff;font:inherit;font-size:13px;font-weight:600;line-height:1;cursor:pointer;padding:0 6px}
.lv-cb:hover{background:rgba(255,255,255,.16)}
.lv-cb:focus-visible{outline:2px solid #4a90e2}
.lv-cb.lv-play{width:40px;height:40px;border-radius:50%;background:#fff;color:#111;font-size:15px;margin-right:4px}
.lv-cb.lv-play:hover{background:#e6e6e6}
.lv-cb.lv-small{font-size:15px;font-weight:400}
.lv-cb.lv-speed{min-width:44px;border:1px solid rgba(255,255,255,.25);height:28px;border-radius:99px;font-variant-numeric:tabular-nums}
.lv-cb.is-on{color:#ffd54a;background:rgba(255,213,74,.16)}
.lv-time{margin-left:6px;font-size:12px;color:#e6e6e6;font-variant-numeric:tabular-nums}
.lv-flex{flex:1}
.lv-vol{width:72px;margin:0 4px;accent-color:#4a90e2;cursor:pointer}
.lv-exitfull{display:none !important}
.lv-root.lv-projo .lv-exitfull{display:inline-flex !important}
@container (max-width: 470px){ .lv-sm-hide{display:none !important} .lv-time{font-size:11px} }
/* Message temporaire (vitesse, volume, repère…) */
.lv-flash{position:absolute;left:50%;top:16px;transform:translateX(-50%);z-index:4;padding:6px 14px;border-radius:99px;
  background:rgba(0,0,0,.75);color:#fff;font-size:13px;font-weight:600;pointer-events:none;opacity:0;transition:opacity .25s;white-space:nowrap}
.lv-flash.is-on{opacity:1}
/* Messages au centre */
.lv-msg{position:absolute;inset:0;z-index:5;display:none;align-items:center;justify-content:center;text-align:center;
  padding:16px;cursor:default;background:#101013;color:#e6e6ea;line-height:1.4}
.lv-msg.is-on{display:flex}
.lv-msg-box{max-width:440px}
.lv-bigico{font-size:42px;line-height:1;margin-bottom:8px}
.lv-title{font-weight:700;font-size:15px;margin-bottom:4px;word-break:break-word}
.lv-btn{display:inline-block;margin-top:12px;padding:9px 18px;border-radius:99px;border:0;background:#4a90e2;color:#fff;
  font:inherit;font-weight:600;cursor:pointer}
.lv-btn:hover{background:#3b7fd0}
.lv-link{display:block;margin:10px auto 0;background:none;border:0;color:#9cc4f5;text-decoration:underline;cursor:pointer;font:inherit;font-size:12px}
.lv-hint{font-size:12px;color:#9a9aa6;margin-top:10px}
.lv-root.lv-drag .lv-stage::after{content:'Dépose ta vidéo ici';position:absolute;inset:8px;z-index:6;display:flex;align-items:center;justify-content:center;
  border:3px dashed #4a90e2;border-radius:10px;background:rgba(74,144,226,.18);color:#fff;font-weight:700;font-size:16px;pointer-events:none}
/* Réglages */
.lv-settings-wrap:empty{display:none}
.lv-settings{position:absolute;inset:0;z-index:8;background:#fff;color:#222;padding:14px 16px;overflow-y:auto;font-size:13px;user-select:auto;cursor:default}
.lv-set-title{font-weight:700;font-size:15px;margin-bottom:10px}
.lv-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:4px 12px;margin-bottom:8px}
.lv-lbl{display:block;font-weight:600;margin:8px 0 4px}
.lv-n{font-weight:400;color:#888;font-size:12px}
.lv-settings select{display:block;width:100%;box-sizing:border-box;margin-top:4px;padding:5px 6px;font:inherit;font-weight:400;
  border:1px solid #bbb;border-radius:4px;background:#fff;color:#222}
.lv-chk{display:flex;align-items:center;gap:6px;padding:3px 0;cursor:pointer}
.lv-marks{display:flex;flex-direction:column;gap:4px}
.lv-mrow{display:flex;align-items:center;gap:6px}
.lv-mnum{flex:none;width:18px;height:18px;border-radius:50%;background:#ffd54a;color:#222;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center}
.lv-mrow input{flex:1;min-width:0;padding:4px 6px;font:inherit;border:1px solid #bbb;border-radius:4px}
.lv-mgo{flex:none;padding:4px 8px;border:1px solid #bbb;border-radius:4px;background:#f5f5f5;font:inherit;font-size:12px;cursor:pointer;font-variant-numeric:tabular-nums}
.lv-mgo:hover{background:#eaeaea}
.lv-mdel{flex:none;width:26px;height:26px;border:0;border-radius:50%;background:transparent;color:#999;cursor:pointer}
.lv-mdel:hover{background:#fde8e8;color:#c0392b}
.lv-set-btn{margin-top:12px;padding:7px 12px;border:1px solid #bbb;border-radius:6px;background:#f5f5f5;color:#222;font:inherit;cursor:pointer}
.lv-set-btn:hover{background:#eaeaea}
.lv-note{margin-top:10px;font-size:12px;color:#666;line-height:1.4}
.lv-done{margin-top:12px;width:100%;padding:8px;border:0;border-radius:4px;background:#222;color:#fff;font:inherit;font-weight:600;cursor:pointer}
.lv-settings :focus-visible{outline:2px solid #4a90e2;outline-offset:1px}
/* Plein écran (bouton vert) : le widget occupe tout le tableau, la barre du haut reste affichée.
   Projection (bouton ⛶) : vrai plein écran, la barre du haut disparaît pour ne montrer que la vidéo. */
.lv-root.lv-full{position:fixed;z-index:9999;inset:0;width:auto;height:auto;border-radius:0;background:#000}
.lv-root.lv-projo .lv-bar{display:none}
.lv-root.lv-full:not(.lv-idle) .lv-ctrls{opacity:1}
.lv-root.lv-full.lv-idle:not(.lv-paused),.lv-root.lv-full.lv-idle:not(.lv-paused) .lv-stage{cursor:none}
.lv-root.lv-full.lv-idle:not(.lv-paused) .lv-ctrls{opacity:0 !important;pointer-events:none}
.lv-root:fullscreen{width:100%;height:100%}
/* Téléphone : plein écran en laissant 40 px à gauche pour les onglets latéraux (comme le Taquin) */
@media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
  .lv-root.lv-full:not(:fullscreen){left:40px;height:100vh;height:100dvh}
}
/* Écrans tactiles : commandes toujours visibles */
@media (hover: none) { .lv-ctrls{opacity:1} .lv-knob{transform:scale(1)} }
.widget.lv-is-full > .drag-handle,
.widget.lv-is-full > .widget-rotate-handle,
.widget.lv-is-full > .widget-action-bar,
.widget.lv-is-full > .widget-ctx-menu,
.widget.lv-is-full > .custom-resize-handle{display:none !important}
@media print{.lv-bar,.lv-ctrls,.lv-settings,.lv-big{display:none}}
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
        document.querySelectorAll('.lv-root').forEach(init);
        mo.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAll);
    else initAll();

    /* ── Accès public ─────────────────────────────────────────────── */
    // Création du widget (panneau Widgets, glisser-déposer sur le tableau)
    window.createLecteurVideoWidget = function () {
        return typeof createWidget === 'function' ? createWidget('lecteur-video') : null;
    };
    // Ouvre un fichier dans un widget lecteur (hp : promesse d'un handle, facultative)
    window.lvOpenFile = function (widget, file, hp) {
        const root = widget && widget.querySelector('.lv-root');
        if (!root || !file) return;
        const s = S(root);
        build(root);
        s.inited = true;   // pas de message « Ouvre une vidéo » : le fichier arrive
        openFileWithHandle(root, file, hp);
    };
    window.lvIsMediaFile = isMediaFile;

    // Sauvegarde / chargement (utilisés par save-load.js)
    // On sauvegarde les réglages, le nom du fichier, le moment de lecture et les repères.
    // La vidéo elle-même n'est pas copiée dans le tableau.
    window.lvGetData = function (widget) {
        const root = widget && widget.querySelector('.lv-root');
        if (!root) return null;
        const st = getState(root);
        const v = vid(root);
        if (loaded(root) && v && isFinite(v.currentTime)) st.t = Math.round(v.currentTime * 10) / 10;
        return { id: root.getAttribute('data-lv-id') || null, cfg: getCfg(root), name: st.name, t: st.t, audio: st.audio, markers: st.markers };
    };
    window.lvSetData = function (widget, data) {
        const root = widget && widget.querySelector('.lv-root');
        if (!root || !data) return;
        if (data.cfg) root.setAttribute('data-cfg', JSON.stringify(data.cfg));
        if (data.id) root.setAttribute('data-lv-id', data.id);
        setState(root, { name: data.name || '', t: data.t || 0, audio: !!data.audio, markers: Array.isArray(data.markers) ? data.markers : [] });
        const s = S(root);
        build(root);
        s.inited = true;
        tryRestore(root);
    };
})();
