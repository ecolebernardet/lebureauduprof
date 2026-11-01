// =========================================================================
// WIDGET ESTIMATION — Le Bureau du Prof
// Rituel de sens du nombre : une image (bocal de billes, foule vue de haut,
// moutons, oiseaux, étoiles, bonbons), chacun donne une estimation, puis on
// révèle la vraie réponse.
//   - Les images sont dessinées par l'activité : la réponse est donc exacte.
//     Le tirage est « graine » : la même image revient après une actualisation.
//   - 📷 Ma photo : l'enseignant charge sa propre image et indique la réponse.
//   - Affichage limité facultatif (5, 10 ou 20 s) pour empêcher de compter.
//   - 🔍 Repère : un cadre où l'on donne le nombre exact d'objets (stratégie).
//   - Révélation : compteur animé, classement des estimations (écart),
//     droite graduée, et « paquets de 10 » pour vérifier.
//
// Même fenêtre que « La phrase du jour » : redimensionnement libre,
// aide, réduire, plein écran (fullboard), fermer.
// Sur téléphone : ouverture directe en plein écran (bouton vert).
//
// Dépendances : board, findFreePosition(), makeDraggable(),
//   makeDraggableRotate(), bringToFront(), snapshotNow(), saveBoard()
//   (+ window._wfMiniBarCollapse défini par activite-francais-mot-le-plus-long.js)
// =========================================================================

// ── CSS ───────────────────────────────────────────────────────────────────
(function () {
    // CSS partagé boutons fenêtre (injecté une seule fois)
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

    if (document.getElementById('est-style')) return;
    const s = document.createElement('style');
    s.id = 'est-style';
    s.textContent = `
        .widget[data-type="estimation"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        .est-container {
            background: #ffffff;
            border: 1.5px solid #d1d5db;
            border-radius: 16px;
            padding: 14px 16px 12px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: 9px;
            font-family: 'Segoe UI', system-ui, sans-serif;
            box-shadow: 0 4px 18px rgba(0,0,0,0.12);
            position: relative;
            user-select: none;
            overflow: hidden;
        }
        .est-container input, .est-container select { user-select: text; -webkit-user-select: text; font-family: inherit; }

        /* En-tête */
        .est-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; cursor: move; }
        .est-title { font-size: 13px; font-weight: 800; color: #374151; letter-spacing: .3px; pointer-events: none; }
        .est-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; background: #e0f2fe; color: #075985; }

        /* Réduit / plein écran */
        .est-container.wf-minimized > *:not(.est-header) { display: none !important; }
        .est-container.wf-minimized { gap: 0; }
        .est-container.wf-fullboard {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: auto !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
            overflow-y: auto;
            padding-left: 50px !important;
        }
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .est-container.wf-fullboard {
                left: 40px !important;
                width: calc(100vw - 40px) !important;
                max-width: calc(100vw - 40px) !important;
                height: 100dvh !important;
                min-width: 0 !important;
                padding-left: calc(10px + env(safe-area-inset-left)) !important;
            }
        }

        /* Boutons */
        .est-row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
        .est-btn {
            padding: 5px 12px; border-radius: 8px; border: none;
            font-size: 11px; font-weight: 700; cursor: pointer;
            transition: background .15s, transform .1s;
        }
        .est-btn:active { transform: scale(0.96); }
        .est-btn:disabled { opacity: .45; cursor: default; transform: none; }
        .est-btn-blue  { background: #4a90e2; color: #fff; }
        .est-btn-blue:hover:not(:disabled)  { background: #357abd; }
        .est-btn-grey  { background: #f0f0f0; color: #333; border: 1px solid #ddd; }
        .est-btn-grey:hover:not(:disabled)  { background: #e0e0e0; }
        .est-btn-green { background: #28a745; color: #fff; }
        .est-btn-green:hover:not(:disabled) { background: #1f8a39; }
        .est-btn-orange { background: #f59e0b; color: #fff; }
        .est-btn-orange:hover:not(:disabled) { background: #d97706; }
        .est-btn-yellow { background: #fff7d6; color: #8a6100; border: 1px solid #f1dc94; }
        .est-btn-yellow:hover:not(:disabled) { background: #fdeeb0; }
        .est-btn-big { font-size: 13px; padding: 7px 16px; }
        .est-btn.on { background: #e0f2fe; color: #075985; border-color: #7dd3fc; }
        .est-sel { padding: 4px 6px; border: 1px solid #ddd; border-radius: 6px; font-size: 11px; background: #fff; }
        .est-lbl { font-size: 11px; font-weight: 700; color: #6b7280; }
        .est-level-btns { display: flex; gap: 4px; margin-left: auto; flex-wrap: wrap; }
        .est-level-btn {
            padding: 4px 9px; border-radius: 6px; border: 1px solid #ddd; background: #f5f5f5;
            font-size: 10px; font-weight: 700; cursor: pointer; color: #666;
        }
        .est-level-btn:hover { background: #e0e0e0; }
        .est-level-btn.active { background: #e0f2fe; color: #075985; border-color: #7dd3fc; }

        /* Ma photo */
        .est-photo-row {
            display: none; gap: 6px; align-items: center; flex-wrap: wrap;
            padding: 8px 10px; background: #fafafa; border: 1px solid #eee; border-radius: 10px;
        }
        .est-photo-row.show { display: flex; }
        .est-photo-row input[type="text"], .est-photo-row input[type="number"] {
            padding: 5px 8px; border: 2px solid #ddd; border-radius: 8px; font-size: 13px; outline: none;
        }
        .est-photo-row input:focus { border-color: #4a90e2; }
        .est-photo-name { font-size: 11px; color: #6b7280; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        /* Scène */
        .est-stage {
            position: relative; flex-shrink: 0; overflow: hidden;
            border-radius: 12px; border: 1px solid #e5e7eb; background: #1f2937;
        }
        .est-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
        .est-question {
            text-align: center; color: #0f172a; font-weight: 800;
            font-size: 22px; line-height: 1.2; margin: 0 0 -2px;
        }
        .est-cover {
            position: absolute; inset: 0; z-index: 3; display: none;
            flex-direction: column; align-items: center; justify-content: center; gap: 12px;
            background: repeating-linear-gradient(45deg, #334155 0 22px, #3b4a5e 22px 44px);
            color: #fff; text-align: center; font-weight: 800; font-size: 22px;
        }
        .est-cover.show { display: flex; }
        .est-cover small { font-size: 14px; font-weight: 600; opacity: .85; }
        .est-countdown {
            position: absolute; right: 10px; top: 10px; z-index: 2;
            background: rgba(15,23,42,.8); color: #fff; font-weight: 800; font-size: 16px;
            padding: 4px 12px; border-radius: 20px; display: none; font-variant-numeric: tabular-nums;
        }
        .est-countdown.show { display: block; }
        .est-empty {
            position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
            color: #e5e7eb; font-size: 18px; font-weight: 600; text-align: center; padding: 20px;
        }

        /* Estimations */
        .est-guess-row { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
        .est-input { padding: 6px 9px; border: 2px solid #ddd; border-radius: 8px; font-size: 15px; outline: none; }
        .est-input:focus { border-color: #4a90e2; }
        .est-input-name { width: 150px; }
        .est-input-val  { width: 120px; font-weight: 800; }
        .est-chips { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; min-height: 26px; }
        .est-chip {
            display: inline-flex; align-items: center; gap: 6px;
            padding: 3px 4px 3px 10px; border-radius: 20px; background: #eff6ff; border: 1px solid #bfdbfe;
            font-size: 14px; color: #1e3a8a;
        }
        .est-chip b { font-size: 16px; }
        .est-chip.best { background: #fef9c3; border-color: #facc15; color: #713f12; }
        .est-chip-del {
            border: none; background: rgba(0,0,0,.08); color: #475569; width: 18px; height: 18px;
            border-radius: 50%; cursor: pointer; font-size: 11px; padding: 0; line-height: 1;
        }
        .est-chip-del:hover { background: #fee2e2; color: #b91c1c; }
        .est-none { font-size: 12px; color: #9ca3af; font-style: italic; }

        /* Résultat */
        .est-result {
            display: none; padding: 10px 14px; border-radius: 12px;
            background: #f0f9ff; border: 1px solid #bae6fd; color: #0c4a6e;
            animation: estFade .35s ease-out;
        }
        .est-result.show { display: block; }
        .est-answer { display: flex; align-items: baseline; justify-content: center; gap: 10px; flex-wrap: wrap; }
        .est-answer-num { font-size: 46px; font-weight: 900; color: #b91c1c; font-variant-numeric: tabular-nums; line-height: 1.1; }
        .est-answer-lbl { font-size: 18px; font-weight: 700; }
        .est-line { width: 100%; height: 120px; display: block; margin: 4px 0; }
        .est-rank { display: flex; flex-direction: column; gap: 3px; font-size: 15px; }
        .est-rank-item { display: flex; gap: 8px; align-items: baseline; flex-wrap: wrap; }
        .est-rank-item .pos { min-width: 30px; font-weight: 800; }
        .est-rank-item .gap { color: #64748b; font-size: 13px; }
        .est-rank-item.best { font-weight: 800; color: #713f12; }
        .est-groups-txt { margin-top: 6px; font-size: 15px; font-weight: 700; color: #0f766e; }
        @keyframes estFade { from { opacity: 0; transform: translateY(-3px); } to { opacity: 1; transform: none; } }

        /* Aide */
        .est-help-btn {
            width: 22px; height: 22px; border-radius: 50%; border: 1px solid #bbb; background: #f5f5f5;
            color: #666; font-size: 12px; font-weight: 700; cursor: pointer;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .est-help-btn:hover { background: #e0e0e0; color: #333; }
        .est-help-popup {
            display: none; position: absolute; top: 36px; right: 10px; background: #fff;
            border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            padding: 12px 14px; width: 340px; font-size: 11px; color: #444; z-index: 10; line-height: 1.5;
        }
        .est-help-popup.show { display: block; }
        .est-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #374151; }
        .est-help-popup p { margin: 0 0 6px; }
        .est-help-popup p:last-child { margin-bottom: 0; }

        .est-resize-handle {
            position: absolute; right: 0; bottom: 0; width: 18px; height: 18px; cursor: se-resize;
            background: linear-gradient(135deg, transparent 50%, #aaa 50%);
            border-radius: 0 0 14px 0; opacity: 0; transition: opacity .2s; z-index: 5;
        }
        .est-container:hover .est-resize-handle { opacity: 1; }
    `;
    document.head.appendChild(s);
})();

// ── Scènes et niveaux ─────────────────────────────────────────────────────
const EST_W = 1600, EST_H = 1000;   // repère logique du dessin (format 16/10)

const EST_SCENES = {
    billes:  { nom: 'Bocal de billes', ico: '🫙', q: 'Combien de billes dans le bocal ?',   unite: 'billes' },
    foule:   { nom: 'Foule',           ico: '👥', q: 'Combien de personnes sur la place ?', unite: 'personnes' },
    moutons: { nom: 'Moutons',         ico: '🐑', q: 'Combien de moutons dans le pré ?',     unite: 'moutons' },
    oiseaux: { nom: 'Oiseaux',         ico: '🐦', q: 'Combien d\'oiseaux dans le ciel ?',    unite: 'oiseaux' },
    etoiles: { nom: 'Étoiles',         ico: '⭐', q: 'Combien d\'étoiles dans le ciel ?',    unite: 'étoiles' },
    bonbons: { nom: 'Bonbons',         ico: '🍬', q: 'Combien de bonbons dans l\'assiette ?', unite: 'bonbons' }
};
const EST_LEVELS = {
    '1': { label: 'Niveau 1', titre: 'Niveau 1 : de 10 à 50 objets',   min: 10,  max: 50 },
    '2': { label: 'Niveau 2', titre: 'Niveau 2 : de 50 à 200 objets',  min: 50,  max: 200 },
    '3': { label: 'Niveau 3', titre: 'Niveau 3 : de 200 à 600 objets', min: 200, max: 600 }
};
const EST_GROUP_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'];

// ── Outils ────────────────────────────────────────────────────────────────
function _estRng(seed) {
    let a = seed >>> 0;
    return function () {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
function _estEsc(t) {
    return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function _estFmt(n) { return Number(n).toLocaleString('fr-FR'); }
function _estIsPhone() {
    if (typeof isMobileBoardMode === 'function') { try { if (isMobileBoardMode()) return true; } catch (e) {} }
    return !!(window.matchMedia && window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse)').matches);
}

// Place « count » objets sans trop de chevauchement dans une zone
// box : rectangle englobant, inside(x, y, r) : le point est-il dans la zone ?
function _estPlace(rng, count, box, inside, area, overlap) {
    overlap = overlap || 0.92;
    let r = Math.sqrt(area * 0.42 / (count * Math.PI));
    for (let attempt = 0; attempt < 14; attempt++) {
        const pts = [];
        const minD = 2 * r * overlap;
        const cell = minD;
        const grid = new Map();
        const key = (i, j) => i + ',' + j;
        let tries = 0;
        const maxTries = count * 90;
        while (pts.length < count && tries < maxTries) {
            tries++;
            const x = box.x0 + rng() * (box.x1 - box.x0);
            const y = box.y0 + rng() * (box.y1 - box.y0);
            if (!inside(x, y, r)) continue;
            const ci = Math.floor(x / cell), cj = Math.floor(y / cell);
            let ok = true;
            for (let di = -1; di <= 1 && ok; di++) for (let dj = -1; dj <= 1 && ok; dj++) {
                const arr = grid.get(key(ci + di, cj + dj));
                if (arr) for (const p of arr) {
                    if ((p.x - x) * (p.x - x) + (p.y - y) * (p.y - y) < minD * minD) { ok = false; break; }
                }
            }
            if (!ok) continue;
            const p = { x, y, r };
            pts.push(p);
            const k = key(ci, cj);
            if (!grid.has(k)) grid.set(k, []);
            grid.get(k).push(p);
        }
        if (pts.length === count) return pts;
        r *= 0.93;
        if (attempt === 13) {
            // Dernier recours : on complète sans contrainte de distance
            while (pts.length < count) {
                const x = box.x0 + rng() * (box.x1 - box.x0);
                const y = box.y0 + rng() * (box.y1 - box.y0);
                if (inside(x, y, r)) pts.push({ x, y, r });
            }
            return pts;
        }
    }
    return [];
}

// Zone de chaque scène (dans le repère 1600 × 1000)
const EST_JAR = { x0: 470, x1: 1130, y0: 250, y1: 940, rad: 70 };
function _estRegion(scene) {
    switch (scene) {
        case 'billes': {
            const j = EST_JAR, m = 22;
            return {
                box: { x0: j.x0 + m, y0: j.y0 + m, x1: j.x1 - m, y1: j.y1 - m },
                inside: (x, y, r) => {
                    const x0 = j.x0 + m + r, x1 = j.x1 - m - r, y0 = j.y0 + m + r, y1 = j.y1 - m - r;
                    if (x < x0 || x > x1 || y < y0 || y > y1) return false;
                    const cr = Math.max(0, j.rad - m - r);
                    const dx = Math.max(x0 + cr - x, 0, x - (x1 - cr));
                    const dy = Math.max(y0 + cr - y, 0, y - (y1 - cr));
                    return dx * dx + dy * dy <= cr * cr;
                },
                area: (j.x1 - j.x0 - 2 * m) * (j.y1 - j.y0 - 2 * m) * 0.97
            };
        }
        case 'foule':
            return { box: { x0: 30, y0: 30, x1: 1570, y1: 970 }, inside: (x, y, r) => x > 30 + r && x < 1570 - r && y > 30 + r && y < 970 - r, area: 1540 * 940 };
        case 'moutons':
            return { box: { x0: 30, y0: 330, x1: 1570, y1: 975 }, inside: (x, y, r) => x > 30 + r && x < 1570 - r && y > 330 + r * 0.6 && y < 975 - r, area: 1540 * 645 };
        case 'oiseaux':
            return { box: { x0: 40, y0: 40, x1: 1560, y1: 840 }, inside: (x, y, r) => x > 40 + r && x < 1560 - r && y > 40 + r && y < 840 - r, area: 1520 * 800 };
        case 'etoiles':
            return { box: { x0: 30, y0: 30, x1: 1570, y1: 800 }, inside: (x, y, r) => x > 30 + r && x < 1570 - r && y > 30 + r && y < 800 - r - (Math.sin(x / 210) * 40 + 40), area: 1540 * 720 };
        case 'bonbons': {
            const cx = 800, cy = 515, R = 400;
            return {
                box: { x0: cx - R, y0: cy - R, x1: cx + R, y1: cy + R },
                inside: (x, y, r) => (x - cx) * (x - cx) + (y - cy) * (y - cy) <= (R - r) * (R - r),
                area: Math.PI * R * R
            };
        }
    }
    return null;
}

// Génère la liste des objets d'une scène (toujours la même pour une graine donnée)
function _estGenerate(scene, count, seed) {
    const rng = _estRng(seed);
    const reg = _estRegion(scene);
    const overlap = scene === 'billes' ? 0.86 : scene === 'etoiles' ? 1.1 : scene === 'oiseaux' ? 1.05 : 0.92;
    const pts = _estPlace(rng, count, reg.box, reg.inside, reg.area, overlap);
    const palettes = {
        billes:  ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#f97316', '#06b6d4', '#ec4899'],
        foule:   ['#ef4444', '#2563eb', '#16a34a', '#eab308', '#7c3aed', '#f97316', '#0891b2', '#db2777', '#475569', '#f8fafc', '#111827', '#65a30d'],
        bonbons: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6']
    };
    const skins = ['#f9d7b5', '#eec195', '#d7a274', '#b97a4e', '#8d5a36', '#5f3b22'];
    const hairs = ['#1f1b16', '#3b2a1a', '#6b4423', '#a0703a', '#d9b26f', '#7a7a7a', '#b5492a'];
    pts.forEach(p => {
        p.a = rng() * Math.PI * 2;
        p.v = rng();
        p.w = rng();
        const pal = palettes[scene];
        if (pal) p.c = pal[Math.floor(rng() * pal.length)];
        if (scene === 'foule') { p.skin = skins[Math.floor(rng() * skins.length)]; p.hair = hairs[Math.floor(rng() * hairs.length)]; }
    });
    // Les billes « tombent » : on les range du bas vers le haut pour le dessin
    if (scene === 'billes') pts.sort((a, b) => a.y - b.y);
    return pts;
}

// ── Dessin ────────────────────────────────────────────────────────────────
function _estRoundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}
function _estStar(ctx, x, y, r, rot) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
        const rr = i % 2 ? r * 0.45 : r;
        const a = rot + i * Math.PI / 5 - Math.PI / 2;
        if (i) ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); else ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
}

function _estBackground(ctx, scene, seed) {
    const rng = _estRng(seed ^ 0x9e3779b9);
    if (scene === 'billes') {
        const g = ctx.createLinearGradient(0, 0, 0, EST_H);
        g.addColorStop(0, '#f3efe6'); g.addColorStop(1, '#e2dccd');
        ctx.fillStyle = g; ctx.fillRect(0, 0, EST_W, EST_H);
        ctx.fillStyle = '#a0703a'; ctx.fillRect(0, 900, EST_W, 100);
        ctx.fillStyle = '#8a5d2e'; ctx.fillRect(0, 900, EST_W, 10);
        for (let i = 0; i < 8; i++) { ctx.fillStyle = 'rgba(0,0,0,.06)'; ctx.fillRect(0, 920 + i * 10, EST_W, 2); }
        // ombre du bocal
        ctx.fillStyle = 'rgba(0,0,0,.18)';
        ctx.beginPath(); ctx.ellipse(800, 945, 360, 28, 0, 0, Math.PI * 2); ctx.fill();
    } else if (scene === 'foule') {
        ctx.fillStyle = '#c9c3b6'; ctx.fillRect(0, 0, EST_W, EST_H);
        ctx.strokeStyle = 'rgba(0,0,0,.08)'; ctx.lineWidth = 3;
        for (let x = 0; x <= EST_W; x += 80) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, EST_H); ctx.stroke(); }
        for (let y = 0; y <= EST_H; y += 80) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(EST_W, y); ctx.stroke(); }
    } else if (scene === 'moutons') {
        const g = ctx.createLinearGradient(0, 0, 0, 330);
        g.addColorStop(0, '#7cc4f5'); g.addColorStop(1, '#d8eefc');
        ctx.fillStyle = g; ctx.fillRect(0, 0, EST_W, 330);
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 4; i++) {
            const cx = 150 + i * 400 + rng() * 120, cy = 70 + rng() * 90;
            for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(cx + k * 34, cy + Math.sin(k) * 12, 34 + (k % 2) * 10, 0, Math.PI * 2); ctx.fill(); }
        }
        ctx.fillStyle = '#6fbf4a';
        ctx.beginPath(); ctx.moveTo(0, 330);
        for (let x = 0; x <= EST_W; x += 40) ctx.lineTo(x, 300 + Math.sin(x / 190) * 25);
        ctx.lineTo(EST_W, EST_H); ctx.lineTo(0, EST_H); ctx.closePath(); ctx.fill();
        const g2 = ctx.createLinearGradient(0, 300, 0, EST_H);
        g2.addColorStop(0, 'rgba(255,255,255,0)'); g2.addColorStop(1, 'rgba(0,60,0,.18)');
        ctx.fillStyle = g2; ctx.fillRect(0, 280, EST_W, EST_H - 280);
        ctx.fillStyle = 'rgba(40,110,30,.35)';
        for (let i = 0; i < 260; i++) { ctx.fillRect(rng() * EST_W, 330 + rng() * 670, 3, 10); }
    } else if (scene === 'oiseaux') {
        const g = ctx.createLinearGradient(0, 0, 0, EST_H);
        g.addColorStop(0, '#5aa9e6'); g.addColorStop(0.75, '#cfe8fb'); g.addColorStop(1, '#f6d8a8');
        ctx.fillStyle = g; ctx.fillRect(0, 0, EST_W, EST_H);
        ctx.fillStyle = 'rgba(255,255,255,.7)';
        for (let i = 0; i < 5; i++) {
            const cx = rng() * EST_W, cy = 100 + rng() * 650;
            for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.ellipse(cx + k * 45, cy + Math.sin(k * 1.3) * 10, 60, 26, 0, 0, Math.PI * 2); ctx.fill(); }
        }
        ctx.fillStyle = '#4b6b3a';
        ctx.beginPath(); ctx.moveTo(0, EST_H);
        for (let x = 0; x <= EST_W; x += 40) ctx.lineTo(x, 900 + Math.sin(x / 130) * 18 + Math.sin(x / 47) * 6);
        ctx.lineTo(EST_W, EST_H); ctx.closePath(); ctx.fill();
    } else if (scene === 'etoiles') {
        const g = ctx.createLinearGradient(0, 0, 0, EST_H);
        g.addColorStop(0, '#060b24'); g.addColorStop(0.7, '#1b2a5a'); g.addColorStop(1, '#2b3b6e');
        ctx.fillStyle = g; ctx.fillRect(0, 0, EST_W, EST_H);
        ctx.fillStyle = '#0b1020';
        ctx.beginPath(); ctx.moveTo(0, EST_H);
        for (let x = 0; x <= EST_W; x += 20) ctx.lineTo(x, 800 - (Math.sin(x / 210) * 40 + 40) + 30);
        ctx.lineTo(EST_W, EST_H); ctx.closePath(); ctx.fill();
    } else if (scene === 'bonbons') {
        ctx.fillStyle = '#e9d5b7'; ctx.fillRect(0, 0, EST_W, EST_H);
        ctx.strokeStyle = 'rgba(120,80,40,.12)'; ctx.lineWidth = 4;
        for (let y = 20; y < EST_H; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.bezierCurveTo(400, y + 10, 1200, y - 10, EST_W, y + 4); ctx.stroke(); }
        ctx.fillStyle = 'rgba(0,0,0,.18)';
        ctx.beginPath(); ctx.ellipse(815, 540, 470, 470, 0, 0, Math.PI * 2); ctx.fill();
        const g = ctx.createRadialGradient(800, 515, 300, 800, 515, 460);
        g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#dfe4ea');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(800, 515, 460, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.arc(800, 515, 410, 0, Math.PI * 2); ctx.stroke();
    }
}

function _estDrawItem(ctx, scene, p) {
    const r = p.r;
    if (scene === 'billes') {
        const g = ctx.createRadialGradient(p.x - r * 0.35, p.y - r * 0.35, r * 0.1, p.x, p.y, r);
        g.addColorStop(0, '#ffffff'); g.addColorStop(0.25, p.c); g.addColorStop(1, 'rgba(0,0,0,.55)');
        ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
    } else if (scene === 'foule') {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a);
        ctx.fillStyle = p.c;
        ctx.beginPath(); ctx.ellipse(0, 0, r * 0.98, r * 0.58, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = Math.max(1, r * 0.06); ctx.stroke();
        ctx.fillStyle = p.skin;
        ctx.beginPath(); ctx.arc(r * 0.06, 0, r * 0.46, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = p.hair;
        ctx.beginPath(); ctx.arc(-r * 0.04, 0, r * 0.44, Math.PI * 0.3, Math.PI * 1.7); ctx.closePath(); ctx.fill();
        ctx.restore();
    } else if (scene === 'moutons') {
        const dir = p.v < 0.5 ? -1 : 1;
        ctx.save(); ctx.translate(p.x, p.y);
        ctx.fillStyle = 'rgba(0,0,0,.15)';
        ctx.beginPath(); ctx.ellipse(0, r * 0.62, r * 0.85, r * 0.18, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = Math.max(1.5, r * 0.1); ctx.lineCap = 'round';
        [-0.45, -0.15, 0.2, 0.45].forEach(dx => { ctx.beginPath(); ctx.moveTo(dx * r, r * 0.2); ctx.lineTo(dx * r, r * 0.6); ctx.stroke(); });
        ctx.fillStyle = '#f8f8f2'; ctx.strokeStyle = '#c9c9c0'; ctx.lineWidth = Math.max(1, r * 0.05);
        [[-0.45, 0], [0, -0.22], [0.45, 0], [-0.2, 0.15], [0.22, 0.15], [0, 0.05]].forEach(([dx, dy]) => {
            ctx.beginPath(); ctx.arc(dx * r, dy * r, r * 0.42, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        });
        ctx.fillStyle = '#2f2f2f';
        ctx.beginPath(); ctx.ellipse(dir * r * 0.85, -r * 0.05, r * 0.26, r * 0.2, dir * 0.3, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    } else if (scene === 'oiseaux') {
        const s = r * 1.15, flap = (p.v - 0.5) * 0.7;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate((p.w - 0.5) * 0.5);
        ctx.strokeStyle = '#1f2937'; ctx.lineWidth = Math.max(2, s * 0.16); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(-s, -s * (0.25 + flap));
        ctx.quadraticCurveTo(-s * 0.45, -s * (0.55 + flap), 0, 0);
        ctx.quadraticCurveTo(s * 0.45, -s * (0.55 + flap), s, -s * (0.25 + flap));
        ctx.stroke();
        ctx.restore();
    } else if (scene === 'etoiles') {
        const sz = r * (0.55 + p.v * 0.45);
        ctx.save();
        ctx.shadowColor = 'rgba(255,255,220,.9)'; ctx.shadowBlur = sz * 0.9;
        ctx.fillStyle = p.w < 0.25 ? '#fde68a' : p.w < 0.4 ? '#bfdbfe' : '#ffffff';
        _estStar(ctx, p.x, p.y, sz, p.a);
        ctx.fill();
        ctx.restore();
    } else if (scene === 'bonbons') {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a);
        const w = r * 0.72, h = r * 0.48;
        ctx.fillStyle = p.c;
        ctx.beginPath(); ctx.moveTo(-w, 0); ctx.lineTo(-w - r * 0.32, -h * 0.85); ctx.lineTo(-w - r * 0.32, h * 0.85); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(w, 0); ctx.lineTo(w + r * 0.32, -h * 0.85); ctx.lineTo(w + r * 0.32, h * 0.85); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.ellipse(0, 0, w, h, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.65)'; ctx.lineWidth = Math.max(1.5, r * 0.1);
        ctx.beginPath(); ctx.moveTo(-w * 0.35, -h * 0.85); ctx.lineTo(w * 0.05, h * 0.85); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(w * 0.2, -h * 0.85); ctx.lineTo(w * 0.6, h * 0.6); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.45)';
        ctx.beginPath(); ctx.ellipse(-w * 0.3, -h * 0.4, w * 0.25, h * 0.18, -0.4, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
}

function _estJarGlass(ctx) {
    const j = EST_JAR;
    // goulot et couvercle
    ctx.fillStyle = 'rgba(210,230,240,.25)';
    ctx.strokeStyle = 'rgba(90,120,140,.85)'; ctx.lineWidth = 8;
    _estRoundRect(ctx, 560, 170, 480, 90, 20); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c0392b';
    _estRoundRect(ctx, 540, 120, 520, 62, 16); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(560, 130, 480, 12);
    // corps
    ctx.strokeStyle = 'rgba(90,120,140,.9)'; ctx.lineWidth = 10;
    _estRoundRect(ctx, j.x0, j.y0, j.x1 - j.x0, j.y1 - j.y0, j.rad); ctx.stroke();
    // reflets
    const g = ctx.createLinearGradient(j.x0, 0, j.x1, 0);
    g.addColorStop(0, 'rgba(255,255,255,.28)'); g.addColorStop(0.12, 'rgba(255,255,255,.05)');
    g.addColorStop(0.85, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,.18)');
    ctx.fillStyle = g;
    _estRoundRect(ctx, j.x0, j.y0, j.x1 - j.x0, j.y1 - j.y0, j.rad); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    _estRoundRect(ctx, j.x0 + 40, j.y0 + 60, 26, j.y1 - j.y0 - 160, 13); ctx.fill();
}

// Paquets de 10 : on range les objets par bandes horizontales (en serpentin)
function _estGroups(items) {
    const n = items.length;
    if (!n) return [];
    const ys = items.map(p => p.y);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const bands = Math.max(1, Math.round(Math.sqrt(n / 4)));
    const bh = (maxY - minY + 1) / bands;
    const idx = items.map((p, i) => i);
    idx.sort((a, b) => {
        const ba = Math.min(bands - 1, Math.floor((items[a].y - minY) / bh));
        const bb = Math.min(bands - 1, Math.floor((items[b].y - minY) / bh));
        if (ba !== bb) return ba - bb;
        return ba % 2 ? items[b].x - items[a].x : items[a].x - items[b].x;
    });
    const g = new Array(n);
    idx.forEach((i, k) => { g[i] = Math.floor(k / 10); });
    return g;
}

// Repère : un cadre où l'on compte exactement les objets
function _estRepere(items, scene, seed) {
    const reg = _estRegion(scene);
    const rng = _estRng(seed ^ 0x5bd1e995);
    const b = reg.box;
    const w = (b.x1 - b.x0) * 0.26, h = (b.y1 - b.y0) * 0.3;
    let best = null;
    for (let t = 0; t < 40; t++) {
        const x = b.x0 + rng() * (b.x1 - b.x0 - w), y = b.y0 + rng() * (b.y1 - b.y0 - h);
        const n = items.filter(p => p.x >= x && p.x <= x + w && p.y >= y && p.y <= y + h).length;
        const score = Math.abs(n - Math.min(20, Math.max(5, items.length * 0.1)));
        if (!best || score < best.score) best = { x, y, w, h, n, score };
    }
    return best;
}

// ── Création du widget ────────────────────────────────────────────────────
function createEstimationWidget() {
    snapshotNow();
    const pos = findFreePosition();

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'estimation';
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
    container.className = 'est-container';
    const initW = Math.round(window.innerWidth * 0.75);
    const initH = Math.round(initW * 9 / 16);
    container.style.width = initW + 'px';

    // ── En-tête ───────────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.className = 'est-header';
    header.innerHTML = `
        <span class="est-title">🫙 Estimation</span>
        <span class="est-badge">Niveau 1</span>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    const badge = header.querySelector('.est-badge');
    container.appendChild(header);

    // ── Contrôles ─────────────────────────────────────────────────────────
    const controls = document.createElement('div');
    controls.className = 'est-row';
    controls.innerHTML = `
        <button class="est-btn est-btn-green est-btn-big" data-act="new" title="Une nouvelle image à estimer">🎲 Nouvelle image</button>
        <select class="est-sel" data-role="scene" title="Choix de l'image">
            <option value="">🎲 Image au hasard</option>
            ${Object.keys(EST_SCENES).map(k => `<option value="${k}">${EST_SCENES[k].ico} ${EST_SCENES[k].nom}</option>`).join('')}
        </select>
        <span class="est-lbl">Affichage :</span>
        <select class="est-sel" data-role="limit" title="Temps d'affichage de l'image (pour empêcher de compter)">
            <option value="0">illimité</option>
            <option value="5">5 s</option>
            <option value="10">10 s</option>
            <option value="20">20 s</option>
        </select>
        <button class="est-btn est-btn-grey" data-act="photo" title="Utiliser votre propre image">📷 Ma photo</button>
        <div class="est-level-btns">
            ${Object.keys(EST_LEVELS).map(k => `<button class="est-level-btn" data-level="${k}" title="${EST_LEVELS[k].titre}">${EST_LEVELS[k].label}</button>`).join('')}
        </div>
    `;
    const sceneSel = controls.querySelector('[data-role="scene"]');
    const limitSel = controls.querySelector('[data-role="limit"]');
    const photoBtn = controls.querySelector('[data-act="photo"]');
    container.appendChild(controls);

    // ── Ma photo ──────────────────────────────────────────────────────────
    const photoRow = document.createElement('div');
    photoRow.className = 'est-photo-row';
    photoRow.innerHTML = `
        <button class="est-btn est-btn-blue" data-act="pick">📁 Choisir une image</button>
        <span class="est-photo-name">Aucune image</span>
        <input type="text" data-role="pq" maxlength="80" placeholder="Question (ex. : Combien de pâtes ?)" style="flex:1;min-width:180px">
        <input type="number" data-role="pa" min="1" max="1000000" placeholder="Vraie réponse" style="width:120px">
        <button class="est-btn est-btn-green" data-act="photo-ok">✔ Valider</button>
        <button class="est-btn est-btn-grey" data-act="photo-cancel">Annuler</button>
        <input type="file" accept="image/*" data-role="file" style="display:none">
    `;
    const photoName = photoRow.querySelector('.est-photo-name');
    const pqInput   = photoRow.querySelector('[data-role="pq"]');
    const paInput   = photoRow.querySelector('[data-role="pa"]');
    const fileInput = photoRow.querySelector('[data-role="file"]');
    container.appendChild(photoRow);

    // ── Scène ─────────────────────────────────────────────────────────────
    const stage = document.createElement('div');
    stage.className = 'est-stage';
    stage.style.height = Math.round(initW * 0.5) + 'px';
    const canvas = document.createElement('canvas');
    canvas.className = 'est-canvas';
    const questionEl = document.createElement('div');
    questionEl.className = 'est-question';
    const countdownEl = document.createElement('div');
    countdownEl.className = 'est-countdown';
    const cover = document.createElement('div');
    cover.className = 'est-cover';
    cover.innerHTML = `<div>🙈 Image cachée</div><small>À vous d'estimer ! Écrivez votre estimation sur l'ardoise.</small>
        <button class="est-btn est-btn-yellow est-btn-big" data-act="peek">👁 Revoir l'image</button>`;
    const emptyEl = document.createElement('div');
    emptyEl.className = 'est-empty';
    emptyEl.innerHTML = 'Cliquez sur <b>&nbsp;🎲 Nouvelle image&nbsp;</b> pour commencer.';
    stage.appendChild(canvas);
    stage.appendChild(countdownEl);
    stage.appendChild(cover);
    stage.appendChild(emptyEl);
    container.appendChild(questionEl);
    container.appendChild(stage);

    // ── Aides ─────────────────────────────────────────────────────────────
    const aids = document.createElement('div');
    aids.className = 'est-row';
    aids.innerHTML = `
        <button class="est-btn est-btn-yellow" data-act="repere" title="Afficher un cadre où l'on donne le nombre exact d'objets">🔍 Repère</button>
        <button class="est-btn est-btn-grey" data-act="groups" title="Colorer les objets par paquets de 10 (après la révélation)">🧮 Paquets de 10</button>
        <span class="est-lbl" data-role="aidtxt"></span>
    `;
    const repereBtn = aids.querySelector('[data-act="repere"]');
    const groupsBtn = aids.querySelector('[data-act="groups"]');
    const aidTxt    = aids.querySelector('[data-role="aidtxt"]');
    container.appendChild(aids);

    // ── Estimations ───────────────────────────────────────────────────────
    const guessRow = document.createElement('div');
    guessRow.className = 'est-guess-row';
    guessRow.innerHTML = `
        <input class="est-input est-input-name" type="text" maxlength="30" placeholder="Prénom (facultatif)" autocomplete="off">
        <input class="est-input est-input-val" type="number" min="0" max="1000000" placeholder="Estimation">
        <button class="est-btn est-btn-blue" data-act="add">➕ Ajouter</button>
        <span class="est-lbl" style="margin-left:4px">Estimations :</span>
        <div class="est-chips"></div>
    `;
    const nameInput = guessRow.querySelector('.est-input-name');
    const valInput  = guessRow.querySelector('.est-input-val');
    const addBtn    = guessRow.querySelector('[data-act="add"]');
    const chipsEl   = guessRow.querySelector('.est-chips');
    container.appendChild(guessRow);

    const revealRow = document.createElement('div');
    revealRow.className = 'est-row';
    revealRow.innerHTML = `
        <button class="est-btn est-btn-orange est-btn-big" data-act="reveal">🎉 Révéler la réponse</button>
        <button class="est-btn est-btn-grey" data-act="hide">🙈 Cacher la réponse</button>
        <button class="est-btn est-btn-grey" data-act="clear" title="Effacer toutes les estimations">🧽 Effacer les estimations</button>
    `;
    const revealBtn = revealRow.querySelector('[data-act="reveal"]');
    const hideBtn   = revealRow.querySelector('[data-act="hide"]');
    const clearBtn  = revealRow.querySelector('[data-act="clear"]');
    container.appendChild(revealRow);

    const result = document.createElement('div');
    result.className = 'est-result';
    container.appendChild(result);

    // ── Aide ──────────────────────────────────────────────────────────────
    const helpBtn = document.createElement('button');
    helpBtn.className = 'est-help-btn';
    helpBtn.title = 'Mode d\'emploi';
    helpBtn.textContent = '?';
    const wfBtnsDiv = header.querySelector('.wf-btns');
    wfBtnsDiv.insertBefore(helpBtn, wfBtnsDiv.firstChild);

    const helpPopup = document.createElement('div');
    helpPopup.className = 'est-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 Estimation</h4>
        <p><b>🎲 Nouvelle image</b> dessine un bocal de billes, une foule vue de haut, des moutons, des oiseaux,
        des étoiles ou des bonbons. Le nombre d'objets dépend du niveau (10 à 50, 50 à 200, 200 à 600).</p>
        <p><b>Affichage</b> : limitez le temps d'affichage (5, 10 ou 20 s) pour que les élèves estiment au lieu de compter.</p>
        <p><b>🔍 Repère</b> : un cadre indique le nombre exact d'objets qu'il contient. Combien de cadres comme
        celui-ci faudrait-il pour couvrir l'image ?</p>
        <p>Notez les estimations (avec ou sans prénom), puis <b>🎉 Révéler la réponse</b> : compteur, classement
        des plus proches, droite graduée. <b>🧮 Paquets de 10</b> colore les objets par dizaines pour vérifier.</p>
        <p><b>📷 Ma photo</b> : chargez votre propre image (pâtes dans un bocal, photo de classe…) et indiquez la vraie réponse.</p>
    `;
    container.appendChild(helpPopup);

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'est-resize-handle';
    container.appendChild(resizeHandle);

    widget.appendChild(container);

    // ── État interne ──────────────────────────────────────────────────────
    let level = '1';
    let sceneChoice = '';        // '' : au hasard
    let cur = null;              // { scene, count, seed } ou { photo:true, img, answer, q }
    let items = [];
    let guesses = [];            // [{ n, v }]
    let revealed = false;
    let showRepere = false, showGroups = false;
    let repere = null, groups = null;
    let limit = 0;
    let hidden = false;
    let cdEnd = 0, cdIv = null;
    let photoImg = null;         // Image chargée
    let pendingPhoto = null;     // dataURL en attente de validation
    let animIv = null;

    function save() { if (typeof saveBoard === 'function') saveBoard(); }

    // ── Nouvelle image ────────────────────────────────────────────────────
    function buildItems() {
        items = []; repere = null; groups = null;
        if (cur && !cur.photo) {
            items = _estGenerate(cur.scene, cur.count, cur.seed);
            repere = _estRepere(items, cur.scene, cur.seed);
            groups = _estGroups(items);
        }
    }
    function newImage() {
        const lv = EST_LEVELS[level];
        let scene = sceneChoice;
        if (!scene) {
            const keys = Object.keys(EST_SCENES).filter(k => !cur || cur.photo || k !== cur.scene);
            scene = keys[Math.floor(Math.random() * keys.length)];
        }
        const count = lv.min + Math.floor(Math.random() * (lv.max - lv.min + 1));
        cur = { scene, count, seed: Math.floor(Math.random() * 4294967295) };
        resetRound();
        buildItems();
        renderAll();
        startDisplay();
        save();
    }
    function resetRound() {
        guesses = [];
        revealed = false;
        showRepere = false;
        showGroups = false;
        stopAnim();
    }

    // ── Affichage limité ──────────────────────────────────────────────────
    function stopCountdown() {
        if (cdIv) { clearInterval(cdIv); cdIv = null; }
        countdownEl.classList.remove('show');
    }
    function startDisplay() {
        stopCountdown();
        hidden = false;
        if (!limit || !cur || revealed) { renderCover(); return; }
        cdEnd = Date.now() + limit * 1000;
        countdownEl.classList.add('show');
        const tick = () => {
            if (!document.body.contains(widget)) { stopCountdown(); return; }
            const left = Math.max(0, cdEnd - Date.now());
            countdownEl.textContent = '⏱️ ' + Math.ceil(left / 1000) + ' s';
            if (left <= 0) { stopCountdown(); hidden = true; renderCover(); save(); }
        };
        tick();
        cdIv = setInterval(tick, 200);
        renderCover();
    }
    function renderCover() {
        cover.classList.toggle('show', !!(hidden && cur && !revealed));
    }

    // ── Dessin de la scène ────────────────────────────────────────────────
    function draw() {
        const cw = stage.clientWidth, ch = stage.clientHeight;
        if (!cw || !ch) return;
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)) {
            canvas.width = Math.round(cw * dpr);
            canvas.height = Math.round(ch * dpr);
        }
        const ctx = canvas.getContext('2d');
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        emptyEl.style.display = cur ? 'none' : '';
        if (!cur) return;

        if (cur.photo) {
            if (!photoImg || !photoImg.complete || !photoImg.naturalWidth) return;
            const iw = photoImg.naturalWidth, ih = photoImg.naturalHeight;
            const sc = Math.min(canvas.width / iw, canvas.height / ih);
            const w = iw * sc, h = ih * sc;
            ctx.drawImage(photoImg, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
            return;
        }

        const sc = Math.min(canvas.width / EST_W, canvas.height / EST_H);
        const ox = (canvas.width - EST_W * sc) / 2, oy = (canvas.height - EST_H * sc) / 2;
        ctx.fillStyle = { billes: '#e9e4d8', foule: '#bfb9ac', moutons: '#5fae3e', oiseaux: '#9ccbef', etoiles: '#0d1430', bonbons: '#dcc6a4' }[cur.scene] || '#1f2937';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.setTransform(sc, 0, 0, sc, ox, oy);
        ctx.save();
        ctx.beginPath(); ctx.rect(0, 0, EST_W, EST_H); ctx.clip();
        _estBackground(ctx, cur.scene, cur.seed);

        // Paquets de 10 : un halo de couleur derrière chaque objet
        if (showGroups && revealed && groups) {
            items.forEach((p, i) => {
                ctx.fillStyle = EST_GROUP_COLORS[groups[i] % EST_GROUP_COLORS.length];
                ctx.globalAlpha = 0.6;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 1.12, 0, Math.PI * 2); ctx.fill();
                ctx.globalAlpha = 1;
            });
        }
        items.forEach(p => _estDrawItem(ctx, cur.scene, p));
        if (cur.scene === 'billes') _estJarGlass(ctx);

        if (showGroups && revealed && groups) {
            // On écrit le numéro de chaque paquet complet sur son centre
            const ng = Math.ceil(items.length / 10);
            ctx.font = `bold ${Math.max(18, items[0] ? items[0].r * 1.1 : 20)}px Segoe UI, sans-serif`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            for (let g = 0; g < ng; g++) {
                const mem = items.filter((p, i) => groups[i] === g);
                if (mem.length < 10) continue;
                const cx = mem.reduce((a, p) => a + p.x, 0) / mem.length, cy = mem.reduce((a, p) => a + p.y, 0) / mem.length;
                ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.strokeText(String(g + 1), cx, cy);
                ctx.fillStyle = '#fff'; ctx.fillText(String(g + 1), cx, cy);
            }
        }

        if (showRepere && repere) {
            ctx.save();
            ctx.fillStyle = 'rgba(255,235,59,.14)';
            ctx.fillRect(repere.x, repere.y, repere.w, repere.h);
            ctx.setLineDash([22, 12]); ctx.lineWidth = 8; ctx.strokeStyle = '#facc15';
            ctx.strokeRect(repere.x, repere.y, repere.w, repere.h);
            ctx.setLineDash([]);
            const lbl = `Dans ce cadre : ${repere.n}`;
            ctx.font = 'bold 44px Segoe UI, sans-serif';
            const tw = ctx.measureText(lbl).width;
            let ly = repere.y - 16; if (ly < 60) ly = repere.y + repere.h + 56;
            ctx.fillStyle = 'rgba(15,23,42,.85)';
            _estRoundRect(ctx, repere.x, ly - 46, tw + 30, 60, 14); ctx.fill();
            ctx.fillStyle = '#facc15'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
            ctx.fillText(lbl, repere.x + 15, ly);
            ctx.restore();
        }
        ctx.restore();
    }

    // ── Rendu ─────────────────────────────────────────────────────────────
    function questionText() {
        if (!cur) return '';
        if (cur.photo) return cur.q || 'Combien y en a-t-il ?';
        return EST_SCENES[cur.scene].q;
    }
    function unitText() {
        if (!cur) return '';
        if (cur.photo) return '';
        return EST_SCENES[cur.scene].unite;
    }
    function answer() { return cur ? (cur.photo ? cur.answer : cur.count) : 0; }

    function renderChips() {
        chipsEl.innerHTML = '';
        if (!guesses.length) { chipsEl.innerHTML = '<span class="est-none">aucune pour l\'instant</span>'; return; }
        let best = [];
        if (revealed) {
            const a = answer();
            const m = Math.min(...guesses.map(g => Math.abs(g.v - a)));
            best = guesses.map((g, i) => Math.abs(g.v - a) === m ? i : -1).filter(i => i >= 0);
        }
        guesses.forEach((g, i) => {
            const c = document.createElement('span');
            c.className = 'est-chip' + (best.includes(i) ? ' best' : '');
            c.innerHTML = (best.includes(i) ? '🏆 ' : '') + (g.n ? _estEsc(g.n) + ' : ' : '') + `<b>${_estFmt(g.v)}</b>` +
                `<button class="est-chip-del" data-del="${i}" title="Retirer">×</button>`;
            chipsEl.appendChild(c);
        });
    }

    function niceStep(range) {
        const raw = range / 6;
        const p = Math.pow(10, Math.floor(Math.log10(Math.max(raw, 1e-9))));
        const m = raw / p;
        return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p;
    }
    function lineSVG(a) {
        const vals = guesses.map(g => g.v).concat([a]);
        let lo = Math.min(...vals), hi = Math.max(...vals);
        if (hi === lo) { lo = Math.max(0, lo - 10); hi = hi + 10; }
        const pad = (hi - lo) * 0.08;
        lo = Math.max(0, lo - pad); hi = hi + pad;
        const step = Math.max(1, niceStep(hi - lo));
        lo = Math.floor(lo / step) * step; hi = Math.ceil(hi / step) * step;
        const X = v => 40 + (v - lo) / (hi - lo) * 920;
        let s = `<svg class="est-line" viewBox="0 0 1000 120" preserveAspectRatio="none">`;
        s += `<line x1="30" y1="70" x2="970" y2="70" stroke="#334155" stroke-width="3"/>`;
        for (let v = lo; v <= hi + 1e-9; v += step) {
            const x = X(v);
            s += `<line x1="${x}" y1="64" x2="${x}" y2="76" stroke="#334155" stroke-width="2"/>`;
            s += `<text x="${x}" y="96" text-anchor="middle" font-size="15" fill="#475569" font-family="Segoe UI, sans-serif">${_estFmt(Math.round(v))}</text>`;
        }
        // Estimations (empilées si elles se touchent)
        const placed = [];
        guesses.slice().sort((p, q) => p.v - q.v).forEach(g => {
            const x = X(g.v);
            let lvl = 0;
            while (placed.some(pp => pp.lvl === lvl && Math.abs(pp.x - x) < 16)) lvl++;
            placed.push({ x, lvl });
            const y = 56 - lvl * 14;
            s += `<circle cx="${x}" cy="${y}" r="6" fill="#3b82f6" stroke="#fff" stroke-width="1.5"><title>${_estEsc(g.n ? g.n + ' : ' : '')}${g.v}</title></circle>`;
        });
        const xa = X(a);
        s += `<line x1="${xa}" y1="8" x2="${xa}" y2="78" stroke="#dc2626" stroke-width="3"/>`;
        s += `<polygon points="${xa - 8},6 ${xa + 8},6 ${xa},18" fill="#dc2626"/>`;
        s += `<text x="${xa}" y="116" text-anchor="middle" font-size="16" font-weight="800" fill="#dc2626" font-family="Segoe UI, sans-serif">${_estFmt(a)}</text>`;
        s += `</svg>`;
        return s;
    }

    function stopAnim() { if (animIv) { clearInterval(animIv); animIv = null; } }

    function renderResult(animate) {
        stopAnim();
        if (!revealed || !cur) { result.classList.remove('show'); result.innerHTML = ''; return; }
        const a = answer();
        let html = `<div class="est-answer"><span class="est-answer-lbl">La vraie réponse :</span>` +
            `<span class="est-answer-num">${animate ? '0' : _estFmt(a)}</span>` +
            `<span class="est-answer-lbl">${_estEsc(unitText())}</span></div>`;
        if (guesses.length) {
            html += lineSVG(a);
            const sorted = guesses.map(g => ({ g, d: Math.abs(g.v - a) })).sort((p, q) => p.d - q.d);
            const m = sorted[0].d;
            html += `<div class="est-rank">`;
            let rank = 0, prevD = -1;
            sorted.slice(0, 10).forEach((o, k) => {
                if (o.d !== prevD) { rank = k + 1; prevD = o.d; }
                const pct = a ? Math.round(o.d / a * 100) : 0;
                const medal = o.d === m ? '🏆' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank + 'ᵉ';
                const who = o.g.n ? _estEsc(o.g.n) + ' : ' : '';
                const sign = o.g.v > a ? 'trop' : o.g.v < a ? 'pas assez' : '';
                html += `<div class="est-rank-item${o.d === m ? ' best' : ''}"><span class="pos">${medal}</span>` +
                    `<span>${who}<b>${_estFmt(o.g.v)}</b></span>` +
                    `<span class="gap">${o.d === 0 ? '🎯 Pile la bonne réponse !' : `écart : ${_estFmt(o.d)} (${sign}, environ ${pct} %)`}${o.d && pct <= 10 ? ' ⭐ très bonne estimation' : ''}</span></div>`;
            });
            if (sorted.length > 10) html += `<div class="est-rank-item gap">… et ${sorted.length - 10} autres estimations.</div>`;
            html += `</div>`;
        } else {
            html += `<div style="text-align:center;font-size:14px;color:#475569">Aucune estimation notée : comparez avec les ardoises !</div>`;
        }
        if (showGroups && !cur.photo) {
            const t = Math.floor(a / 10), u = a % 10;
            html += `<div class="est-groups-txt">🧮 ${t} paquet${t > 1 ? 's' : ''} de 10` + (u ? ` et ${u} en plus` : '') + ` = ${_estFmt(a)}</div>`;
        }
        result.innerHTML = html;
        result.classList.add('show');
        if (animate) {
            const el = result.querySelector('.est-answer-num');
            const t0 = Date.now(), dur = 1300;
            animIv = setInterval(() => {
                const k = Math.min(1, (Date.now() - t0) / dur);
                const e = 1 - Math.pow(1 - k, 3);
                el.textContent = _estFmt(Math.round(a * e));
                if (k >= 1) stopAnim();
            }, 30);
        }
    }

    function renderControls() {
        badge.textContent = cur && cur.photo ? 'Ma photo' : EST_LEVELS[level].label;
        controls.querySelectorAll('.est-level-btn').forEach(b => b.classList.toggle('active', b.dataset.level === level));
        sceneSel.value = sceneChoice;
        limitSel.value = String(limit);
        photoBtn.classList.toggle('on', photoRow.classList.contains('show'));
        const synth = !!(cur && !cur.photo);
        repereBtn.disabled = !synth;
        repereBtn.classList.toggle('on', showRepere);
        groupsBtn.disabled = !synth || !revealed;
        groupsBtn.classList.toggle('on', showGroups);
        aidTxt.textContent = showRepere && repere ? `Repère : ${repere.n} ${unitText()} dans le cadre jaune. Combien de cadres pour toute l'image ?` : '';
        revealBtn.disabled = !cur || revealed;
        hideBtn.disabled = !revealed;
        clearBtn.disabled = !guesses.length;
        addBtn.disabled = !cur;
        questionEl.style.display = cur ? '' : 'none';
        questionEl.textContent = questionText();
    }

    function renderAll(animate) {
        renderControls();
        renderChips();
        renderResult(animate);
        renderCover();
        fitQuestion();
        requestAnimationFrame(draw);
    }

    function fitQuestion() {
        const w = stage.clientWidth;
        if (!w) return;
        questionEl.style.fontSize = Math.max(15, Math.min(34, w / 30)) + 'px';
    }

    // ── Estimations ───────────────────────────────────────────────────────
    function addGuess() {
        if (!cur) return;
        const v = parseInt(valInput.value, 10);
        if (!Number.isFinite(v) || v < 0 || v > 1000000) { valInput.focus(); return; }
        if (guesses.length >= 60) return;
        guesses.push({ n: nameInput.value.trim().slice(0, 30), v });
        valInput.value = '';
        nameInput.value = '';
        (nameInput.offsetParent ? nameInput : valInput).focus();
        renderControls();
        renderChips();
        if (revealed) renderResult(false);
        save();
    }

    // ── Révélation ────────────────────────────────────────────────────────
    function reveal() {
        if (!cur || revealed) return;
        revealed = true;
        hidden = false;
        stopCountdown();
        renderAll(true);
        save();
    }

    // ── Ma photo ──────────────────────────────────────────────────────────
    // L'image est réduite (1280 px max, JPEG) pour rester légère dans la sauvegarde du tableau
    function loadPhotoFile(file) {
        if (!file || !/^image\//.test(file.type)) return;
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                const max = 1280;
                const sc = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
                const c = document.createElement('canvas');
                c.width = Math.round(img.naturalWidth * sc);
                c.height = Math.round(img.naturalHeight * sc);
                c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
                try { pendingPhoto = c.toDataURL('image/jpeg', 0.78); } catch (e) { pendingPhoto = null; }
                photoName.textContent = file.name;
                if (!paInput.value) paInput.focus();
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    }
    function setPhoto(dataUrl, ans, q, keepRound) {
        photoImg = new Image();
        photoImg.onload = () => requestAnimationFrame(draw);
        photoImg.src = dataUrl;
        cur = { photo: true, img: dataUrl, answer: ans, q: q || '' };
        if (!keepRound) resetRound();
        buildItems();
    }
    function validatePhoto() {
        const ans = parseInt(paInput.value, 10);
        const img = pendingPhoto || (cur && cur.photo ? cur.img : null);
        if (!img) { photoName.textContent = '⚠️ Choisissez d\'abord une image'; return; }
        if (!Number.isFinite(ans) || ans < 1) { paInput.focus(); return; }
        setPhoto(img, ans, pqInput.value.trim().slice(0, 80));
        pendingPhoto = null;
        photoRow.classList.remove('show');
        renderAll();
        startDisplay();
        save();
    }

    // ── Clics ─────────────────────────────────────────────────────────────
    container.addEventListener('click', (e) => {
        const del = e.target.closest('[data-del]');
        if (del) {
            guesses.splice(parseInt(del.dataset.del, 10), 1);
            renderAll();
            save();
            return;
        }
        const b = e.target.closest('[data-act],[data-level]');
        if (!b || !container.contains(b)) return;
        if (b.dataset.level) {
            if (b.dataset.level === level && cur && !cur.photo) return;
            level = b.dataset.level;
            newImage();
            return;
        }
        switch (b.dataset.act) {
            case 'new':    newImage(); break;
            case 'photo':
                photoRow.classList.toggle('show');
                if (photoRow.classList.contains('show')) {
                    pendingPhoto = null;
                    photoName.textContent = cur && cur.photo ? 'Image actuelle' : 'Aucune image';
                    pqInput.value = cur && cur.photo ? cur.q : '';
                    paInput.value = cur && cur.photo ? cur.answer : '';
                }
                renderControls();
                break;
            case 'pick':         fileInput.click(); break;
            case 'photo-ok':     validatePhoto(); break;
            case 'photo-cancel': pendingPhoto = null; photoRow.classList.remove('show'); renderControls(); break;
            case 'peek':         startDisplay(); save(); break;
            case 'repere':       showRepere = !showRepere; renderAll(); save(); break;
            case 'groups':       showGroups = !showGroups; renderAll(); save(); break;
            case 'add':          addGuess(); break;
            case 'reveal':       reveal(); break;
            case 'hide':         revealed = false; showGroups = false; renderAll(); save(); break;
            case 'clear':        guesses = []; renderAll(); save(); break;
        }
    });

    sceneSel.addEventListener('change', () => { sceneChoice = EST_SCENES[sceneSel.value] ? sceneSel.value : ''; newImage(); });
    limitSel.addEventListener('change', () => {
        limit = parseInt(limitSel.value, 10) || 0;
        if (!limit) { stopCountdown(); hidden = false; renderCover(); }
        save();
    });
    fileInput.addEventListener('change', () => { loadPhotoFile(fileInput.files && fileInput.files[0]); fileInput.value = ''; });

    [nameInput, valInput, pqInput, paInput].forEach(inp => {
        inp.addEventListener('keydown', (e) => {
            e.stopPropagation();
            if (e.key === 'Enter') {
                if (inp === nameInput) valInput.focus();
                else if (inp === valInput) addGuess();
                else validatePhoto();
            }
        });
        inp.addEventListener('click', (e) => { e.stopPropagation(); inp.focus(); });
    });
    [sceneSel, limitSel].forEach(sel => sel.addEventListener('keydown', (e) => e.stopPropagation()));

    [stage, photoRow, aids, guessRow, revealRow, result, controls].forEach(el => {
        el.addEventListener('mousedown', (e) => e.stopPropagation());
        el.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
    });

    helpBtn.addEventListener('click', (e) => { e.stopPropagation(); helpPopup.classList.toggle('show'); });
    document.addEventListener('click', () => helpPopup.classList.remove('show'));

    // ── Redimensionnement libre (largeur + hauteur de l'image) ────────────
    function startResize(x0, y0) {
        const startW = container.offsetWidth, startH = stage.offsetHeight;
        return (x, y) => {
            container.style.width = Math.max(460, startW + x - x0) + 'px';
            stage.style.height    = Math.max(160, startH + y - y0) + 'px';
            fitQuestion();
            draw();
        };
    }
    resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const move = startResize(e.clientX, e.clientY);
        document.onmousemove = (ev) => move(ev.clientX, ev.clientY);
        document.onmouseup = () => { document.onmousemove = null; document.onmouseup = null; save(); };
    });
    resizeHandle.addEventListener('touchstart', (e) => {
        e.preventDefault(); e.stopPropagation();
        const t0 = e.touches[0];
        const move = startResize(t0.clientX, t0.clientY);
        function onMove(ev) { const t = ev.touches[0]; move(t.clientX, t.clientY); }
        function onEnd() {
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onEnd);
            save();
        }
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onEnd);
    }, { passive: false });

    function onWinResize() {
        if (!document.body.contains(widget)) { window.removeEventListener('resize', onWinResize); stopCountdown(); stopAnim(); return; }
        fitQuestion();
        draw();
    }
    window.addEventListener('resize', onWinResize);

    // ── Boutons fenêtre ───────────────────────────────────────────────────
    const wfMin   = header.querySelector('[data-role="wf-min"]');
    const wfMax   = header.querySelector('[data-role="wf-max"]');
    const wfClose = header.querySelector('[data-role="wf-close"]');
    let _savedW = null, _savedH = null;
    let _isMax = false;

    wfMin.addEventListener('click', (e) => {
        e.stopPropagation();
        if (_isMax) wfMax.click();
        if (typeof window._wfMiniBarCollapse === 'function') {
            window._wfMiniBarCollapse(widget, '🫙 Estimation', { onExpand: () => requestAnimationFrame(() => { fitQuestion(); draw(); }) });
        } else {
            container.classList.toggle('wf-minimized');
            requestAnimationFrame(() => { fitQuestion(); draw(); });
        }
    });

    wfMax.addEventListener('click', (e) => {
        e.stopPropagation();
        _isMax = !_isMax;
        if (_isMax) {
            _savedW = container.style.width;
            _savedH = stage.style.height;
            container.classList.add('wf-fullboard');
            stage.style.height = Math.round(window.innerHeight * 0.58) + 'px';
        } else {
            container.classList.remove('wf-fullboard');
            if (_savedW) container.style.width = _savedW;
            if (_savedH) stage.style.height = _savedH;
        }
        requestAnimationFrame(() => { fitQuestion(); draw(); });
        save();
    });

    wfClose.addEventListener('click', (e) => {
        e.stopPropagation();
        window.removeEventListener('resize', onWinResize);
        stopCountdown(); stopAnim();
        if (typeof snapshotNow === 'function') snapshotNow();
        widget.remove();
        if (typeof saveBoard === 'function') saveBoard();
    });

    // ── Init ──────────────────────────────────────────────────────────────
    widget.addEventListener('mousedown', (e) => {
        const tag = e.target.tagName;
        if (tag === 'INPUT' || tag === 'BUTTON' || tag === 'SELECT') return;
        bringToFront(widget);
        widget.focus();
        if (typeof positionActionBar === 'function') positionActionBar(widget);
    });

    board.appendChild(widget);
    if (typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);
    bringToFront(widget);
    makeDraggable(widget);
    makeDraggableRotate(widget);

    renderAll();

    // ── API pour save-load.js ─────────────────────────────────────────────
    let _restored = false, _autoMax = false;

    widget._estGetData = () => ({
        containerW: _isMax ? (parseFloat(_savedW) || container.offsetWidth) : container.offsetWidth,
        stageH:     _isMax ? (parseFloat(_savedH) || stage.offsetHeight)    : stage.offsetHeight,
        level, sceneChoice,
        cur: cur ? (cur.photo ? { photo: true, img: cur.img, answer: cur.answer, q: cur.q } : { scene: cur.scene, count: cur.count, seed: cur.seed }) : null,
        guesses: guesses.slice(),
        revealed, showRepere, showGroups,
        limit, hidden,
        fullboard: _isMax && !_autoMax
    });

    // Sur téléphone, ouverture directe en plein écran (bouton vert)
    if (_estIsPhone()) requestAnimationFrame(() => {
        if (!_restored && !_isMax) { _autoMax = true; wfMax.click(); }
    });

    widget._estSetData = (d) => {
        _restored = true;
        if (_autoMax && _isMax) wfMax.click();
        _autoMax = false;
        const toPhoneFull = () => {
            if (_estIsPhone() && !_isMax) { _autoMax = true; wfMax.click(); return true; }
            return false;
        };
        if (!d) { toPhoneFull(); return; }
        if (d.containerW) container.style.width = d.containerW + 'px';
        if (d.stageH)     stage.style.height    = d.stageH + 'px';
        level = EST_LEVELS[d.level] ? String(d.level) : '1';
        sceneChoice = EST_SCENES[d.sceneChoice] ? d.sceneChoice : '';
        limit = [0, 5, 10, 20].includes(d.limit) ? d.limit : 0;
        cur = null;
        const c = d.cur;
        if (c && c.photo && typeof c.img === 'string' && /^data:image\//.test(c.img) && c.answer > 0) {
            setPhoto(c.img, parseInt(c.answer, 10), c.q || '', true);
        } else if (c && EST_SCENES[c.scene] && c.count > 0 && c.count <= 2000) {
            cur = { scene: c.scene, count: parseInt(c.count, 10), seed: (c.seed >>> 0) };
            buildItems();
        }
        guesses = Array.isArray(d.guesses)
            ? d.guesses.filter(g => g && Number.isFinite(g.v)).slice(0, 60).map(g => ({ n: String(g.n || '').slice(0, 30), v: Math.round(g.v) }))
            : [];
        revealed = !!(d.revealed && cur);
        showRepere = !!(d.showRepere && cur && !cur.photo);
        showGroups = !!(d.showGroups && revealed && cur && !cur.photo);
        hidden = !!(d.hidden && cur && !revealed && limit);
        renderAll();
        if (!toPhoneFull() && d.fullboard && !_isMax) wfMax.click();
        setTimeout(() => { fitQuestion(); draw(); }, 250);
    };

    saveBoard();
    return widget;
}
