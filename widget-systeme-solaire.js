// =========================================================================
// WIDGET LE SYSTÈME SOLAIRE — Le Bureau du Prof
// Deux onglets pour comprendre :
//  🪐 Les orbites : les 8 planètes tournent autour du Soleil, toutes dans
//     le même sens. Plus une planète est loin, plus son orbite est longue
//     et plus elle avance lentement : son année dure plus longtemps.
//     Départ : planètes alignées, puis on compte les tours de chacune.
//     Vue de dessus / en perspective, distances schématiques ou réelles.
//  📏 Les tailles : les planètes (et le Soleil) comparées à l'échelle.
// Une fiche latérale présente l'astre choisi (distance, année, jour,
// diamètre, lunes, température) et un compteur de tours par planète.
//
// Pensé pour le stylet de vidéoprojecteur interactif / TBI : événements
// pointer uniquement, tolérance de tremblement sur les « taps », zones de
// toucher élargies autour des petites planètes, boutons de grande taille,
// rien d'accessible uniquement au survol.
//
// Dépendances : widget-geo-monde.js chargé AVANT ce fichier (style des
//   boutons .wf-btn et window._wfMiniBarCollapse). board, findFreePosition(),
//   makeDraggable(), makeDraggableRotate(), bringToFront(), snapshotNow(),
//   saveBoard()
// =========================================================================

// ── CSS ───────────────────────────────────────────────────────────────────
(function () {
    if (document.getElementById('ss-style')) return;
    const s = document.createElement('style');
    s.id = 'ss-style';
    s.textContent = `
        .widget[data-type="systeme-solaire"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        .ss-container {
            background: #ffffff;
            border: 1.5px solid #d1d5db;
            border-radius: 16px;
            padding: 14px 16px 12px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: 8px;
            font-family: 'Segoe UI', system-ui, sans-serif;
            box-shadow: 0 4px 18px rgba(0,0,0,0.12);
            position: relative;
            user-select: none;
            -webkit-user-select: none;
            overflow: hidden;
        }
        .ss-header { display: flex; align-items: center; gap: 8px; cursor: move; flex-shrink: 0; }
        .ss-title { font-size: 14px; font-weight: 800; color: #374151; pointer-events: none; }
        .ss-header .wf-btns { gap: 8px; }
        .ss-header .wf-btn { width: 18px; height: 18px; }
        .ss-container.wf-fullboard {
            position: fixed !important; inset: 0 !important;
            width: 100% !important; height: 100% !important;
            z-index: 9999 !important; border-radius: 0 !important;
            padding-left: 50px !important;
        }

        /* Onglets */
        .ss-tabs { display: inline-flex; background: #eef1f5; border-radius: 11px; padding: 3px; gap: 3px; }
        .ss-tab {
            min-height: 34px; padding: 4px 14px; border: none; border-radius: 9px;
            background: transparent; color: #4b5563; font-size: 13px; font-weight: 800;
            font-family: inherit; cursor: pointer; touch-action: manipulation;
        }
        .ss-tab.on { background: #fff; color: #1f3b63; box-shadow: 0 1px 4px rgba(0,0,0,.12); }

        .ss-row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; flex-shrink: 0; }
        .ss-btn {
            min-height: 34px; padding: 5px 12px; border-radius: 9px;
            border: 1px solid #d6d9de; background: #f0f0f0; color: #333;
            font-size: 13px; font-weight: 700; font-family: inherit;
            cursor: pointer; touch-action: manipulation; white-space: nowrap;
        }
        .ss-btn:hover { background: #e0e0e0; }
        .ss-btn:active { transform: scale(0.96); }
        .ss-btn.on { background: #4a90e2; color: #fff; border-color: #4a90e2; }
        .ss-btn-play { min-width: 112px; }
        .ss-btn-play.on { background: #e8833a; border-color: #e8833a; }
        .ss-btn-speed { min-width: 120px; }
        .ss-scale-btn, .ss-wholesun { background: #fff4e6; border-color: #f2c48f; color: #8a4a12; }
        .ss-scale-btn.on, .ss-wholesun.on { background: #6fb78f; border-color: #6fb78f; color: #fff; }
        .ss-sep { width: 1px; align-self: stretch; background: #e5e7eb; margin: 2px; }
        .ss-lbl { font-size: 12px; font-weight: 800; color: #6b7280; white-space: nowrap; }
        .ss-astre { display: inline-flex; align-items: center; gap: 6px; padding: 5px 10px; }
        .ss-astre.on { background: #1f3b63; color: #fff; border-color: #1f3b63; }
        .ss-dot {
            width: 12px; height: 12px; border-radius: 50%; display: inline-block; flex-shrink: 0;
            box-shadow: inset -2px -2px 3px rgba(0,0,0,.35);
        }

        /* Corps */
        .ss-body { flex: 1 1 auto; display: flex; gap: 10px; min-height: 0; }
        .ss-scene-wrap {
            flex: 1 1 auto; min-width: 0; position: relative;
            border-radius: 12px; overflow: hidden; background: #0a1322;
        }
        .ss-canvas { display: block; width: 100%; height: 100%; touch-action: none; cursor: pointer; }
        .ss-canvas.ss-dragging { cursor: grabbing; }
        .ss-hint {
            position: absolute; left: 0; right: 0; bottom: 7px; text-align: center;
            font-size: 12px; color: rgba(214,228,244,.55); pointer-events: none; padding: 0 8px;
        }
        .ss-side {
            flex: 0 0 31%; min-width: 230px; max-width: 390px;
            background: #fafafa; border: 1px solid #e5e7eb; border-left: 6px solid #5b7bd5;
            border-radius: 10px; padding: 10px 12px; box-sizing: border-box;
            color: #374151; line-height: 1.4; overflow-y: auto; font-size: 14px;
        }
        .ss-side h4 { margin: 0 0 2px; font-size: 1.2em; font-weight: 900; color: #1f3b63; display: flex; align-items: center; gap: 8px; }
        .ss-side h4 .ss-dot { width: 18px; height: 18px; }
        .ss-status { font-size: .95em; font-weight: 800; margin: 0 0 6px; }
        .ss-side ul { margin: 0 0 6px; padding: 0; list-style: none; }
        .ss-side li { margin-bottom: 3px; }
        .ss-laps-ttl { font-size: .85em; font-weight: 800; color: #6b7280; margin-top: 6px; display: flex; justify-content: space-between; gap: 6px; }
        .ss-laps-ttl b { color: #1f3b63; }
        .ss-laps { margin: 4px 0 8px; }
        .ss-lap {
            display: grid; grid-template-columns: 88px 1fr 34px; align-items: center; gap: 6px;
            font-size: .82em; min-height: 26px; padding: 1px 4px; border-radius: 6px;
            cursor: pointer; touch-action: manipulation;
        }
        .ss-lap.on { background: #e6eefc; font-weight: 800; }
        .ss-lap-name { display: inline-flex; align-items: center; gap: 5px; white-space: nowrap; }
        .ss-lap-name .ss-dot { width: 10px; height: 10px; }
        .ss-lap-bar { height: 9px; background: #e5e7eb; border-radius: 5px; overflow: hidden; }
        .ss-lap-fill { display: block; height: 100%; width: 0; border-radius: 5px; }
        .ss-lap-n { text-align: right; font-weight: 800; font-variant-numeric: tabular-nums; }
        .ss-explain { background: #eef3ff; border-radius: 8px; padding: 7px 9px; color: #22325a; margin: 0; }
        .ss-container[data-mode="tailles"] .ss-explain { background: #fff6ec; color: #5b3a17; }

        /* Aide */
        .ss-help-btn {
            width: 28px; height: 28px; border-radius: 50%; border: 1px solid #bbb; background: #f5f5f5;
            color: #666; font-size: 14px; font-weight: 700; cursor: pointer;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0; touch-action: manipulation;
        }
        .ss-help-popup {
            display: none; position: absolute; top: 46px; right: 12px; background: #fff;
            border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,.15);
            padding: 12px 14px; width: 360px; max-width: calc(100% - 24px);
            font-size: 12px; color: #444; z-index: 10; line-height: 1.5;
        }
        .ss-help-popup.show { display: block; }
        .ss-help-popup h4 { margin: 0 0 8px; font-size: 13px; color: #374151; }
        .ss-help-popup p { margin: 0 0 6px; }

        .ss-resize-handle {
            position: absolute; right: 0; bottom: 0; width: 24px; height: 24px; cursor: se-resize;
            background: linear-gradient(135deg, transparent 55%, #b5bac2 55%);
            border-radius: 0 0 14px 0; opacity: .6; z-index: 5; touch-action: none;
        }
        .ss-resize-handle:hover { opacity: 1; }
        .ss-container[data-mode="tailles"] .ss-only-orbit { display: none !important; }
        .ss-container[data-mode="orbites"] .ss-only-size { display: none !important; }
    `;
    document.head.appendChild(s);
})();

// ── Données ───────────────────────────────────────────────────────────────
// a : demi-grand axe (UA) · P : période de révolution (jours terrestres)
// sch : rayon d'orbite « schématique » (fraction du rayon maximal)
const SS_AMAX = 30.07;
const SS_SUN = {
    id: 'soleil', name: 'Soleil', col: '#ffcc3a', type: '⭐ Une étoile', tcol: '#d97706'
};
const SS_PLANETS = [
    { id: 'mercure', name: 'Mercure', col: '#9c9590', hi: '#d6d0ca', dark: '#4f4a46',
      a: 0.387, P: 87.97, sch: 0.16, dKm: 4879, distM: 58, day: '59 jours terrestres', moons: 'aucune',
      temp: '−180 °C la nuit, 430 °C le jour', kind: 'rock',
      fact: 'La planète la plus proche du Soleil et la plus petite. Elle n\'a presque pas d\'atmosphère : il fait très chaud le jour et très froid la nuit.' },
    { id: 'venus', name: 'Vénus', col: '#e3c37b', hi: '#fbecc4', dark: '#8a6a2d',
      a: 0.723, P: 224.7, sch: 0.24, dKm: 12104, distM: 108, day: '243 jours terrestres (elle tourne à l\'envers)', moons: 'aucune',
      temp: '465 °C', kind: 'rock',
      fact: 'La planète la plus chaude : son atmosphère très épaisse retient la chaleur. Son jour est plus long que son année ! On la voit briller le soir ou le matin : c\'est « l\'étoile du berger », mais ce n\'est pas une étoile.' },
    { id: 'terre', name: 'Terre', col: '#3d7fd6', hi: '#a9d1ff', dark: '#163a74',
      a: 1.0, P: 365.25, sch: 0.32, dKm: 12742, distM: 150, day: '24 heures', moons: '1 (la Lune)',
      temp: '15 °C en moyenne', kind: 'rock',
      fact: 'Notre planète : la seule connue où il y a de la vie et de l\'eau liquide en surface. La Lune tourne autour d\'elle en un peu moins d\'un mois.' },
    { id: 'mars', name: 'Mars', col: '#c8573a', hi: '#f2a184', dark: '#6b2414',
      a: 1.524, P: 687, sch: 0.40, dKm: 6779, distM: 228, day: '24 h 37 min', moons: '2 (Phobos et Déimos)',
      temp: '−63 °C en moyenne', kind: 'rock',
      fact: 'La planète rouge : son sol contient de la rouille. On y trouve le plus haut volcan du système solaire, l\'Olympus Mons. Des robots l\'explorent.' },
    { id: 'jupiter', name: 'Jupiter', col: '#d4a77a', hi: '#f6e2c6', dark: '#7a5232',
      a: 5.203, P: 4332.6, sch: 0.56, dKm: 139820, distM: 778, day: '10 heures', moons: 'plus de 90',
      temp: '−110 °C', kind: 'gas', bands: true,
      fact: 'La plus grosse planète : plus de 1 300 Terres pourraient tenir dedans. C\'est une géante de gaz, sans sol où se poser. Sa Grande Tache rouge est une tempête plus grande que la Terre.' },
    { id: 'saturne', name: 'Saturne', col: '#dcc38d', hi: '#f8ecc9', dark: '#86704a',
      a: 9.537, P: 10759, sch: 0.71, dKm: 116460, distM: 1430, day: '10 h 30 min', moons: 'plus de 140',
      temp: '−140 °C', kind: 'gas', rings: true, bands: true,
      fact: 'Célèbre pour ses anneaux, faits de milliards de morceaux de glace et de roche. C\'est une géante de gaz si légère qu\'elle pourrait flotter sur l\'eau !' },
    { id: 'uranus', name: 'Uranus', col: '#8fd9de', hi: '#d6f6f7', dark: '#3f8a91',
      a: 19.19, P: 30687, sch: 0.85, dKm: 50724, distM: 2870, day: '17 heures', moons: '28',
      temp: '−195 °C', kind: 'ice',
      fact: 'Une géante de glace qui tourne « couchée » sur le côté : son axe est presque horizontal. Elle est trop loin pour être vue à l\'œil nu.' },
    { id: 'neptune', name: 'Neptune', col: '#4a6fe0', hi: '#a9bff8', dark: '#1d3389',
      a: 30.07, P: 60190, sch: 0.97, dKm: 49244, distM: 4500, day: '16 heures', moons: '16',
      temp: '−200 °C', kind: 'ice',
      fact: 'La planète la plus éloignée du Soleil. Il y souffle les vents les plus violents du système solaire. Depuis sa découverte en 1846, elle n\'a fait qu\'un seul tour du Soleil !' }
];
SS_PLANETS.forEach(p => { p.rE = p.dKm / 12742; });
const SS_KIND = {
    rock: { txt: '🪨 Planète rocheuse', col: '#a0522d' },
    gas:  { txt: '☁️ Planète géante de gaz', col: '#b7791f' },
    ice:  { txt: '🧊 Planète géante de glace', col: '#2b7a8c' }
};
const SS_SPEEDS = [
    { dps: 365.25 / 20, lbl: '🐢 Lent',        tip: '1 année terrestre en 20 secondes' },
    { dps: 365.25 / 5,  lbl: '🐇 Rapide',      tip: '1 année terrestre en 5 secondes' },
    { dps: 365.25,      lbl: '🚀 Très rapide', tip: '1 année terrestre en 1 seconde' }
];

const _ssLerp = (a, b, k) => a + (b - a) * k;
const _ssFr = (x, d) => x.toFixed(d).replace('.', ',');
function _ssFmtElapsed(t) {
    const y = Math.floor(t / 365.25);
    const d = Math.floor(t - y * 365.25);
    const ds = d + (d <= 1 ? ' jour' : ' jours');
    if (y === 0) return ds;
    const ys = y === 1 ? '1 an' : y + ' ans';
    return d ? ys + ' et ' + ds : ys;
}
function _ssFmtYear(P) {
    if (Math.abs(P - 365.25) < 1) return '365 jours (1 an)';
    if (P < 730) return Math.round(P) + ' jours terrestres';
    return 'environ ' + _ssFr(P / 365.25, 1) + ' années terrestres';
}
function _ssFmtLight(distM) {
    const s = Math.round(distM * 1e6 / 299792);
    if (s < 3600) {
        const m = Math.floor(s / 60), r = s % 60;
        return m + ' min' + (r ? ' ' + r + ' s' : '');
    }
    const h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60);
    return h + ' h ' + String(m).padStart(2, '0') + ' min';
}
function _ssRand(seed) {
    let x = seed;
    return () => (x = (x * 16807) % 2147483647) / 2147483647;
}

// ── Création du widget ────────────────────────────────────────────────────
function createSystemeSolaireWidget() {
    if (typeof snapshotNow === 'function') snapshotNow();
    const pos = typeof findFreePosition === 'function' ? findFreePosition() : { x: 100, y: 80 };

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'systeme-solaire';
    widget.dataset.transparent = 'true';
    widget.style.cssText = `left:100px; top:${pos.y}px; overflow:visible; flex-direction:row;`;
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
    `;

    const container = document.createElement('div');
    container.className = 'ss-container';
    container.dataset.mode = 'orbites';
    let contW = Math.max(760, Math.min(1180, Math.round(window.innerWidth * 0.68)));
    let contH = Math.max(560, Math.round(contW * 0.66));

    const header = document.createElement('div');
    header.className = 'ss-header';
    header.innerHTML = `
        <span class="ss-title">🪐 Le système solaire</span>
        <div class="ss-tabs">
            <button class="ss-tab on" data-mode="orbites">🌀 Les orbites</button>
            <button class="ss-tab" data-mode="tailles">📏 Les tailles</button>
        </div>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    container.appendChild(header);
    const helpBtn = document.createElement('button');
    helpBtn.className = 'ss-help-btn';
    helpBtn.title = 'Aide';
    helpBtn.textContent = '?';
    const wfBtnsDiv = header.querySelector('.wf-btns');
    wfBtnsDiv.insertBefore(helpBtn, wfBtnsDiv.firstChild);
    widget.appendChild(container);

    // Ligne 1 : animation et options
    const row1 = document.createElement('div');
    row1.className = 'ss-row';
    row1.innerHTML = `
        <button class="ss-btn ss-btn-play ss-only-orbit" title="Lancer / arrêter le mouvement des planètes">▶ Lecture</button>
        <button class="ss-btn ss-btn-speed ss-only-orbit" title="Vitesse de l'animation">🐢 Lent</button>
        <button class="ss-btn ss-btn-reset ss-only-orbit" title="Revenir au départ : toutes les planètes alignées">⏮ Départ</button>
        <span class="ss-sep ss-only-orbit"></span>
        <span class="ss-lbl ss-only-orbit">Vue :</span>
        <button class="ss-btn ss-view ss-only-orbit" data-tilt="1" title="Le système solaire vu du dessus">De dessus</button>
        <button class="ss-btn ss-view ss-only-orbit on" data-tilt="0.42" title="Le système solaire vu de biais">En perspective</button>
        <span class="ss-sep ss-only-orbit"></span>
        <button class="ss-btn ss-scale-btn ss-only-orbit" title="Afficher les vraies distances entre les planètes">📏 Distances réelles</button>
        <button class="ss-btn ss-names ss-only-orbit on" title="Afficher le nom des planètes">🏷️ Noms</button>
        <button class="ss-btn ss-orbits ss-only-orbit on" title="Afficher le chemin des planètes (orbites)">⭕ Orbites</button>
        <button class="ss-btn ss-wholesun ss-only-size" title="Comparer la Terre au Soleil tout entier">☀️ Le Soleil en entier</button>
    `;
    container.appendChild(row1);

    // Ligne 2 : choix de l'astre
    const row2 = document.createElement('div');
    row2.className = 'ss-row';
    row2.innerHTML = `<span class="ss-lbl">Astre :</span>` +
        [SS_SUN].concat(SS_PLANETS).map(b =>
            `<button class="ss-btn ss-astre" data-id="${b.id}" title="${b.name}"><i class="ss-dot" style="background:${b.col}"></i>${b.name}</button>`
        ).join('');
    container.appendChild(row2);

    // Corps
    const body = document.createElement('div');
    body.className = 'ss-body';
    const sceneWrap = document.createElement('div');
    sceneWrap.className = 'ss-scene-wrap';
    const canvas = document.createElement('canvas');
    canvas.className = 'ss-canvas';
    const hint = document.createElement('div');
    hint.className = 'ss-hint';
    sceneWrap.appendChild(canvas);
    sceneWrap.appendChild(hint);
    const side = document.createElement('div');
    side.className = 'ss-side';
    side.innerHTML = `
        <h4 class="ss-side-ttl"></h4>
        <div class="ss-status"></div>
        <ul class="ss-facts"></ul>
        <div class="ss-only-orbit">
            <div class="ss-laps-ttl"><span>Tours complets autour du Soleil</span><span>⏱ <b class="ss-elapsed"></b></span></div>
            <div class="ss-laps"></div>
        </div>
        <p class="ss-explain"></p>
    `;
    body.appendChild(sceneWrap);
    body.appendChild(side);
    container.appendChild(body);

    const helpPopup = document.createElement('div');
    helpPopup.className = 'ss-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 Le système solaire</h4>
        <p><b>🌀 Les orbites</b> : les 8 planètes tournent autour du Soleil, toutes dans le même sens.
        Lance <b>▶ Lecture</b> : au départ, les planètes sont alignées (cela n'arrive jamais vraiment),
        puis chacune avance à sa vitesse. Plus une planète est loin du Soleil, plus son chemin est long
        et plus elle avance lentement : son <b>année</b> dure plus longtemps.</p>
        <p><b>Touche un astre</b> (ou un bouton « Astre ») pour afficher sa fiche.
        <b>Fais glisser une planète</b> le long de son orbite pour avancer ou reculer le temps :
        toutes les autres bougent en même temps. <b>Glisse dans le vide</b> de haut en bas pour incliner la vue.</p>
        <p><b>📏 Distances réelles</b> : montre les vraies distances. Les planètes proches du Soleil sont
        alors serrées contre lui, les géantes très loin. Même ainsi, les planètes restent dessinées beaucoup
        trop grosses : à cette échelle, elles seraient invisibles.</p>
        <p><b>📏 Les tailles</b> : les planètes sont à l'échelle entre elles, à côté du bord du Soleil.
        <b>☀️ Le Soleil en entier</b> le compare à la Terre et à Jupiter.</p>
        <p style="color:#888">Modèle simplifié : orbites circulaires et dans le même plan, positions de
        départ fictives. Les données (distances, durées) sont des valeurs moyennes.</p>
    `;
    container.appendChild(helpPopup);
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'ss-resize-handle';
    resizeHandle.title = 'Redimensionner';
    container.appendChild(resizeHandle);

    const ctx = canvas.getContext('2d');
    const $ = sel => container.querySelector(sel);
    const playBtn = $('.ss-btn-play'), speedBtn = $('.ss-btn-speed'), resetBtn = $('.ss-btn-reset');
    const scaleBtn = $('.ss-scale-btn'), namesBtn = $('.ss-names'), orbitsBtn = $('.ss-orbits');
    const wholeBtn = $('.ss-wholesun');
    const sideTtl = side.querySelector('.ss-side-ttl'), statusEl = side.querySelector('.ss-status');
    const factsEl = side.querySelector('.ss-facts'), explainEl = side.querySelector('.ss-explain');
    const elapsedEl = side.querySelector('.ss-elapsed'), lapsEl = side.querySelector('.ss-laps');

    // Compteurs de tours (créés une seule fois, mis à jour à chaque image)
    const lapRows = SS_PLANETS.map(p => {
        const row = document.createElement('div');
        row.className = 'ss-lap';
        row.dataset.id = p.id;
        row.title = 'Voir ' + p.name;
        row.innerHTML = `<span class="ss-lap-name"><i class="ss-dot" style="background:${p.col}"></i>${p.name}</span>` +
            `<span class="ss-lap-bar"><span class="ss-lap-fill" style="background:${p.col}"></span></span>` +
            `<span class="ss-lap-n">0</span>`;
        lapsEl.appendChild(row);
        return { p, row, fill: row.querySelector('.ss-lap-fill'), n: row.querySelector('.ss-lap-n') };
    });

    // Étoiles et ceinture d'astéroïdes (identiques à chaque image)
    const rnd = _ssRand(4242);
    const STARS = [];
    for (let i = 0; i < 180; i++) STARS.push([rnd(), rnd(), 0.3 + rnd() * 0.9, 0.2 + rnd() * 0.6]);
    const BELT = [];
    for (let i = 0; i < 240; i++) {
        const f = rnd(), a = 2.2 + 1.1 * f;
        BELT.push({ sch: 0.465 + 0.07 * f + (rnd() - 0.5) * 0.012, a, P: 365.25 * Math.pow(a, 1.5), ph: rnd() * 2 * Math.PI, s: 0.8 + rnd() * 1.1 });
    }

    // ── État ──────────────────────────────────────────────────────────────
    let mode = 'orbites';
    let t = 0;                        // temps écoulé depuis le départ (jours)
    let speed = 0;
    let tilt = 0.42;                  // 1 = vue de dessus
    let tiltAnim = null;
    let scaleK = 0, scaleTarget = 0;  // 0 = distances schématiques, 1 = réelles
    let showNames = true, showOrbits = true;
    let wholeSun = false;
    let sel = 'terre';
    let playing = false;
    let animId = null, lastT = 0, drawPending = false;
    let cssW = 0, cssH = 0, dpr = 1;
    let hits = [];                    // zones touchables de la scène
    let orbGeo = null;                // géométrie des orbites (dernière image)

    const bodyById = id => id === 'soleil' ? SS_SUN : SS_PLANETS.find(p => p.id === id);

    function syncSize() {
        const W = sceneWrap.clientWidth, H = sceneWrap.clientHeight;
        if (W <= 0 || H <= 0) return false;
        const r = Math.min(window.devicePixelRatio || 1, 3);
        cssW = W; cssH = H; dpr = r;
        const pw = Math.round(W * r), ph = Math.round(H * r);
        if (canvas.width !== pw || canvas.height !== ph) { canvas.width = pw; canvas.height = ph; }
        return true;
    }

    // ── Dessins de base ───────────────────────────────────────────────────
    function drawSky() {
        const g = ctx.createRadialGradient(cssW * 0.5, cssH * 0.45, 10, cssW * 0.5, cssH * 0.5, Math.max(cssW, cssH) * 0.8);
        g.addColorStop(0, '#16263d'); g.addColorStop(1, '#060c17');
        ctx.fillStyle = g; ctx.fillRect(0, 0, cssW, cssH);
        ctx.fillStyle = '#ffffff';
        for (const [x, y, s, a] of STARS) {
            ctx.globalAlpha = a;
            ctx.fillRect(x * cssW, y * cssH, s, s);
        }
        ctx.globalAlpha = 1;
    }

    function drawSunBody(x, y, r, glow) {
        const gr = r * (glow || 2.6);
        const g = ctx.createRadialGradient(x, y, r * 0.3, x, y, gr);
        g.addColorStop(0, 'rgba(255,214,102,0.9)');
        g.addColorStop(0.35, 'rgba(255,170,60,0.35)');
        g.addColorStop(1, 'rgba(255,150,40,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, gr, 0, 2 * Math.PI); ctx.fill();
        const c = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
        c.addColorStop(0, '#fff6c8'); c.addColorStop(0.6, '#ffd24a'); c.addColorStop(1, '#f5a623');
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fill();
    }

    function ringHalf(x, y, r, rt, back) {
        const a0 = back ? Math.PI : 0, a1 = back ? 2 * Math.PI : Math.PI;
        ctx.beginPath();
        ctx.ellipse(x, y, r * 1.75, r * 1.75 * rt, -0.15, a0, a1);
        ctx.strokeStyle = 'rgba(226,206,160,0.85)';
        ctx.lineWidth = Math.max(1.2, r * 0.32);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(x, y, r * 1.38, r * 1.38 * rt, -0.15, a0, a1);
        ctx.strokeStyle = 'rgba(170,150,110,0.75)';
        ctx.lineWidth = Math.max(1, r * 0.14);
        ctx.stroke();
    }

    // Planète éclairée par le Soleil ; (ux, uy) : direction du Soleil
    function drawPlanet(x, y, r, p, ux, uy, rt) {
        if (p.rings) ringHalf(x, y, r, rt, true);
        const g = ctx.createRadialGradient(x + ux * r * 0.35, y + uy * r * 0.35, r * 0.1, x, y, r * 1.05);
        g.addColorStop(0, p.hi); g.addColorStop(0.55, p.col); g.addColorStop(1, p.dark);
        ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fillStyle = g; ctx.fill();
        if (r > 5 && (p.bands || p.id === 'terre')) {
            ctx.save();
            ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.clip();
            if (p.id === 'terre') {
                ctx.fillStyle = 'rgba(80,160,80,0.75)';
                ctx.beginPath(); ctx.ellipse(x - r * 0.25, y - r * 0.2, r * 0.32, r * 0.42, 0.4, 0, 2 * Math.PI); ctx.fill();
                ctx.beginPath(); ctx.ellipse(x + r * 0.4, y + r * 0.25, r * 0.22, r * 0.3, -0.3, 0, 2 * Math.PI); ctx.fill();
                ctx.fillStyle = 'rgba(255,255,255,0.75)';
                ctx.beginPath(); ctx.ellipse(x, y - r * 0.92, r * 0.5, r * 0.16, 0, 0, 2 * Math.PI); ctx.fill();
            } else {
                const bands = p.id === 'jupiter'
                    ? [[-0.6, 0.12, 'rgba(150,100,60,.45)'], [-0.28, 0.18, 'rgba(170,110,70,.5)'], [0.08, 0.14, 'rgba(150,95,60,.45)'], [0.42, 0.1, 'rgba(170,120,80,.4)']]
                    : [[-0.45, 0.14, 'rgba(170,140,90,.3)'], [0.0, 0.12, 'rgba(170,140,90,.28)'], [0.4, 0.1, 'rgba(170,140,90,.25)']];
                for (const [yf, hf, c] of bands) { ctx.fillStyle = c; ctx.fillRect(x - r, y + yf * r, 2 * r, hf * r); }
                if (p.id === 'jupiter') {
                    ctx.fillStyle = 'rgba(190,80,50,0.75)';
                    ctx.beginPath(); ctx.ellipse(x + r * 0.3, y + r * 0.3, r * 0.17, r * 0.1, 0, 0, 2 * Math.PI); ctx.fill();
                }
            }
            ctx.restore();
        }
        // côté nuit
        const sg = ctx.createLinearGradient(x + ux * r, y + uy * r, x - ux * r, y - uy * r);
        sg.addColorStop(0, 'rgba(4,8,20,0)');
        sg.addColorStop(0.42, 'rgba(4,8,20,0)');
        sg.addColorStop(0.62, 'rgba(4,8,20,0.5)');
        sg.addColorStop(1, 'rgba(4,8,20,0.8)');
        ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fillStyle = sg; ctx.fill();
        if (p.rings) ringHalf(x, y, r, rt, false);
    }
    const MOON = { id: 'lune', col: '#bdbdbd', hi: '#f2f2f2', dark: '#555555' };

    function label(txt, x, y, fs, on) {
        ctx.font = `800 ${fs}px 'Segoe UI', system-ui, sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = 3.5; ctx.lineJoin = 'round';
        ctx.strokeStyle = 'rgba(6,12,23,0.9)';
        ctx.strokeText(txt, x, y);
        ctx.fillStyle = on ? '#ffd24a' : 'rgba(235,242,252,0.95)';
        ctx.fillText(txt, x, y);
    }
    function highlight(x, y, r) {
        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.stroke();
        ctx.setLineDash([]);
    }
    function hud(txt, x, y, align, fs, col) {
        ctx.font = `800 ${fs}px 'Segoe UI', system-ui, sans-serif`;
        ctx.textBaseline = 'middle';
        const w = ctx.measureText(txt).width;
        const bx = align === 'right' ? x - w - 20 : x;
        ctx.fillStyle = 'rgba(10,19,34,0.72)';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(bx, y, w + 20, fs * 2, 9); else ctx.rect(bx, y, w + 20, fs * 2);
        ctx.fill();
        ctx.textAlign = 'left';
        ctx.fillStyle = col;
        ctx.fillText(txt, bx + 10, y + fs);
    }

    // ── Scène « Les orbites » ─────────────────────────────────────────────
    function orbitLayout() {
        const tl = tilt;
        const Rmax = Math.max(80, Math.min(cssW / 2 - 30, (cssH / 2 - 34) / tl));
        const e = scaleK * scaleK * (3 - 2 * scaleK);
        return { Rmax, cx: cssW / 2, cy: cssH / 2 + 4, tl, e };
    }
    const orbitR = (p, L) => _ssLerp(p.sch, p.a / SS_AMAX, L.e) * L.Rmax;
    function planetSize(p, L) {
        const s = L.Rmax * (0.011 + 0.014 * Math.sqrt(p.rE));
        return Math.max(2.2, _ssLerp(Math.max(3.5, s), Math.max(2.2, s * 0.45), L.e));
    }
    function orbitArrows(L, R) {
        ctx.fillStyle = 'rgba(255,214,102,0.85)';
        for (let k = 0; k < 4; k++) {
            const th = k * Math.PI / 2 + Math.PI / 4;
            const x = L.cx + R * Math.cos(th), y = L.cy - R * Math.sin(th) * L.tl;
            let tx = -Math.sin(th), ty = -Math.cos(th) * L.tl;
            const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
            ctx.beginPath();
            ctx.moveTo(x + tx * 8, y + ty * 8);
            ctx.lineTo(x - tx * 5 - ty * 5, y - ty * 5 + tx * 5);
            ctx.lineTo(x - tx * 5 + ty * 5, y - ty * 5 - tx * 5);
            ctx.closePath(); ctx.fill();
        }
    }

    function drawOrbitScene() {
        const L = orbitLayout();
        orbGeo = L;
        const sunR = _ssLerp(0.085 * L.Rmax, 4, L.e);
        const rt = 0.22 + 0.25 * L.tl;          // aplatissement des anneaux de Saturne
        const persp = L.tl < 0.97;

        // Orbites
        if (showOrbits) {
            for (const p of SS_PLANETS) {
                const R = orbitR(p, L), on = p.id === sel;
                ctx.beginPath(); ctx.ellipse(L.cx, L.cy, R, R * L.tl, 0, 0, 2 * Math.PI);
                ctx.strokeStyle = on ? 'rgba(255,214,102,0.85)' : 'rgba(200,215,240,0.28)';
                ctx.lineWidth = on ? 2.2 : 1.2;
                ctx.stroke();
                if (on) orbitArrows(L, R);
            }
        }
        // Ceinture d'astéroïdes (entre Mars et Jupiter)
        ctx.fillStyle = 'rgba(200,190,170,0.55)';
        for (const b of BELT) {
            const R = _ssLerp(b.sch, b.a / SS_AMAX, L.e) * L.Rmax, th = b.ph + 2 * Math.PI * t / b.P;
            ctx.fillRect(L.cx + R * Math.cos(th) - b.s / 2, L.cy - R * Math.sin(th) * L.tl - b.s / 2, b.s, b.s);
        }

        // Planètes, triées de la plus lointaine à la plus proche en perspective
        const items = SS_PLANETS.map(p => {
            const R = orbitR(p, L), th = 2 * Math.PI * t / p.P;
            return { p, th, x: L.cx + R * Math.cos(th), y: L.cy - R * Math.sin(th) * L.tl, r: planetSize(p, L), z: Math.sin(th) };
        });
        if (persp) items.sort((a, b) => b.z - a.z);
        let sunDone = false;
        const doSun = () => { if (!sunDone) { drawSunBody(L.cx, L.cy, sunR); sunDone = true; } };
        if (!persp) doSun();
        for (const it of items) {
            if (persp && it.z <= 0) doSun();
            const dx = L.cx - it.x, dy = L.cy - it.y, dl = Math.hypot(dx, dy) || 1;
            let moon = null;
            if (it.p.id === 'terre' && L.e < 0.5) {
                const ph = 2 * Math.PI * t / 27.32, mr = it.r * 2.3 + 5;
                moon = { x: it.x + mr * Math.cos(ph), y: it.y - mr * Math.sin(ph) * L.tl, r: Math.max(1.8, it.r * 0.3), back: persp && Math.sin(ph) > 0 };
            }
            const drawMoon = () => { ctx.globalAlpha = 1 - 2 * L.e; drawPlanet(moon.x, moon.y, moon.r, MOON, dx / dl, dy / dl, rt); ctx.globalAlpha = 1; };
            if (moon && moon.back) drawMoon();
            drawPlanet(it.x, it.y, it.r, it.p, dx / dl, dy / dl, rt);
            if (moon && !moon.back) drawMoon();
            const vr = it.r * (it.p.rings ? 1.8 : 1);
            if (it.p.id === sel) highlight(it.x, it.y, vr + 6);
            hits.push({ id: it.p.id, x: it.x, y: it.y, r: Math.max(22, vr + 8) });
            it.vr = vr;
        }
        doSun();
        if (sel === 'soleil') highlight(L.cx, L.cy, sunR + 7);
        hits.push({ id: 'soleil', x: L.cx, y: L.cy, r: Math.max(22, sunR + 6) });

        // Noms
        const fs = Math.max(11, Math.min(15, L.Rmax / 24));
        if (showNames) {
            for (const it of items) label(it.p.name, it.x, it.y + Math.max(it.r, it.vr * rt) + fs * 0.95, fs, it.p.id === sel);
            if (L.e < 0.5) label('Soleil', L.cx, L.cy + sunR + fs * 0.9, fs, sel === 'soleil');
        }

        // Temps écoulé et échelle
        const fh = Math.max(12, Math.min(15, cssW / 60));
        hud('⏱ ' + _ssFmtElapsed(t), 8, 8, 'left', fh, '#ffd9a8');
        ctx.font = `700 ${fh * 0.85}px 'Segoe UI', system-ui, sans-serif`;
        ctx.textAlign = 'right'; ctx.textBaseline = 'top';
        ctx.fillStyle = 'rgba(214,228,244,0.75)';
        ctx.fillText(L.e > 0.5 ? 'Distances à l\'échelle' : 'Distances pas à l\'échelle', cssW - 12, 10);
        ctx.fillText('Planètes dessinées plus grosses', cssW - 12, 10 + fh * 1.15);
    }

    // ── Scène « Les tailles » ─────────────────────────────────────────────
    function drawSizeScene() {
        const fsN = Math.max(12, Math.min(16, cssW / 55));
        if (wholeSun) {
            const Rs = Math.min(cssH * 0.38, cssW * 0.28);
            const sx = cssW * 0.34, sy = cssH * 0.5;
            drawSunBody(sx, sy, Rs, 1.18);
            hits.push({ id: 'soleil', x: sx, y: sy, r: Rs });
            const zone = cssW - (sx + Rs * 1.18);
            const show = [['terre', 0.3], ['jupiter', 0.7]];
            for (const [id, f] of show) {
                const p = bodyById(id);
                const x = sx + Rs * 1.18 + zone * f, r = Math.max(1.3, Rs * p.rE / 109.2);
                drawPlanet(x, sy, r, p, -1, 0, 0.3);
                highlight(x, sy, r + 9);
                label(p.name, x, sy - r - 9 - fsN, fsN, sel === id);
                hits.push({ id, x, y: sy, r: Math.max(24, r + 10) });
                if (sel === id) highlight(x, sy, r + 14);
            }
            label('Soleil', sx, sy, fsN * 1.2, sel === 'soleil');
            ctx.font = `700 ${fsN * 0.95}px 'Segoe UI', system-ui, sans-serif`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
            ctx.fillStyle = 'rgba(255,224,140,0.95)';
            ctx.fillText('Le Soleil est 109 fois plus large que la Terre :', cssW / 2, cssH - 44);
            ctx.fillText('environ 1,3 million de Terres pourraient tenir à l\'intérieur !', cssW / 2, cssH - 44 + fsN * 1.3);
            return;
        }

        // Rangée des 8 planètes à l'échelle, à côté du bord du Soleil
        ctx.font = `800 ${fsN}px 'Segoe UI', system-ui, sans-serif`;
        const lw = SS_PLANETS.map(p => ctx.measureText(p.name).width + 10);
        const ringF = p => p.rings ? 1.8 : 1;
        const sunVis = cssW * 0.07, left = 10 + sunVis, availW = cssW - left - 12;
        const gapE = 0.5;
        const widthFor = k => SS_PLANETS.reduce((s, p, i) => s + Math.max(2 * p.rE * ringF(p) * k, lw[i]), 0) + 8 * (gapE * k + 4);
        let lo = 0.05, hi = 400;
        for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (widthFor(m) <= availW) lo = m; else hi = m; }
        const k = Math.min(lo, (cssH * 0.5) / (2 * 11.21));
        const cy = cssH * 0.45;
        const Rsun = 109.2 * k;
        drawSunBody(left - Rsun, cy, Rsun, 1.06);
        hits.push({ id: 'soleil', rect: [0, 0, left, cssH] });
        if (sel === 'soleil') {
            ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = 3; ctx.setLineDash([6, 5]);
            ctx.beginPath(); ctx.arc(left - Rsun, cy, Rsun + 5, -0.6, 0.6); ctx.stroke(); ctx.setLineDash([]);
        }
        ctx.save();
        ctx.translate(left - sunVis * 0.45, cy);
        ctx.rotate(-Math.PI / 2);
        ctx.font = `900 ${fsN}px 'Segoe UI', system-ui, sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(120,60,0,0.9)';
        ctx.fillText('Le bord du Soleil', 0, 0);
        ctx.restore();

        const yName = cy + 11.21 * k + fsN * 1.4;
        let x = left + gapE * k + 4;
        SS_PLANETS.forEach((p, i) => {
            const slot = Math.max(2 * p.rE * ringF(p) * k, lw[i]);
            const px = x + slot / 2, r = Math.max(1.2, p.rE * k);
            drawPlanet(px, cy, r, p, -1, 0, 0.3);
            if (r < 4) highlight(px, cy, r + 6);
            if (p.id === sel) highlight(px, cy, r * ringF(p) + 8);
            label(p.name, px, yName, fsN, p.id === sel);
            ctx.font = `600 ${fsN * 0.78}px 'Segoe UI', system-ui, sans-serif`;
            ctx.fillStyle = 'rgba(200,215,240,0.75)';
            ctx.fillText(p.dKm.toLocaleString('fr-FR') + ' km', px, yName + fsN * 1.15);
            hits.push({ id: p.id, x: px, y: cy, r: Math.max(24, r * ringF(p) + 8) });
            x += slot + gapE * k + 4;
        });
        const fh = Math.max(12, Math.min(15, cssW / 60));
        ctx.font = `700 ${fh * 0.85}px 'Segoe UI', system-ui, sans-serif`;
        ctx.textAlign = 'right'; ctx.textBaseline = 'top';
        ctx.fillStyle = 'rgba(214,228,244,0.75)';
        ctx.fillText('Tailles à l\'échelle', cssW - 12, 10);
        ctx.fillText('(les distances ne le sont pas)', cssW - 12, 10 + fh * 1.15);
    }

    // ── Dessin principal ──────────────────────────────────────────────────
    function draw() {
        if (!syncSize()) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, cssW, cssH);
        ctx.lineCap = 'round';
        drawSky();
        hits = [];
        if (mode === 'orbites') drawOrbitScene(); else drawSizeScene();
        updateInfo();
    }

    // ── Fiche latérale ────────────────────────────────────────────────────
    let lastInfoKey = '';
    function updateInfo() {
        for (const lr of lapRows) {
            const n = t / lr.p.P;
            lr.fill.style.width = ((n % 1) * 100).toFixed(1) + '%';
            const c = String(Math.floor(n));
            if (lr.n.textContent !== c) lr.n.textContent = c;
        }
        const el = _ssFmtElapsed(t);
        if (elapsedEl.textContent !== el) elapsedEl.textContent = el;

        const key = [mode, sel, scaleTarget, wholeSun].join('|');
        if (key === lastInfoKey) return;
        lastInfoKey = key;

        row2.querySelectorAll('.ss-astre').forEach(b => b.classList.toggle('on', b.dataset.id === sel));
        lapRows.forEach(lr => lr.row.classList.toggle('on', lr.p.id === sel));
        const b = bodyById(sel);
        sideTtl.innerHTML = `<i class="ss-dot" style="background:${b.col}"></i>${sel === 'soleil' ? 'Le Soleil' : b.name}`;

        if (sel === 'soleil') {
            statusEl.innerHTML = `<span style="color:${SS_SUN.tcol}">${SS_SUN.type}</span>`;
            factsEl.innerHTML = [
                '<li><b>Place :</b> au centre du système solaire</li>',
                '<li><b>Diamètre :</b> 1 392 700 km (109 × la Terre)</li>',
                '<li><b>Température en surface :</b> 5 500 °C</li>',
                '<li><b>Âge :</b> environ 4,6 milliards d\'années</li>',
                '<li><b>Lumière jusqu\'à la Terre :</b> 8 min 20 s</li>'
            ].join('');
            explainEl.innerHTML = 'Le Soleil est une <b>étoile</b> : une immense boule de gaz très chaud qui produit sa propre lumière. ' +
                'Les planètes, elles, ne font que <b>renvoyer</b> la lumière du Soleil. ' +
                'Le Soleil est si lourd que sa force d\'attraction (la <b>gravité</b>) retient les planètes qui tournent autour de lui.';
            return;
        }

        const kd = SS_KIND[b.kind];
        statusEl.innerHTML = `<span style="color:${kd.col}">${kd.txt}</span> · ${SS_PLANETS.indexOf(b) + 1}<sup>e</sup> planète`;
        const ratio = b.rE;
        const ratioTxt = Math.abs(ratio - 1) < 0.01 ? 'la référence' : _ssFr(ratio, ratio < 2 ? 2 : 1) + ' × la Terre';
        factsEl.innerHTML = [
            `<li><b>Distance au Soleil :</b> ${b.distM.toLocaleString('fr-FR')} millions de km${b.distM >= 1000 ? ' (' + _ssFr(b.distM / 1000, 1) + ' milliards)' : ''}</li>`,
            `<li><b>Lumière du Soleil :</b> ${_ssFmtLight(b.distM)} pour arriver</li>`,
            `<li><b>Une année</b> (un tour du Soleil) : ${_ssFmtYear(b.P)}</li>`,
            `<li><b>Un jour</b> (un tour sur elle-même) : ${b.day}</li>`,
            `<li><b>Diamètre :</b> ${b.dKm.toLocaleString('fr-FR')} km (${ratioTxt})</li>`,
            `<li><b>Lunes :</b> ${b.moons}</li>`,
            `<li><b>Température :</b> ${b.temp}</li>`
        ].join('');

        if (mode === 'tailles') {
            let cmp;
            if (b.id === 'terre') cmp = 'La Terre sert de référence pour comparer les tailles.';
            else if (ratio >= 1.5) cmp = `${b.name} est environ <b>${Math.round(ratio)} fois plus large</b> que la Terre.`;
            else if (ratio > 0.9) cmp = `${b.name} a presque <b>la même taille</b> que la Terre.`;
            else cmp = `${b.name} est environ <b>${Math.round(1 / ratio)} fois moins large</b> que la Terre.`;
            explainEl.innerHTML = cmp + '<br><br>Les quatre planètes proches du Soleil sont <b>petites et rocheuses</b>. ' +
                'Les quatre plus lointaines sont des <b>géantes</b> de gaz ou de glace. Mais même Jupiter, la plus grosse, ' +
                'est bien plus petite que le Soleil.';
        } else {
            explainEl.innerHTML = `${b.fact}<br><br>Plus une planète est loin du Soleil, plus le chemin de son orbite est long ` +
                `et plus elle avance lentement : une <b>année</b> sur ${b.name} dure ${_ssFmtYear(b.P)}.` +
                (scaleTarget ? '<br><i>Avec les vraies distances, les planètes rocheuses sont serrées tout près du Soleil, ' +
                    'et les géantes sont très loin.</i>' : '');
        }
    }

    // ── Boucle d'animation ────────────────────────────────────────────────
    function requestDraw() {
        if (drawPending || animId) return;
        drawPending = true;
        requestAnimationFrame(() => { drawPending = false; draw(); });
    }
    function loop(ts) {
        if (!document.body.contains(widget)) { animId = null; return; }
        const dt = lastT ? Math.min(0.05, (ts - lastT) / 1000) : 1 / 60;
        lastT = ts;
        if (playing && mode === 'orbites') t += SS_SPEEDS[speed].dps * dt;
        if (scaleK !== scaleTarget) {
            const s = Math.sign(scaleTarget - scaleK);
            scaleK += s * dt / 0.9;
            if ((s > 0 && scaleK >= scaleTarget) || (s < 0 && scaleK <= scaleTarget)) scaleK = scaleTarget;
        }
        if (tiltAnim) {
            const k = Math.min(1, (ts - tiltAnim.t0) / 700);
            const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
            tilt = tiltAnim.from + (tiltAnim.to - tiltAnim.from) * e;
            if (k >= 1) { tiltAnim = null; syncViewBtns(); }
        }
        draw();
        if (playing || scaleK !== scaleTarget || tiltAnim) animId = requestAnimationFrame(loop);
        else { animId = null; lastT = 0; }
    }
    function startLoop() { if (animId) return; lastT = 0; animId = requestAnimationFrame(loop); }

    function setPlaying(v) {
        playing = !!v && mode === 'orbites';
        playBtn.classList.toggle('on', playing);
        playBtn.textContent = playing ? '⏸ Pause' : '▶ Lecture';
        if (playing) startLoop();
    }
    function setSpeed(v) {
        speed = ((v % 3) + 3) % 3;
        speedBtn.textContent = SS_SPEEDS[speed].lbl;
        speedBtn.title = 'Vitesse : ' + SS_SPEEDS[speed].tip;
        speedBtn.classList.toggle('on', speed > 0);
    }
    function syncViewBtns() {
        row1.querySelectorAll('.ss-view').forEach(b => b.classList.toggle('on', Math.abs(Number(b.dataset.tilt) - tilt) < 0.03));
    }
    function setScale(v, instant) {
        scaleTarget = v ? 1 : 0;
        if (instant) scaleK = scaleTarget;
        scaleBtn.classList.toggle('on', !!scaleTarget);
        lastInfoKey = '';
        startLoop();
    }
    function setMode(m) {
        mode = m === 'tailles' ? 'tailles' : 'orbites';
        container.dataset.mode = mode;
        header.querySelectorAll('.ss-tab').forEach(b => b.classList.toggle('on', b.dataset.mode === mode));
        if (mode !== 'orbites' && playing) setPlaying(false);
        side.style.borderLeftColor = mode === 'orbites' ? '#5b7bd5' : '#e8833a';
        hint.textContent = mode === 'orbites'
            ? 'Touche un astre pour le découvrir · Fais glisser une planète sur son orbite pour faire passer le temps · Glisse dans le vide pour incliner la vue'
            : 'Touche une planète pour la découvrir · Ici, les tailles sont à l\'échelle';
        lastInfoKey = '';
        requestDraw();
    }
    function select(id) {
        if (!bodyById(id)) return;
        sel = id;
        lastInfoKey = '';
        requestDraw();
    }

    // ── Interaction sur la scène (souris, doigt, stylet) ──────────────────
    const TAP_TOL = 20;
    let drag = null;
    const stop = e => e.stopPropagation();
    canvas.addEventListener('mousedown', stop);
    canvas.addEventListener('touchstart', stop, { passive: true });
    canvas.addEventListener('click', stop);
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    function local(e) {
        const rc = canvas.getBoundingClientRect();
        const kx = rc.width ? cssW / rc.width : 1, ky = rc.height ? cssH / rc.height : 1;
        return { x: (e.clientX - rc.left) * kx, y: (e.clientY - rc.top) * ky, kx, ky };
    }
    // Astre le plus proche sous le stylet (les planètes passent avant le Soleil)
    function hitAt(x, y) {
        let best = null, bd = Infinity;
        for (const h of hits) {
            if (h.id === 'soleil') continue;
            const d = Math.hypot(x - h.x, y - h.y);
            if (d < h.r && d < bd) { bd = d; best = h; }
        }
        if (best) return best;
        for (const h of hits) {
            if (h.id !== 'soleil') continue;
            if (h.rect) { if (x >= h.rect[0] && x <= h.rect[0] + h.rect[2] && y >= h.rect[1] && y <= h.rect[1] + h.rect[3]) return h; }
            else if (Math.hypot(x - h.x, y - h.y) < h.r) return h;
        }
        return null;
    }
    const angAt = (x, y) => Math.atan2((orbGeo.cy - y) / orbGeo.tl, x - orbGeo.cx);

    canvas.addEventListener('pointerdown', e => {
        if (e.button !== undefined && e.button > 0) return;
        if (drag) return;
        e.stopPropagation(); e.preventDefault();
        if (typeof bringToFront === 'function') bringToFront(widget);
        helpPopup.classList.remove('show');
        try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
        const L = local(e);
        drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, lx: e.clientX, ly: e.clientY, moved: false };
        if (mode === 'orbites' && orbGeo) {
            const h = hitAt(L.x, L.y);
            if (h && h.id !== 'soleil') {
                drag.planet = bodyById(h.id);
                drag.lastAng = angAt(L.x, L.y);
            }
        }
        canvas.classList.add('ss-dragging');
        window.addEventListener('pointerup', onEnd, true);
        window.addEventListener('pointercancel', onEnd, true);
    });

    canvas.addEventListener('pointermove', e => {
        if (!drag || drag.id !== e.pointerId) return;
        if (e.pointerType === 'mouse' && e.buttons === 0) { onEnd(e); return; }
        if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > TAP_TOL) {
            drag.moved = true;
            if (drag.planet) {
                if (playing) setPlaying(false);
                if (sel !== drag.planet.id) select(drag.planet.id);
            }
        }
        const L = local(e);
        if (drag.moved && mode === 'orbites' && orbGeo) {
            if (drag.planet) {
                // La planète suit le stylet sur son orbite : le temps avance ou recule
                const a = angAt(L.x, L.y);
                let da = a - drag.lastAng;
                da = Math.atan2(Math.sin(da), Math.cos(da));
                drag.lastAng = a;
                t = Math.max(0, t + da / (2 * Math.PI) * drag.planet.P);
            } else {
                // Glisser dans le vide : incliner la vue
                tiltAnim = null;
                tilt = Math.max(0.25, Math.min(1, tilt + (e.clientY - drag.ly) * L.ky / (cssH * 0.9)));
                syncViewBtns();
            }
            requestDraw();
        }
        drag.lx = e.clientX; drag.ly = e.clientY;
    });

    function onEnd(e) {
        if (!drag || drag.id !== e.pointerId) return;
        const d = drag;
        drag = null;
        window.removeEventListener('pointerup', onEnd, true);
        window.removeEventListener('pointercancel', onEnd, true);
        try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
        canvas.classList.remove('ss-dragging');
        if (e.type === 'pointercancel') return;
        if (!d.moved) {
            const L = local(e);
            const h = hitAt(L.x, L.y);
            if (h) { select(h.id); if (typeof saveBoard === 'function') saveBoard(); }
            return;
        }
        if (typeof saveBoard === 'function') saveBoard();
    }

    // ── Contrôles ─────────────────────────────────────────────────────────
    [row1, row2, header].forEach(el => {
        el.addEventListener('pointerdown', e => { if (e.target.closest('button,input,select')) e.stopPropagation(); });
        el.addEventListener('mousedown', e => { if (e.target.closest('button,input,select')) e.stopPropagation(); });
        el.addEventListener('touchstart', e => { if (e.target.closest('button,input,select')) e.stopPropagation(); }, { passive: true });
    });
    side.addEventListener('pointerdown', stop);
    side.addEventListener('mousedown', stop);
    side.addEventListener('touchstart', stop, { passive: true });

    header.querySelectorAll('.ss-tab').forEach(b => b.addEventListener('click', e => {
        e.stopPropagation();
        setMode(b.dataset.mode);
        if (typeof saveBoard === 'function') saveBoard();
    }));
    playBtn.addEventListener('click', () => setPlaying(!playing));
    speedBtn.addEventListener('click', () => { setSpeed(speed + 1); if (typeof saveBoard === 'function') saveBoard(); });
    resetBtn.addEventListener('click', () => { t = 0; requestDraw(); if (typeof saveBoard === 'function') saveBoard(); });
    row1.querySelectorAll('.ss-view').forEach(b => b.addEventListener('click', () => {
        tiltAnim = { from: tilt, to: Number(b.dataset.tilt), t0: performance.now() };
        row1.querySelectorAll('.ss-view').forEach(x => x.classList.toggle('on', x === b));
        startLoop();
        if (typeof saveBoard === 'function') saveBoard();
    }));
    scaleBtn.addEventListener('click', () => { setScale(!scaleTarget); if (typeof saveBoard === 'function') saveBoard(); });
    namesBtn.addEventListener('click', () => { showNames = !showNames; namesBtn.classList.toggle('on', showNames); requestDraw(); if (typeof saveBoard === 'function') saveBoard(); });
    orbitsBtn.addEventListener('click', () => { showOrbits = !showOrbits; orbitsBtn.classList.toggle('on', showOrbits); requestDraw(); if (typeof saveBoard === 'function') saveBoard(); });
    wholeBtn.addEventListener('click', () => {
        wholeSun = !wholeSun;
        wholeBtn.classList.toggle('on', wholeSun);
        lastInfoKey = '';
        requestDraw();
        if (typeof saveBoard === 'function') saveBoard();
    });
    row2.querySelectorAll('.ss-astre').forEach(b => b.addEventListener('click', () => {
        select(b.dataset.id);
        if (typeof saveBoard === 'function') saveBoard();
    }));
    lapRows.forEach(lr => lr.row.addEventListener('click', () => {
        select(lr.p.id);
        if (typeof saveBoard === 'function') saveBoard();
    }));

    helpBtn.addEventListener('pointerdown', stop);
    helpBtn.addEventListener('click', e => { e.stopPropagation(); helpPopup.classList.toggle('show'); });
    helpPopup.addEventListener('pointerdown', stop);
    helpPopup.addEventListener('click', e => { e.stopPropagation(); helpPopup.classList.remove('show'); });
    const closeHelp = () => helpPopup.classList.remove('show');
    document.addEventListener('click', closeHelp);

    // ── Taille ────────────────────────────────────────────────────────────
    function applySize() {
        container.style.width = contW + 'px';
        container.style.height = contH + 'px';
    }
    resizeHandle.addEventListener('pointerdown', e => {
        e.preventDefault(); e.stopPropagation();
        const x0 = e.clientX, y0 = e.clientY, w0 = contW, h0 = contH;
        try { resizeHandle.setPointerCapture(e.pointerId); } catch (_) {}
        const move = ev => {
            contW = Math.max(680, w0 + ev.clientX - x0);
            contH = Math.max(480, h0 + ev.clientY - y0);
            applySize();
        };
        const up = () => {
            resizeHandle.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up, true);
            window.removeEventListener('pointercancel', up, true);
            if (typeof saveBoard === 'function') saveBoard();
        };
        resizeHandle.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up, true);
        window.addEventListener('pointercancel', up, true);
    });
    resizeHandle.addEventListener('mousedown', stop);
    resizeHandle.addEventListener('touchstart', stop, { passive: true });

    let ro = null;
    if (typeof ResizeObserver === 'function') {
        ro = new ResizeObserver(() => {
            if (!document.body.contains(widget)) { ro.disconnect(); return; }
            requestDraw();
        });
        ro.observe(sceneWrap);
    }

    // ── Boutons fenêtre (jaune / vert / rouge) ────────────────────────────
    const wfMin = header.querySelector('[data-role="wf-min"]');
    const wfMax = header.querySelector('[data-role="wf-max"]');
    const wfClose = header.querySelector('[data-role="wf-close"]');
    let _isMax = false;
    wfMin.addEventListener('click', e => {
        e.stopPropagation();
        if (_isMax) wfMax.click();
        if (playing) setPlaying(false);
        if (typeof window._wfMiniBarCollapse === 'function') {
            window._wfMiniBarCollapse(widget, '🪐 Le système solaire', {
                onExpand: () => requestAnimationFrame(() => { applySize(); lastInfoKey = ''; requestDraw(); })
            });
        }
    });
    wfMax.addEventListener('click', e => {
        e.stopPropagation();
        _isMax = !_isMax;
        container.classList.toggle('wf-fullboard', _isMax);
        requestDraw();
    });
    wfClose.addEventListener('click', e => {
        e.stopPropagation();
        if (typeof snapshotNow === 'function') snapshotNow();
        cleanup();
        widget.remove();
        if (typeof saveBoard === 'function') saveBoard();
    });
    function cleanup() {
        if (animId) cancelAnimationFrame(animId);
        animId = null; playing = false; tiltAnim = null;
        if (ro) ro.disconnect();
        document.removeEventListener('click', closeHelp);
    }

    // ── Init ──────────────────────────────────────────────────────────────
    widget.addEventListener('mousedown', e => {
        if (e.target.closest && e.target.closest('button,input,select')) return;
        if (typeof bringToFront === 'function') bringToFront(widget);
        widget.focus();
        if (typeof positionActionBar === 'function') positionActionBar(widget);
    });

    board.appendChild(widget);
    if (typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);
    if (typeof bringToFront === 'function') bringToFront(widget);
    if (typeof makeDraggable === 'function') makeDraggable(widget);
    if (typeof makeDraggableRotate === 'function') makeDraggableRotate(widget);

    applySize();
    setSpeed(0);
    setMode('orbites');
    requestAnimationFrame(() => draw());

    // ── API pour save-load.js ─────────────────────────────────────────────
    widget._ssGetData = () => ({
        containerW: contW, containerH: contH,
        mode, t: +t.toFixed(3), speed, tilt: +tilt.toFixed(3),
        scale: scaleTarget, showNames, showOrbits, wholeSun, sel
    });
    widget._ssSetData = (d) => {
        if (!d) return;
        if (d.containerW) contW = Math.max(680, d.containerW);
        if (d.containerH) contH = Math.max(480, d.containerH);
        applySize();
        if (typeof d.t === 'number' && d.t >= 0) t = d.t;
        if (typeof d.speed === 'number') setSpeed(d.speed);
        if (typeof d.tilt === 'number') { tilt = Math.max(0.25, Math.min(1, d.tilt)); syncViewBtns(); }
        if (typeof d.showNames === 'boolean') { showNames = d.showNames; namesBtn.classList.toggle('on', showNames); }
        if (typeof d.showOrbits === 'boolean') { showOrbits = d.showOrbits; orbitsBtn.classList.toggle('on', showOrbits); }
        if (typeof d.wholeSun === 'boolean') { wholeSun = d.wholeSun; wholeBtn.classList.toggle('on', wholeSun); }
        if (d.sel && bodyById(d.sel)) sel = d.sel;
        setScale(!!d.scale, true);
        setMode(d.mode || 'orbites');
    };

    if (typeof saveBoard === 'function') saveBoard();
    return widget;
}
