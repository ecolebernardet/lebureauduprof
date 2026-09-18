// =========================================================================
// WIDGET IMAGE — Le Bureau du Prof
// Permet d'insérer une image depuis le dossier /images sur le bureau.
//
// Dépendances globales (définies dans widgets.js / save-load.js) :
//   board, findFreePosition(), makeDraggable(), makeDraggableRotate(),
//   bringToFront(), _addStickerResizeHandle(), snapshotNow(), saveBoard()
// =========================================================================

// ── Catégories d'images ───────────────────────────────────────────────────
// Pour ajouter une catégorie : { id, label, icon, images: [{src, label}, ...] }
// Pour ajouter une image     : ajouter { src, label } dans images[] de la bonne catégorie
// ─────────────────────────────────────────────────────────────────────────
if (!window.IMAGE_CATEGORIES) {
    window.IMAGE_CATEGORIES = [
        {
            id: 'maths',
            label: 'Maths',
            icon: '🧮️',
            images: [
                { src: 'images/maths-table-pythagore.jpg',                          label: 'Maths (table de Pythagore)' },
				{ src: 'images/maths-tableau-conversion-contenances.jpg',           label: 'Maths (tableau de conversion des mesures de contenances)' },
                { src: 'images/maths-tableau-conversion-longueurs.jpg',             label: 'Maths (tableau de conversion des mesures de longueurs)' },
				{ src: 'images/maths-tableau-conversion-masses.jpg',                label: 'Maths (tableau de conversion des mesures de masses)' },
                { src: 'images/maths-tableau-numeration-decimaux.jpg',              label: 'Maths (tableau de numération des nombres décimaux)' },
				{ src: 'images/maths-tableau-numeration-entiers.jpg',               label: 'Maths (tableau de numération des nombres entiers)' },
				{ src: 'images/maths-droite-numerique-petits-carreaux.jpg',         label: 'Maths (droite numérique - centièmes)' },
				{ src: 'images/maths-droite-numerique-millimetre.jpg',              label: 'Maths (droite numérique - dixièmes)' },
				{ src: 'images/maths-graphique.jpg',                                label: 'Maths (graphique)' },
				{ src: 'images/maths-tableau-proportionnalite.jpg',                 label: 'Maths (tableau de proportionnalité)' },
				{ src: 'images/maths-tangram-24x24.jpg',                            label: 'Maths (tangram)' },
            ]
        },
		{
            id: 'ecole',
            label: 'École',
            icon: '🏫',
            images: [
				{ src: 'images/ecole-equerre.png',                               label: 'Équerre' },
				{ src: 'images/ecole-regle.png',                                 label: 'Règle' },
				{ src: 'images/ecole-regle2.png',                                label: 'Règle' },
				{ src: 'images/ecole-compas.png',                                label: 'Compas' },
				{ src: 'images/ecole-stylos.png',                                label: 'Stylos' },
				{ src: 'images/ecole-stylo-noir.png',                            label: 'Stylo noir' },
				{ src: 'images/ecole-stylo-plume.png',                           label: 'Stylo plume' },
				{ src: 'images/ecole-crayon-papier.png',                         label: 'Crayon à papier' },
				{ src: 'images/ecole-gomme.png',                                 label: 'Gomme' },
				{ src: 'images/ecole-trousse.png',                               label: 'Trousse' },
				{ src: 'images/ecole-sac.png',                                   label: 'Sac' },
				{ src: 'images/ecole-taille-crayon.png',                         label: 'Taille-crayon' },
				{ src: 'images/ecole-colle.png',                                 label: 'Colle' },
				{ src: 'images/ecole-classeur.png',                              label: 'Classeur' },
				{ src: 'images/ecole-cahiers.png',                               label: 'Cahiers' },
            ]
        },
		{
            id: 'instruments',
            id: 'instruments',
            label: 'Instruments',
            icon: '🎺',
            images: [
                { src: 'images/instruments-guitare-elec.png',             label: 'Guitare électrique' },
				{ src: 'images/instruments-guitare-elec2.png',            label: 'Guitare électrique' },
				{ src: 'images/instruments-guitare-classique.png',        label: 'Guitare classique' },
				{ src: 'images/instruments-basse-elec.png',               label: 'Basse électrique' },
				{ src: 'images/instruments-violon.png',                   label: 'Violon' },
				{ src: 'images/instruments-violoncelle.png',              label: 'Violoncelle' },
				{ src: 'images/instruments-contrebasse.png',              label: 'Contrebasse' },
			]
        },
		{
            id: 'divers',
            label: 'Divers',
            icon: '🪅',
            images: [
                { src: 'images/divers-postit.png',    label: 'Post-it' },
			]
        },
		{
            id: 'saisons',
            label: 'Saisons',
            icon: '🌼',
            images: [
                { src: 'images/saisons-printemps01.png',    label: 'Printemps' },
				{ src: 'images/saisons-printemps02.png',    label: 'Printemps' },
				{ src: 'images/saisons-printemps03.png',    label: 'Printemps' },
				{ src: 'images/saisons-printemps04.png',    label: 'Printemps' },
				{ src: 'images/saisons-printemps05.png',    label: 'Printemps' },
				{ src: 'images/saisons-printemps06.png',    label: 'Printemps' },
				{ src: 'images/saisons-printemps07.png',    label: 'Printemps' },
				{ src: 'images/saisons-printemps08.png',    label: 'Printemps' },
				{ src: 'images/saisons-ete01.png',          label: 'Été' },
            ]
        },
		{
            id: 'monnaie',
            label: 'Monnaie',
            icon: '💶',
            images: [
                { src: 'images/monnaie-billet-5.jpg',   label: 'Billet de 5 euros' },
                { src: 'images/monnaie-billet-10.jpg',  label: 'Billet de 10 euros' },
                { src: 'images/monnaie-billet-20.jpg',  label: 'Billet de 20 euros' },
                { src: 'images/monnaie-billet-50.jpg',  label: 'Billet de 50 euros' },
                { src: 'images/monnaie-billet-100.jpg', label: 'Billet de 100 euros' },
                { src: 'images/monnaie-piece-001.png',  label: 'Pièce de 1 centime' },
                { src: 'images/monnaie-piece-002.png',  label: 'Pièce de 2 centimes' },
                { src: 'images/monnaie-piece-005.png',  label: 'Pièce de 5 centimes' },
                { src: 'images/monnaie-piece-010.png',  label: 'Pièce de 10 centimes' },
                { src: 'images/monnaie-piece-020.png',  label: 'Pièce de 20 centimes' },
                { src: 'images/monnaie-piece-050.png',  label: 'Pièce de 50 centimes' },
                { src: 'images/monnaie-piece-1.png',    label: 'Pièce de 1 euro' },
                { src: 'images/monnaie-piece-2.png',    label: 'Pièce de 2 euros' },
            ]
        },
		{
            id: 'BD',
            label: 'BD',
            icon: '💬',
            images: [
                { src: 'images/BD01.png',    label: 'BD' },
				{ src: 'images/BD02.png',    label: 'BD' },
				{ src: 'images/BD03.png',    label: 'BD' },
				{ src: 'images/BD04.png',    label: 'BD' },
				{ src: 'images/BD05.png',    label: 'BD' },
				{ src: 'images/BD06.png',    label: 'BD' },
				{ src: 'images/BD07.png',    label: 'BD' },
				{ src: 'images/BD08.png',    label: 'BD' },
				{ src: 'images/BD09.png',    label: 'BD' },
				{ src: 'images/BD10.png',    label: 'BD' },
				{ src: 'images/BD11.png',    label: 'BD' },
				{ src: 'images/BD12.png',    label: 'BD' },
				{ src: 'images/BD13.png',    label: 'BD' },
				{ src: 'images/BD14.png',    label: 'BD' },
				{ src: 'images/BD15.png',    label: 'BD' },
				{ src: 'images/BD16.png',    label: 'BD' },
				{ src: 'images/BD17.png',    label: 'BD' },
				{ src: 'images/BD18.png',    label: 'BD' },
				{ src: 'images/BD19.png',    label: 'BD' },
				{ src: 'images/BD20.png',    label: 'BD' },
            ]
        },
		{
            id: 'animaux',
            label: 'Animaux',
            icon: '😺',
            images: [
                { src: 'images/animaux-cerf.png',        label: 'Le cerf' },
				{ src: 'images/animaux-chat.png',        label: 'Le chat' },
				{ src: 'images/animaux-cheval.png',      label: 'Le cheval' },
				{ src: 'images/animaux-chevre.png',      label: 'La chèvre' },
				{ src: 'images/animaux-chien.png',       label: 'Le chien' },
				{ src: 'images/animaux-cochon.png',      label: 'Le cochon' },
				{ src: 'images/animaux-ecureuil.png',    label: 'L\'écureuil' },
				{ src: 'images/animaux-elephant.png',    label: 'L\'éléphant' },
				{ src: 'images/animaux-girafe.png',      label: 'La girafe' },
				{ src: 'images/animaux-hippopotame.png', label: 'L\'hippopotame' },
				{ src: 'images/animaux-kangourou.png',   label: 'Le kangoutou' },
				{ src: 'images/animaux-lion.png',        label: 'Le lion' },
				{ src: 'images/animaux-loup.png',        label: 'Le loup' },
				{ src: 'images/animaux-mouton.png',      label: 'Le mouton' },
				{ src: 'images/animaux-renard.png',      label: 'Le renard' },
				{ src: 'images/animaux-rhinoceros.png',  label: 'Le rhinocéros' },
				{ src: 'images/animaux-tigre.png',       label: 'Le tigre' },
				{ src: 'images/animaux-vache.png',       label: 'La vache' },
				{ src: 'images/animaux-zebre.png',       label: 'Le zèbre' },
            ]
        },
		
		{
            id: 'météo',
            label: 'Météo',
            icon: '⛅',
            images: [
                { src: 'images/meteo-arcenciel1.png',    label: 'Arc en ciel' },
				{ src: 'images/meteo-arcenciel2.png',    label: 'Arc en ciel' },
				{ src: 'images/meteo-arcenciel3.png',    label: 'Arc en ciel' },
				{ src: 'images/meteo-arcenciel4.png',           label: 'Arc en ciel' },
				{ src: 'images/meteo-nuage1.png',               label: 'Nuage' },
				{ src: 'images/meteo-pluie1.png',               label: 'Pluie' },
				{ src: 'images/meteo-soleil-rayons1.png',       label: 'Soleil' },
				{ src: 'images/meteo-soleil-rayons2.png',       label: 'Soleil' },
            ]
        },
		{
            id: 'cadres',
            label: 'Cadres',
            icon: '🖼️',
            images: [
                { src: 'images/cadre01.png',    label: 'Cadre' },
				{ src: 'images/cadre02.png',    label: 'Cadre' },
				{ src: 'images/cadre03.png',    label: 'Cadre' },
				{ src: 'images/cadre04.png',    label: 'Cadre' },
				{ src: 'images/cadre05.png',    label: 'Cadre' },
				{ src: 'images/cadre06.png',    label: 'Cadre' },
				{ src: 'images/cadre07.png',    label: 'Cadre' },
				{ src: 'images/cadre08.png',    label: 'Cadre' },
				{ src: 'images/cadre09.png',    label: 'Cadre' },
				{ src: 'images/cadre10.png',    label: 'Cadre' },
            ]
        },
		{
            id: 'textures',
            label: 'Textures',
            icon: '📜',
            images: [
                { src: 'images/texture01.png',    label: 'Texture' },
				{ src: 'images/texture02.png',    label: 'Texture' },
				{ src: 'images/texture03.png',    label: 'Texture' },
				{ src: 'images/texture04.png',    label: 'Texture' },
				{ src: 'images/texture05.png',    label: 'Texture' },
				{ src: 'images/texture06.png',    label: 'Texture' },
				{ src: 'images/texture07.png',    label: 'Texture' },
				{ src: 'images/texture08.png',    label: 'Texture' },
				{ src: 'images/texture09.png',    label: 'Texture' },
				{ src: 'images/texture10.png',    label: 'Texture' },
				{ src: 'images/texture11.png',    label: 'Texture' },
				{ src: 'images/texture12.png',    label: 'Texture' },
            ]
        },
		{
            id: 'geographie',
            label: 'Géographie',
            icon: '🌍',
            images: [
                { src: 'images/carte-france01.png',              label: 'France (vierge)' },
				{ src: 'images/carte-france02.png',              label: 'France (contour)' },
                { src: 'images/carte-france-departements01.png', label: 'Départements français (numéros)' },
				{ src: 'images/carte-france-departements02.png', label: 'Départements français (vierge)' },
                { src: 'images/carte-france-regions01.png',      label: 'Régions françaises (vierge)' },
				{ src: 'images/carte-france-regions02.png',      label: 'Régions françaises (noms)' },
                { src: 'images/carte-europe-pays01.png',         label: "Pays d'Europe (vierge)" },
				{ src: 'images/carte-europe-pays02.png',         label: "Pays d'Europe (vierge)" },
                { src: 'images/carte-monde01.png',               label: 'Monde (vierge)' },
				{ src: 'images/carte-monde02.png',               label: 'Monde (vierge)' },
                { src: 'images/carte-monde-pays01.png',          label: 'Pays du monde (noms)' },
				{ src: 'images/carte-monde-drapeaux01.png',      label: 'Globe (drapeaux)' },
            ]
        },
    ];
}

// IMAGE_LIBRARY : reconstruction automatique pour la recherche globale et la rétrocompatibilité
if (!window.IMAGE_LIBRARY) {
    window.IMAGE_LIBRARY = window.IMAGE_CATEGORIES.flatMap(cat =>
        cat.images.map(img => ({ ...img, _catId: cat.id, _catLabel: cat.label, _catIcon: cat.icon }))
    );
}

// ── État du panneau ───────────────────────────────────────────────────────
let _imagePanelBuilt = false;
let _imagePanelExtraImages = []; // images ajoutées via upload (data URLs)
let _imagePanelActiveTab = null; // id de la catégorie active, null = toutes

// ── Panneau HTML ──────────────────────────────────────────────────────────
function _buildImagePanel() {
    if (_imagePanelBuilt) return;
    _imagePanelBuilt = true;

    // Onglet actif par défaut = première catégorie
    _imagePanelActiveTab = window.IMAGE_CATEGORIES[0]?.id || null;

    const section = document.getElementById('sp-images-section');
    if (!section) return; // panneau Visuels absent de la page

    section.innerHTML = `
        <div id="image-panel-search">
            <input type="text" id="image-search-input" placeholder="🔍 Rechercher une image…">
        </div>
        <div id="image-panel-tabs"></div>
        <div id="image-panel-grid">
            <div id="image-panel-empty">Aucune image trouvée.</div>
        </div>
        <div id="image-panel-footer">
            <div id="image-upload-btn" title="Importer une image depuis votre ordinateur">
                ＋ Importer une image…
            </div>
            <input type="file" id="image-upload-input" accept="image/*" multiple>
        </div>
    `;

    // Onglets — un bouton par catégorie
    const tabsContainer = document.getElementById('image-panel-tabs');
    window.IMAGE_CATEGORIES.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'img-tab-btn' + (cat.id === _imagePanelActiveTab ? ' active' : '');
        btn.dataset.catId = cat.id;
        btn.textContent = cat.icon + ' ' + cat.label;
        btn.addEventListener('click', () => {
            _imagePanelActiveTab = cat.id;
            document.getElementById('image-search-input').value = '';
            tabsContainer.querySelectorAll('.img-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            _renderImageGrid();
        });
        tabsContainer.appendChild(btn);
    });

    // Recherche — désactive les onglets et affiche tous les résultats
    document.getElementById('image-search-input').addEventListener('input', (e) => {
        const q = e.target.value.trim().toLowerCase();
        if (q) {
            // Mode recherche : aucun onglet actif
            tabsContainer.querySelectorAll('.img-tab-btn').forEach(b => b.classList.remove('active'));
            _imagePanelActiveTab = null;
        } else {
            // Retour à l'onglet actif précédent (ou premier)
            _imagePanelActiveTab = window.IMAGE_CATEGORIES[0]?.id || null;
            tabsContainer.querySelectorAll('.img-tab-btn').forEach(b => {
                b.classList.toggle('active', b.dataset.catId === _imagePanelActiveTab);
            });
        }
        _renderImageGrid(q);
    });

    document.getElementById('image-upload-btn').addEventListener('click', () => {
        document.getElementById('image-upload-input').click();
    });

    document.getElementById('image-upload-input').addEventListener('change', (e) => {
        const files = Array.from(e.target.files || []);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                _imagePanelExtraImages.push({ src: ev.target.result, label: file.name, dataUrl: true });
                // Basculer sur l'onglet "Importées" et le créer si besoin
                _imagePanelActiveTab = '__imported__';
                _refreshImportedTab();
                _renderImageGrid();
            };
            reader.readAsDataURL(file);
        });
        e.target.value = '';
    });

    _renderImageGrid();
}

function _refreshImportedTab() {
    const tabsContainer = document.getElementById('image-panel-tabs');
    if (!tabsContainer) return;
    // Créer l'onglet "Importées" s'il n'existe pas encore
    if (!tabsContainer.querySelector('[data-cat-id="__imported__"]')) {
        const btn = document.createElement('button');
        btn.className = 'img-tab-btn';
        btn.dataset.catId = '__imported__';
        btn.textContent = '📎 Importées';
        btn.addEventListener('click', () => {
            _imagePanelActiveTab = '__imported__';
            document.getElementById('image-search-input').value = '';
            tabsContainer.querySelectorAll('.img-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            _renderImageGrid();
        });
        tabsContainer.appendChild(btn);
    }
    // Activer cet onglet visuellement
    tabsContainer.querySelectorAll('.img-tab-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.catId === '__imported__');
    });
}

function _renderImageGrid(filter = '') {
    const grid = document.getElementById('image-panel-grid');
    const emptyMsg = document.getElementById('image-panel-empty');
    if (!grid) return;

    grid.querySelectorAll('.img-panel-thumb, .img-category-title').forEach(el => el.remove());

    if (filter) {
        // ── Mode recherche : toutes catégories + importées, avec titres de section ──
        const allImages = [...window.IMAGE_LIBRARY, ..._imagePanelExtraImages];
        const filtered = allImages.filter(img => img.label.toLowerCase().includes(filter));

        if (filtered.length === 0) { emptyMsg.style.display = 'block'; return; }
        emptyMsg.style.display = 'none';

        const bycat = {};
        filtered.forEach(img => {
            const key = img._catLabel || '📎 Importées';
            if (!bycat[key]) bycat[key] = [];
            bycat[key].push(img);
        });
        Object.entries(bycat).forEach(([catLabel, imgs]) => {
            const title = document.createElement('div');
            title.className = 'img-category-title';
            title.textContent = catLabel;
            grid.appendChild(title);
            imgs.forEach(img => grid.appendChild(_makeThumb(img)));
        });

    } else if (_imagePanelActiveTab === '__imported__') {
        // ── Onglet Importées ──
        if (_imagePanelExtraImages.length === 0) { emptyMsg.style.display = 'block'; return; }
        emptyMsg.style.display = 'none';
        _imagePanelExtraImages.forEach(img => grid.appendChild(_makeThumb(img)));

    } else {
        // ── Onglet catégorie normale ──
        const cat = window.IMAGE_CATEGORIES.find(c => c.id === _imagePanelActiveTab);
        const images = cat ? cat.images : [];

        if (images.length === 0) { emptyMsg.style.display = 'block'; return; }
        emptyMsg.style.display = 'none';
        images.forEach(img => grid.appendChild(_makeThumb(img)));
    }
}

function _makeThumb(img) {
    const thumb = document.createElement('div');
    thumb.className = 'img-panel-thumb';
    thumb.title = img.label;

    const image = document.createElement('img');
    image.src = img.src;
    image.alt = img.label;
    image.loading = 'lazy';

    const label = document.createElement('div');
    label.className = 'img-panel-label';
    label.textContent = img.label;

    thumb.appendChild(image);
    thumb.appendChild(label);
    thumb.addEventListener('click', () => _insertImageWidget(img.src, img.label));
    return thumb;
}

// ── Menu de transparence (double-clic sur image widget) ──────────────────
let _imgOpacityMenu = null;

function _closeImgOpacityMenu() {
    if (_imgOpacityMenu) { _imgOpacityMenu.remove(); _imgOpacityMenu = null; }
}

function _openImgOpacityMenu(widget, img, clientX, clientY) {
    _closeImgOpacityMenu();

    const menu = document.createElement('div');
    menu.className = 'img-opacity-menu';
    _imgOpacityMenu = menu;

    // Lire l'opacité courante (stockée en dataset ou 1 par défaut)
    const currentOpacity = parseFloat(widget.dataset.imgOpacity ?? 1);
    const currentPct = Math.round(currentOpacity * 100);

    menu.innerHTML = `
        <div class="img-opacity-menu-title">☀ Transparence</div>
        <div class="img-opacity-row">
            <input class="img-opacity-slider" type="range" min="0" max="100" value="${currentPct}">
            <span class="img-opacity-val">${currentPct}%</span>
        </div>
    `;

    document.body.appendChild(menu);

    // Positionner près du curseur, en restant dans l'écran
    const mw = 200, mh = 70;
    let x = clientX + 12, y = clientY + 12;
    if (x + mw > window.innerWidth)  x = clientX - mw - 4;
    if (y + mh > window.innerHeight) y = clientY - mh - 4;
    menu.style.left = x + 'px';
    menu.style.top  = y + 'px';

    const slider = menu.querySelector('.img-opacity-slider');
    const valEl  = menu.querySelector('.img-opacity-val');

    slider.addEventListener('input', () => {
        const pct = parseInt(slider.value);
        valEl.textContent = pct + '%';
        const opacity = pct / 100;
        img.style.opacity = opacity;
        widget.dataset.imgOpacity = opacity;
    });

    slider.addEventListener('change', () => saveBoard());

    // Fermer au clic en dehors
    setTimeout(() => {
        document.addEventListener('mousedown', function onOut(e) {
            if (menu.contains(e.target)) return;
            _closeImgOpacityMenu();
            document.removeEventListener('mousedown', onOut);
        });
    }, 10);
}

// ── Insertion d'une image sur le bureau ───────────────────────────────────
function _insertImageWidget(src, label) {
    const tmpImg = new Image();
    tmpImg.onload = () => {
        _doInsertImageWidget(src, label, tmpImg.naturalWidth, tmpImg.naturalHeight);
    };
    tmpImg.onerror = () => {
        _doInsertImageWidget(src, label, 400, 300);
    };
    tmpImg.src = src;
}

function _doInsertImageWidget(src, label, naturalW, naturalH, opts) {
    const MAX_W = 900;
    const MAX_H = 600;
    let w = naturalW, h = naturalH;
    if (w > MAX_W || h > MAX_H) {
        const ratio = Math.min(MAX_W / w, MAX_H / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
    }
    if (w < 80) { h = Math.round(h * 80 / w); w = 80; }
    if (h < 80) { w = Math.round(w * 80 / h); h = 80; }

    snapshotNow();
    const pos = (opts && opts.skipFreePos)
        ? { x: opts.left || 0, y: opts.top || 0 }
        : findFreePosition(w, h);

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'sticker';
    widget.dataset.transparent = 'true';
    widget.dataset.imageWidget = 'true';
    widget.dataset.imgOpacity = '1';
    widget.dataset.flipX = '1';
    widget.dataset.flipY = '1';
    widget.style.cssText = `left:${pos.x}px; top:${pos.y}px; width:${w}px; height:${h}px; overflow:visible; flex-direction:row;`;
    widget.style.setProperty('--sticker-h', h + 'px');
    widget.tabIndex = 0;

    const img = document.createElement('img');
    img.src = src;
    img.alt = label || 'Image';
    img.draggable = false;
    img.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; object-fit:fill; pointer-events:none; padding:0; box-sizing:border-box; transform-origin:center center;';

    widget.innerHTML = `
        <div class="drag-handle" title="Déplacer">✥</div>
        <div class="widget-rotate-handle" title="Faire pivoter">↻</div>
        <div class="widget-action-bar">
            <div class="widget-menu-handle" onclick="toggleCtxMenu(this.closest('.widget,.shape-widget'))" title="Menu">☰</div>
            <div class="widget-pin-handle" onclick="togglePin(this.closest('.widget'))" title="Épingler">📌</div>
            <div class="widget-back-handle" onclick="sendToBack(this.closest('.widget'))" title="Envoyer derrière">🔽</div>
            <div class="widget-anchor-handle" onclick="toggleAnchorImage(this.closest('.widget'))" title="Ancrer (rendre insélectionnable)">⚓</div>
            <div class="widget-close-handle" onclick="snapshotNow();this.closest('.widget').remove();saveBoard();" title="Fermer">×</div>
        </div>
        <div class="widget-ctx-menu"></div>
        <div class="flip-h-btn"      title="Symétrie horizontale">↔</div>
        <div class="flip-v-btn"      title="Symétrie verticale">↕</div>
        <div class="resize-lock-btn" title="Verrouiller les proportions (ou Shift)">🔓</div>
    `;
    widget.appendChild(img);

    // ── Flip horizontal ──
    const flipHBtn = widget.querySelector('.flip-h-btn');
    const flipVBtn = widget.querySelector('.flip-v-btn');
    const lockBtn  = widget.querySelector('.resize-lock-btn');

    flipHBtn.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); });
    flipHBtn.addEventListener('touchstart', e => { e.stopPropagation(); }, { passive: true });
    flipHBtn.addEventListener('click', e => {
        e.stopPropagation();
        snapshotNow();
        widget.dataset.flipX = String(parseFloat(widget.dataset.flipX || 1) * -1);
        _applyImgFlip(widget, img);
    });

    // ── Flip vertical ──
    flipVBtn.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); });
    flipVBtn.addEventListener('touchstart', e => { e.stopPropagation(); }, { passive: true });
    flipVBtn.addEventListener('click', e => {
        e.stopPropagation();
        snapshotNow();
        widget.dataset.flipY = String(parseFloat(widget.dataset.flipY || 1) * -1);
        _applyImgFlip(widget, img);
    });

    // ── Verrouillage proportions ──
    lockBtn.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); });
    lockBtn.addEventListener('touchstart', e => { e.stopPropagation(); }, { passive: true });
    lockBtn.addEventListener('click', e => {
        e.stopPropagation();
        const locked = lockBtn.classList.toggle('locked');
        lockBtn.textContent = locked ? '🔒' : '🔓';
    });

    // ── Poignée resize custom (même système que les autres widgets) ──
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'custom-resize-handle';
    resizeHandle.title = 'Redimensionner';
    widget.appendChild(resizeHandle);

    resizeHandle.addEventListener('pointerdown', e => {
        if (e.button !== undefined && e.button !== 0) return;
        e.preventDefault(); e.stopPropagation();
        resizeHandle.setPointerCapture(e.pointerId);
        snapshotNow();
        const startX = e.clientX, startY = e.clientY;
        const startW = widget.offsetWidth, startH = widget.offsetHeight;
        const ratio  = startH / startW;

        function onMove(ev) {
            ev.preventDefault();
            const proportional = ev.shiftKey || lockBtn.classList.contains('locked');
            let newW = Math.max(40, startW + ev.clientX - startX);
            let newH = Math.max(40, startH + ev.clientY - startY);
            if (proportional) newH = Math.round(newW * ratio);
            widget.style.width  = newW + 'px';
            widget.style.height = newH + 'px';
            widget.style.setProperty('--sticker-h', newH + 'px');
        }
        function onUp() {
            resizeHandle.removeEventListener('pointermove',   onMove);
            resizeHandle.removeEventListener('pointerup',     onUp);
            resizeHandle.removeEventListener('pointercancel', onUp);
            saveBoard();
        }
        resizeHandle.addEventListener('pointermove',   onMove);
        resizeHandle.addEventListener('pointerup',     onUp);
        resizeHandle.addEventListener('pointercancel', onUp);
    });

    widget.addEventListener('mousedown', () => {
        // Ne pas prendre le focus ni remonter au premier plan si ancré ou en mode dessin
        if (widget.dataset.anchored === 'true') return;
        if (typeof isDrawMode !== 'undefined' && (isDrawMode || isEraserMode)) return;
        bringToFront(widget);
        widget.focus();
        if (typeof positionActionBar === 'function') positionActionBar(widget);
    });

    widget.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        e.preventDefault();
        _openImgOpacityMenu(widget, img, e.clientX, e.clientY);
    });

    // ── Menu clic droit (capture pour passer avant tout listener global) ──
    widget.addEventListener('contextmenu', (e) => {
        if (widget.dataset.anchored === 'true') return;
        if (typeof isDrawMode !== 'undefined' && (isDrawMode || isEraserMode)) return;
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        _openImgContextMenu(widget, img, e.clientX, e.clientY);
    }, true);

    board.appendChild(widget);
    bringToFront(widget);
    makeDraggable(widget);
    makeDraggableRotate(widget);

    // Restaurer l'état ancré si chargé depuis la sauvegarde
    if (opts && opts.anchored) {
        widget.dataset.anchored = 'true';
        _applyAnchorState(widget, true);
    }

    saveBoard();
    return widget;
}

// ── Menu contextuel clic droit sur image widget ───────────────────────────
let _imgCtxMenu = null;

function _closeImgContextMenu() {
    if (_imgCtxMenu) { _imgCtxMenu.remove(); _imgCtxMenu = null; }
}

function _openImgContextMenu(widget, img, clientX, clientY) {
    _closeImgContextMenu();
    _closeImgOpacityMenu();

    const isPinned   = widget.dataset.pinned === 'true';
    const isAnchored = widget.dataset.anchored === 'true';

    const menu = document.createElement('div');
    menu.className = 'img-ctx-menu';
    _imgCtxMenu = menu;

    const items = [
        {
            icon: '📌',
            label: isPinned ? 'Désépingler' : 'Épingler',
            action: () => { togglePin(widget); }
        },
        {
            icon: '⚓',
            label: isAnchored ? 'Désancrer' : 'Ancrer',
            action: () => { toggleAnchorImage(widget); }
        },
        {
            icon: '🔽',
            label: 'Envoyer derrière',
            action: () => { sendToBack(widget); }
        },
        { separator: true },
        {
            icon: '⧉',
            label: 'Dupliquer',
            action: () => { cloneWidget(widget); }
        },
        {
            icon: '☀',
            label: 'Transparence\u2026',
            action: () => { _openImgOpacityMenu(widget, img, clientX, clientY); }
        },
        { separator: true },
        {
            icon: '×',
            label: 'Supprimer',
            danger: true,
            action: () => { snapshotNow(); widget.remove(); saveBoard(); }
        },
    ];

    items.forEach(item => {
        if (item.separator) {
            const sep = document.createElement('div');
            sep.className = 'img-ctx-menu-sep';
            menu.appendChild(sep);
            return;
        }
        const btn = document.createElement('div');
        btn.className = 'img-ctx-menu-item' + (item.danger ? ' danger' : '');
        btn.innerHTML = '<span class="img-ctx-menu-icon">' + item.icon + '</span><span>' + item.label + '</span>';
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            _closeImgContextMenu();
            item.action();
        });
        menu.appendChild(btn);
    });

    document.body.appendChild(menu);

    // Positionner près du curseur, en restant dans l'écran
    const mw = 190, mh = menu.offsetHeight || 220;
    let x = clientX + 4, y = clientY + 4;
    if (x + mw > window.innerWidth)  x = clientX - mw - 4;
    if (y + mh > window.innerHeight) y = clientY - mh - 4;
    menu.style.left = x + 'px';
    menu.style.top  = y + 'px';

    // Fermer au clic en dehors ou Escape
    setTimeout(() => {
        function onOut(e) {
            if (menu.contains(e.target)) return;
            _closeImgContextMenu();
            document.removeEventListener('mousedown', onOut);
            document.removeEventListener('keydown', onKey);
        }
        function onKey(e) {
            if (e.key === 'Escape') {
                _closeImgContextMenu();
                document.removeEventListener('mousedown', onOut);
                document.removeEventListener('keydown', onKey);
            }
        }
        document.addEventListener('mousedown', onOut);
        document.addEventListener('keydown', onKey);
    }, 10);
}

function _applyImgFlip(widget, img) {
    const sx = parseFloat(widget.dataset.flipX || 1);
    const sy = parseFloat(widget.dataset.flipY || 1);
    img.style.transform = (sx !== 1 || sy !== 1) ? `scale(${sx}, ${sy})` : '';
    saveBoard();
}

// ── Ancrage d'une image widget (rend le widget insélectionnable) ──────────
function toggleAnchorImage(widget) {
    if (!widget) return;
    const isAnchored = widget.dataset.anchored === 'true';
    if (isAnchored) {
        widget.dataset.anchored = 'false';
        _applyAnchorState(widget, false);
        // Remettre au premier plan (annuler le sendToBack automatique)
        if (widget.dataset.background === 'true') {
            widget.dataset.background = 'false';
            if (typeof widgetZCounter !== 'undefined') {
                widgetZCounter++;
                widget.style.zIndex = widgetZCounter;
            }
        }
    } else {
        snapshotNow();
        widget.dataset.anchored = 'true';
        // Envoyer derrière le canvas de dessin pour pouvoir écrire par-dessus
        if (widget.dataset.background !== 'true') {
            widget.style.zIndex = 1;
            widget.dataset.pinned = 'false';
            widget.classList.remove('pinned');
            widget.dataset.background = 'true';
        }
        _applyAnchorState(widget, true);
    }
    saveBoard();
}

function _applyAnchorState(widget, anchored) {
    const anchorBtn = widget.querySelector('.widget-anchor-handle');
    if (anchored) {
        // Ne pas mettre pointer-events:none sur le widget entier — ça bloquerait
        // les événements de dessin. On intercepte uniquement mousedown/touchstart/pointerdown
        // en phase capture pour stopper le drag, mais SEULEMENT hors mode dessin.
        if (!widget._anchorBlocker) {
            widget._anchorBlocker = (e) => {
                if (e.target && e.target.classList && e.target.classList.contains('anchor-badge')) return;
                if (typeof isDrawMode !== 'undefined' && (isDrawMode || isEraserMode)) return;
                e.stopPropagation();
            };
        }
        widget.addEventListener('mousedown',   widget._anchorBlocker, true);
        widget.addEventListener('touchstart',  widget._anchorBlocker, { capture: true, passive: true });
        widget.addEventListener('pointerdown', widget._anchorBlocker, true);
        // Perdre le focus immédiatement si le widget l'obtient (évite le contour bleu)
        if (!widget._anchorFocusBlocker) {
            widget._anchorFocusBlocker = () => { widget.blur(); };
        }
        widget.addEventListener('focus', widget._anchorFocusBlocker, true);
        // Supprimer la classe selected si elle est déjà là, et empêcher toute apparence sélectionnée
        widget.classList.remove('selected');
        widget.dataset.anchorNoSelect = 'true';
        // Empêcher le focus natif du navigateur (tabIndex=-1 = non focusable)
        widget._anchorPrevTabIndex = widget.tabIndex;
        widget.tabIndex = -1;
        // MutationObserver : retire immédiatement 'selected' et le style bleu si ajoutés
        if (!widget._anchorObserver) {
            widget._anchorObserver = new MutationObserver(() => {
                if (widget.dataset.anchored !== 'true') return;
                if (widget.classList.contains('selected')) {
                    widget.classList.remove('selected');
                    // Retirer aussi de selectedWidgets si présent
                    if (typeof selectedWidgets !== 'undefined') {
                        selectedWidgets = selectedWidgets.filter(w => w !== widget);
                    }
                }
                // Annuler tout outline/border imposé par le focus ou la sélection
                widget.style.outline = 'none';
                widget.style.boxShadow = '';
            });
            widget._anchorObserver.observe(widget, { attributes: true, attributeFilter: ['class', 'style'] });
        }

        // Badge visible pour désancrer — attaché au body en position:fixed
        // pour être hors du #board et invisible pour html2canvas
        let badge = document.querySelector('.anchor-badge[data-widget-id="' + widget.dataset.anchorId + '"]');
        if (!badge) {
            // Donner un id unique au widget si pas encore fait
            if (!widget.dataset.anchorId) {
                widget.dataset.anchorId = 'anc_' + Date.now() + '_' + Math.random().toString(36).slice(2);
            }
            badge = document.createElement('div');
            badge.className = 'anchor-badge';
            badge.dataset.widgetId = widget.dataset.anchorId;
            badge.title = 'Image ancrée — cliquer pour désancrer';
            badge.textContent = '⚓';
            badge.style.cssText = [
                'position:fixed',
                'font-size:14px',
                'line-height:1',
                'pointer-events:auto',
                'cursor:pointer',
                'z-index:99999',
                'background:rgba(0,0,0,0.55)',
                'border-radius:50%',
                'padding:3px 4px',
                'color:#f0c040',
                'text-shadow:0 0 4px #f0a020',
                'user-select:none'
            ].join(';');
            // Positionner le badge sur le widget
            function _updateBadgePos() {
                if (!badge.parentNode) return;
                var r = widget.getBoundingClientRect();
                badge.style.left = (r.left + 4) + 'px';
                badge.style.top  = (r.top  + 4) + 'px';
            }
            badge.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                toggleAnchorImage(widget);
            });
            document.body.appendChild(badge);
            _updateBadgePos();
            // Mettre à jour la position quand le board est scrollé/déplacé
            widget._anchorBadgePosUpdate = _updateBadgePos;
            var _rafId = null;
            function _rafUpdate() { _updateBadgePos(); _rafId = requestAnimationFrame(_rafUpdate); }
            _rafId = requestAnimationFrame(_rafUpdate);
            badge._stopRaf = function() { cancelAnimationFrame(_rafId); };
            // Stocker la ref du badge sur le widget pour pouvoir le retrouver
            widget._anchorBadgeEl = badge;
        }
        if (anchorBtn) {
            anchorBtn.title = 'Désancrer';
            anchorBtn.style.color = '#f0a020';
            anchorBtn.style.textShadow = '0 0 6px #f0a020';
        }
    } else {
        // Retirer les blockers
        if (widget._anchorBlocker) {
            widget.removeEventListener('mousedown',   widget._anchorBlocker, true);
            widget.removeEventListener('touchstart',  widget._anchorBlocker, true);
            widget.removeEventListener('pointerdown', widget._anchorBlocker, true);
            widget._anchorBlocker = null;
        }
        if (widget._anchorFocusBlocker) {
            widget.removeEventListener('focus', widget._anchorFocusBlocker, true);
            widget._anchorFocusBlocker = null;
        }
        delete widget.dataset.anchorNoSelect;
        // Restaurer le tabIndex
        if (widget._anchorPrevTabIndex !== undefined) {
            widget.tabIndex = widget._anchorPrevTabIndex;
            delete widget._anchorPrevTabIndex;
        }
        if (widget._anchorObserver) {
            widget._anchorObserver.disconnect();
            widget._anchorObserver = null;
        }
        widget.style.outline = '';
        // Badge dans body (position:fixed) — le retrouver via la ref stockée
        const badge = widget._anchorBadgeEl || document.querySelector('.anchor-badge[data-widget-id="' + (widget.dataset.anchorId||'') + '"]');
        if (badge) {
            if (badge._stopRaf) badge._stopRaf();
            badge.remove();
        }
        widget._anchorBadgeEl = null;
        if (anchorBtn) {
            anchorBtn.title = 'Ancrer (rendre insélectionnable)';
            anchorBtn.style.color = '';
            anchorBtn.style.textShadow = '';
        }
    }
}


// Restaurer l'état ancré après chargement du board
function _restoreAnchoredImages() {
    document.querySelectorAll('.widget[data-anchored="true"]').forEach(w => {
        _applyAnchorState(w, true);
    });
}

// ── Ouverture / fermeture du panneau ─────────────────────────────────────
// Le panneau Images est désormais fusionné dans le panneau "Visuels"
// (#sticker-panel), sous forme de 3e mode aux côtés de Animés/Classiques.
// Ces fonctions restent disponibles pour compatibilité (ex : postMessage
// depuis la page de garde) et pilotent le panneau fusionné.
function toggleImagePanel() {
    const panel = document.getElementById('sticker-panel');
    const section = document.getElementById('sp-images-section');
    const isOpenOnImages = !!(panel && panel.classList.contains('active') && section && section.style.display === 'flex');
    if (isOpenOnImages) {
        if (typeof toggleStickerPanel === 'function') toggleStickerPanel();
        return;
    }
    if (!panel || !panel.classList.contains('active')) {
        if (typeof toggleStickerPanel === 'function') toggleStickerPanel();
    }
    if (typeof setVisuelsMode === 'function') setVisuelsMode('images');
}

function closeImagePanel() {
    // Le panneau Images est fusionné dans le panneau Visuels (#sticker-panel).
    // stickers.js appelle closeImagePanel() à CHAQUE ouverture du panneau Visuels
    // (héritage de l'époque où il existait un panneau images séparé) — si cette
    // fonction fermait le panneau, elle l'ouvrirait puis le refermerait aussitôt.
    // On la garde en no-op uniquement pour compatibilité.
}

// ── Injection CSS menu contextuel image ───────────────────────────────────
(function _injectImgCtxMenuCSS() {
    if (document.getElementById('img-ctx-menu-style')) return;
    const style = document.createElement('style');
    style.id = 'img-ctx-menu-style';
    style.textContent = `
        .img-ctx-menu {
            position: fixed;
            z-index: 99999;
            background: #fff;
            border: 1px solid #d0d0d0;
            border-radius: 8px;
            box-shadow: 0 4px 18px rgba(0,0,0,.18);
            padding: 4px 0;
            min-width: 175px;
            font-size: 13.5px;
            user-select: none;
        }
        .img-ctx-menu-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 7px 14px;
            cursor: pointer;
            color: #222;
            transition: background .12s;
            border-radius: 4px;
            margin: 1px 4px;
        }
        .img-ctx-menu-item:hover {
            background: #f0f4ff;
        }
        .img-ctx-menu-item.danger {
            color: #c0392b;
        }
        .img-ctx-menu-item.danger:hover {
            background: #fff0f0;
        }
        .img-ctx-menu-icon {
            font-size: 15px;
            width: 20px;
            text-align: center;
            flex-shrink: 0;
        }
        .img-ctx-menu-sep {
            height: 1px;
            background: #e8e8e8;
            margin: 4px 10px;
        }
    `;
    document.head.appendChild(style);
})();

// ── Listener contextmenu sur le board ET document, en capture ────────────
function _handleImageWidgetContextMenu(e) {
    const widget = e.target && e.target.closest
        ? e.target.closest('.widget[data-image-widget="true"]')
        : null;
    if (!widget) return;
    if (widget.dataset.anchored === 'true') return;
    if (typeof isDrawMode !== 'undefined' && (isDrawMode || isEraserMode)) return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    const img = widget.querySelector('img');
    _openImgContextMenu(widget, img, e.clientX, e.clientY);
}

// Sur le board en capture (s'exécute avant _boardDrawContextMenu en bubbling)
document.addEventListener('DOMContentLoaded', () => {
    const boardEl = document.getElementById('board');
    if (boardEl) boardEl.addEventListener('contextmenu', _handleImageWidgetContextMenu, true);
});
// Filet de sécurité sur document en capture
document.addEventListener('contextmenu', _handleImageWidgetContextMenu, true);

