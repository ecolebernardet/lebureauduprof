// ══════════════════════════════════════════════════════════════════
//  widget-couleurs.js  —  Mélangeur de couleurs interactif (v2)
//  • Chaque goutte compte : 2 blanc + 1 noir ≠ 1 blanc + 1 noir
//  • Un clic sur une couleur = une goutte dans le pot choisi
//  • Glisser-déposer d'une couleur vers n'importe quel pot
// ══════════════════════════════════════════════════════════════════

// ── Couleurs de base (partagées) ─────────────────────────────────
// ryb = position dans le modèle « peinture » Rouge / Jaune / Bleu
const _CLR_BASE = {
    rouge: { hex: '#e3262f', label: 'rouge', ryb: [1, 0, 0] },
    jaune: { hex: '#ffd21f', label: 'jaune', ryb: [0, 1, 0] },
    bleu:  { hex: '#1f5fd1', label: 'bleu',  ryb: [0, 0, 1] },
    vert:  { hex: '#2f9e41', label: 'vert',  ryb: [0, 1, 1] },
    blanc: { hex: '#ffffff', label: 'blanc' },
    noir:  { hex: '#1b1b1b', label: 'noir'  },
};
const _CLR_ORDER    = ['rouge', 'jaune', 'bleu', 'vert', 'blanc', 'noir'];
const _CLR_MAX_DROPS = 12;          // gouttes max par pot
const _CLR_POT_NAMES = ['A', 'B', 'C'];

function _clrHexToRgb(hex) {
    return [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
}
function _clrRgbToHex(rgb) {
    return '#' + rgb.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}
function _clrLuma(rgb) {
    return (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
}

// Cube RYB → RGB (interpolation trilinéaire, façon mélange de peinture)
const _CLR_CUBE = {
    '000': [255, 255, 255],                 // rien = papier blanc
    '100': _clrHexToRgb(_CLR_BASE.rouge.hex),
    '010': _clrHexToRgb(_CLR_BASE.jaune.hex),
    '001': _clrHexToRgb(_CLR_BASE.bleu.hex),
    '110': [245, 130, 32],                  // orange
    '011': _clrHexToRgb(_CLR_BASE.vert.hex),
    '101': [122, 59, 156],                  // violet
    '111': [84, 52, 30],                    // marron
};
function _clrRybToRgb(r, y, b) {
    const out = [0, 0, 0];
    for (const cr of [0, 1]) for (const cy of [0, 1]) for (const cb of [0, 1]) {
        const w = (cr ? r : 1 - r) * (cy ? y : 1 - y) * (cb ? b : 1 - b);
        const c = _CLR_CUBE['' + cr + cy + cb];
        out[0] += w * c[0]; out[1] += w * c[1]; out[2] += w * c[2];
    }
    return out;
}

// ── Mélange : chaque goutte pèse le même poids ───────────────────
function _clrMix(drops) {
    const counts = {};
    drops.forEach(n => { if (_CLR_BASE[n]) counts[n] = (counts[n] || 0) + 1; });
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    if (!total) return null;

    const nW = counts.blanc || 0;
    const nK = counts.noir  || 0;
    const nC = total - nW - nK;

    let chromaRgb = null, ryb = null;
    if (nC > 0) {
        const s = [0, 0, 0];
        Object.entries(counts).forEach(([n, q]) => {
            const v = _CLR_BASE[n].ryb;
            if (v) { s[0] += v[0] * q; s[1] += v[1] * q; s[2] += v[2] * q; }
        });
        const mx = Math.max(...s);
        ryb = s.map(v => v / mx);             // un mélange de pigments ne s'éclaircit pas
        chromaRgb = _clrRybToRgb(...ryb);
    }

    const W = [255, 255, 255], K = _clrHexToRgb(_CLR_BASE.noir.hex);
    const rgb = [0, 1, 2].map(i =>
        ((chromaRgb ? chromaRgb[i] * nC : 0) + W[i] * nW + K[i] * nK) / total);

    const mix = { rgb, hex: _clrRgbToHex(rgb), counts, total, nW, nK, nC, ryb,
                  w: nW / total, k: nK / total, c: nC / total };
    mix.name = _clrName(mix);
    mix.desc = _clrDescribe(mix);
    return mix;
}

// ── Famille de teinte à partir du vecteur RYB ─────────────────────
function _clrFamily(ryb) {
    if (Math.min(...ryb) >= 0.6) return 'marron';
    const [r, y, b] = ryb;
    const a = Math.PI * 2 / 3;
    const x = r + y * Math.cos(a) + b * Math.cos(2 * a);
    const z = y * Math.sin(a) + b * Math.sin(2 * a);
    const h = (Math.atan2(z, x) * 180 / Math.PI + 360) % 360;
    if (h < 15 || h >= 345) return 'rouge';
    if (h < 45)  return 'rougeOrange';
    if (h < 78)  return 'orange';
    if (h < 102) return 'jauneOrange';
    if (h < 138) return 'jaune';
    if (h < 162) return 'vertJaune';
    if (h < 198) return 'vert';
    if (h < 225) return 'turquoise';
    if (h < 255) return 'bleu';
    if (h < 285) return 'indigo';
    if (h < 318) return 'violet';
    return 'framboise';
}

//                 nom            très clair        clair            foncé              très foncé
const _CLR_NAMES = {
    rouge:       ['Rouge',        'Rose pâle',      'Rose',          'Bordeaux',        'Bordeaux très foncé'],
    rougeOrange: ['Rouge orangé', 'Rose saumon',    'Corail',        'Brique',          'Brun rouge'],
    orange:      ['Orange',       'Pêche',          'Abricot',       'Marron',          'Marron très foncé'],
    jauneOrange: ['Jaune orangé', 'Crème',          'Jaune doré',    'Ocre',            'Brun ocre'],
    jaune:       ['Jaune',        'Jaune très pâle','Jaune pâle',    'Kaki',            'Kaki très foncé'],
    vertJaune:   ['Vert pomme',   'Vert très tendre','Vert tendre',  'Vert olive',      'Olive très foncé'],
    vert:        ['Vert',         "Vert d'eau",     'Vert clair',    'Vert sapin',      'Vert très foncé'],
    turquoise:   ['Turquoise',    'Turquoise pâle', 'Turquoise clair','Bleu canard',    'Bleu canard foncé'],
    bleu:        ['Bleu',         'Bleu pâle',      'Bleu ciel',     'Bleu marine',     'Bleu nuit'],
    indigo:      ['Indigo',       'Pervenche pâle', 'Pervenche',     'Indigo foncé',    'Bleu nuit'],
    violet:      ['Violet',       'Lavande',        'Mauve',         'Aubergine',       'Aubergine très foncé'],
    framboise:   ['Framboise',    'Rose dragée',    'Rose bonbon',   'Prune',           'Prune très foncé'],
    marron:      ['Marron',       'Beige',          'Caramel',       'Chocolat',        'Chocolat très foncé'],
};

function _clrName(m) {
    // Seulement du blanc et/ou du noir → nuances de gris
    if (!m.nC) {
        if (!m.nK) return 'Blanc';
        if (!m.nW) return 'Noir';
        const p = m.nW / (m.nW + m.nK);
        if (p >= 0.8)  return 'Gris très clair';
        if (p >= 0.6)  return 'Gris clair';
        if (p > 0.4)   return 'Gris';
        if (p > 0.2)   return 'Gris foncé';
        return 'Gris très foncé';
    }
    const fam = _clrFamily(m.ryb);
    const names = _CLR_NAMES[fam];
    // Blanc et noir en quantité → couleur grisée
    if (m.w >= 0.2 && m.k >= 0.2) {
        const d = m.w - m.k;
        const base = d >= 0.15 ? names[2] : d <= -0.15 ? names[3] : names[0];
        return base + ' grisé';
    }
    const t = m.w - m.k;
    if (t >= 0.6)   return names[1];
    if (t >= 0.25)  return names[2];
    if (t <= -0.6)  return names[4];
    if (t <= -0.25) return names[3];
    return names[0];
}

function _clrDescribe(m) {
    const has = n => (m.counts[n] || 0) > 0;
    const chroma = ['rouge', 'jaune', 'bleu', 'vert'].filter(has);
    const parts = [];

    if (!m.nC) {
        if (m.nW && m.nK) parts.push('Blanc et noir donnent du gris. Plus il y a de blanc, plus le gris est clair.');
        else parts.push(`Du ${m.nW ? 'blanc' : 'noir'} tout seul. Ajoute une autre couleur pour voir ce qui change.`);
        return parts.join(' ');
    }

    const set = chroma.slice().sort().join('+');
    const FACTS = {
        'jaune+rouge': 'Rouge et jaune donnent de l’orange.',
        'bleu+jaune':  'Bleu et jaune donnent du vert.',
        'bleu+rouge':  'Rouge et bleu donnent du violet.',
        'bleu+jaune+rouge': 'Les trois couleurs primaires ensemble donnent du marron.',
        'rouge+vert':  'Rouge et vert sont complémentaires : ensemble, ils donnent du marron.',
        'jaune+vert':  'Jaune et vert donnent un vert plus lumineux.',
        'bleu+vert':   'Bleu et vert donnent un bleu-vert.',
    };
    if (chroma.length === 1 && !m.nW && !m.nK) {
        parts.push(`Du ${chroma[0]} pur. Ajoute une autre couleur pour voir ce qui se passe.`);
    } else if (FACTS[set]) {
        parts.push(FACTS[set]);
    } else if (chroma.length >= 3) {
        parts.push('Beaucoup de couleurs mélangées : le résultat devient terne, vers le marron.');
    }

    if (chroma.length >= 2) {
        const qs = chroma.map(n => m.counts[n]);
        const top = Math.max(...qs);
        const tops = chroma.filter(n => m.counts[n] === top);
        if (tops.length === 1) parts.push(`Il y a plus de ${tops[0]} : le mélange tire vers le ${tops[0]}.`);
    }
    if (m.nW && m.nK) parts.push('Le blanc et le noir ensemble rendent la couleur plus grise.');
    else if (m.nW) parts.push('Le blanc éclaircit la couleur.');
    else if (m.nK) parts.push('Le noir assombrit la couleur.');
    return parts.join(' ');
}

function _clrRecipeText(counts) {
    const items = _CLR_ORDER.filter(n => counts[n]).map(n =>
        `${counts[n]} goutte${counts[n] > 1 ? 's' : ''} de ${_CLR_BASE[n].label}`);
    if (items.length <= 1) return items.join('');
    return items.slice(0, -1).join(', ') + ' et ' + items[items.length - 1];
}

// ══════════════════════════════════════════════════════════════════
//  Création du widget
// ══════════════════════════════════════════════════════════════════
function createCouleursWidget() {

    // ── Police (une seule fois) ───────────────────────────────────
    if (!document.getElementById('clr-font')) {
        const l = document.createElement('link');
        l.id = 'clr-font';
        l.rel = 'stylesheet';
        l.href = 'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&display=swap';
        document.head.appendChild(l);
    }

    // ── CSS ───────────────────────────────────────────────────────
    const _existingStyle = document.getElementById('clr-style');
    if (_existingStyle) _existingStyle.remove();
    {
        const s = document.createElement('style');
        s.id = 'clr-style';
        s.textContent = `
        .widget[data-type="couleurs"] { cursor: move; overflow: visible !important; }
        .widget[data-type="couleurs"] button { cursor: pointer; }
        .widget[data-type="couleurs"] .custom-resize-handle { cursor: se-resize; }
        .widget[data-type="couleurs"] .drag-handle { cursor: move; }

        .clr-ec { overflow: visible !important; display: flex; flex-direction: column; height: auto !important; }

        /* ── Jetons de couleur ── */
        .clr-container {
            --clr-bg: #1c1e2b;
            --clr-surface: #252838;
            --clr-well: #151722;
            --clr-line: #353950;
            --clr-text: #eceaf4;
            --clr-muted: #9b9db5;
            --clr-focus: #ffd21f;
            --clr-danger: #ff8a80;
            --clr-ok: #6ee7a8;
            font-family: 'Fredoka', 'Nunito', 'Trebuchet MS', system-ui, sans-serif;
            display: flex; flex-direction: column;
            background: var(--clr-bg);
            color: var(--clr-text);
            border-radius: 18px;
            border: 1px solid var(--clr-line);
            box-shadow: 0 10px 34px rgba(0,0,0,.4);
            font-size: 15px;
            min-width: 320px; width: 100%;
            box-sizing: border-box;
            overflow: hidden;
            position: relative;
        }
        .clr-container *, .clr-container *::before, .clr-container *::after { box-sizing: border-box; }
        .clr-container button { font-family: inherit; }
        .clr-container button:focus-visible { outline: 3px solid var(--clr-focus); outline-offset: 3px; }

        body.menu-light .clr-container {
            --clr-bg: #f3f4f9;
            --clr-surface: #ffffff;
            --clr-well: #dde0ea;
            --clr-line: #d6d9e6;
            --clr-text: #23253a;
            --clr-muted: #676a85;
            --clr-focus: #1f5fd1;
            --clr-danger: #c62828;
            --clr-ok: #1b8a54;
            box-shadow: 0 10px 30px rgba(35,37,58,.14);
        }

        /* ── En-tête ── */
        .clr-header {
            display: flex; align-items: center; gap: .6em;
            padding: .6em .9em;
            background: var(--clr-surface);
            border-bottom: 1px solid var(--clr-line);
            cursor: move; user-select: none; flex-shrink: 0;
        }
        .clr-title { font-size: 1em; font-weight: 600; letter-spacing: .01em; display: flex; align-items: center; gap: .45em; }
        .clr-title-dots { display: inline-flex; }
        .clr-title-dots i { width: .7em; height: .7em; border-radius: 50%; margin-left: -.22em; border: 2px solid var(--clr-surface); }
        .clr-title-dots i:first-child { margin-left: 0; }
        .clr-help-btn {
            background: transparent; border: 1.5px solid var(--clr-line);
            color: var(--clr-muted); font-size: .8em; font-weight: 600;
            width: 1.7em; height: 1.7em; border-radius: 50%;
            display: flex; align-items: center; justify-content: center; padding: 0;
        }
        .clr-help-btn:hover { color: var(--clr-text); border-color: var(--clr-muted); }

        .clr-help-popup {
            display: none; position: absolute; top: 3.2em; right: .8em; width: min(360px, calc(100% - 1.6em));
            background: var(--clr-surface); border: 1px solid var(--clr-line); border-radius: 14px;
            padding: .9em 1.1em; z-index: 200; box-shadow: 0 10px 30px rgba(0,0,0,.35);
            font-size: .88em; line-height: 1.5;
        }
        .clr-help-popup.clr-help-show { display: block; }
        .clr-help-popup h4 { margin: 0 0 .4em; font-size: 1.05em; font-weight: 600; }
        .clr-help-popup ol { margin: 0; padding-left: 1.2em; }
        .clr-help-popup li { margin-bottom: .35em; }
        .clr-help-popup p { margin: .5em 0 0; color: var(--clr-muted); }

        /* ── Corps ── */
        .clr-body { display: flex; flex-direction: column; gap: 1.1em; padding: 1.1em 1.1em 1.2em; }

        /* ── Palette : pâtés de peinture ── */
        .clr-palette {
            display: flex; flex-wrap: wrap; justify-content: center; gap: .5em 1em;
            padding: .8em .6em .5em;
            background: var(--clr-well);
            border-radius: 22px;
        }
        .clr-paint {
            background: none; border: none; padding: .2em;
            display: flex; flex-direction: column; align-items: center; gap: .3em;
            color: var(--clr-text); font-size: .9em; font-weight: 500;
            touch-action: none; user-select: none; -webkit-user-select: none;
        }
        .clr-blob {
            width: 58px; height: 52px;
            background: var(--c);
            border-radius: 52% 48% 46% 54% / 58% 52% 48% 42%;
            box-shadow: inset -5px -7px 0 rgba(0,0,0,.14), inset 6px 6px 0 rgba(255,255,255,.28), 0 3px 0 rgba(0,0,0,.25);
            transition: transform .15s ease;
            position: relative;
        }
        .clr-paint:nth-child(2) .clr-blob { border-radius: 46% 54% 52% 48% / 50% 58% 42% 50%; }
        .clr-paint:nth-child(3) .clr-blob { border-radius: 55% 45% 50% 50% / 45% 55% 50% 55%; }
        .clr-paint:nth-child(4) .clr-blob { border-radius: 48% 52% 58% 42% / 55% 45% 55% 45%; }
        .clr-paint:nth-child(5) .clr-blob { border-radius: 50% 50% 44% 56% / 52% 48% 56% 44%; box-shadow: inset -5px -7px 0 rgba(0,0,0,.08), 0 0 0 1.5px var(--clr-line), 0 3px 0 rgba(0,0,0,.2); }
        .clr-paint:nth-child(6) .clr-blob { border-radius: 56% 44% 48% 52% / 46% 54% 46% 54%; box-shadow: inset 6px 6px 0 rgba(255,255,255,.12), 0 0 0 1.5px var(--clr-line), 0 3px 0 rgba(0,0,0,.25); }
        .clr-paint:hover .clr-blob { transform: translateY(-3px) scale(1.06); }
        .clr-paint:active .clr-blob { transform: scale(.94); }
        .clr-hint {
            text-align: center; font-size: .85em; color: var(--clr-muted); margin-top: -.4em;
        }
        .clr-hint b { color: var(--clr-text); font-weight: 600; }

        /* ── Atelier : pots + résultat ── */
        .clr-workshop { display: flex; align-items: stretch; gap: 1em; flex-wrap: wrap; }
        .clr-pots { display: flex; gap: .7em; flex: 3 1 330px; justify-content: space-around; }
        .clr-pot { display: flex; flex-direction: column; align-items: center; gap: .45em; flex: 1; min-width: 92px; }

        .clr-jar {
            position: relative; width: 96px; height: 116px;
            padding: 0; border: none; background: transparent;
            display: block;
        }
        .clr-jar-glass {
            position: absolute; left: 6px; right: 6px; top: 14px; bottom: 0;
            border: 3px solid var(--clr-line);
            border-top: none;
            border-radius: 6px 6px 26px 26px;
            background: var(--clr-well);
            overflow: hidden;
            transition: border-color .2s;
        }
        .clr-jar::before { /* col du pot */
            content: ''; position: absolute; left: 0; right: 0; top: 6px; height: 10px;
            border: 3px solid var(--clr-line); border-radius: 6px; background: var(--clr-surface);
            z-index: 1; transition: border-color .2s;
        }
        .clr-jar-liquid {
            position: absolute; left: 0; right: 0; bottom: 0;
            height: 0%;
            background: var(--liq, transparent);
            transition: height .35s cubic-bezier(.3,1.4,.5,1), background-color .35s ease;
        }
        .clr-jar-liquid::before { /* surface du liquide */
            content: ''; position: absolute; left: -2px; right: -2px; top: -5px; height: 10px;
            border-radius: 50%; background: var(--liq, transparent);
            filter: brightness(1.12);
        }
        .clr-jar-empty {
            position: absolute; inset: 14px 6px 0; display: flex; align-items: center; justify-content: center;
            font-size: .8em; color: var(--clr-muted); pointer-events: none; text-align: center; line-height: 1.2;
        }
        .clr-jar-count {
            position: absolute; right: -4px; bottom: -6px; z-index: 2;
            min-width: 1.7em; height: 1.7em; padding: 0 .35em;
            border-radius: 1em; background: var(--clr-surface); border: 1.5px solid var(--clr-line);
            font-size: .78em; font-weight: 600; color: var(--clr-text);
            display: none; align-items: center; justify-content: center;
        }
        .clr-pot.clr-has .clr-jar-count { display: flex; }
        .clr-pot.clr-has .clr-jar-empty { display: none; }

        .clr-pot-label { font-size: .9em; font-weight: 500; color: var(--clr-muted); display: flex; align-items: center; gap: .3em; min-height: 1.4em; }
        .clr-pot.clr-active .clr-jar-glass,
        .clr-pot.clr-active .clr-jar::before { border-color: var(--clr-focus); }
        .clr-pot.clr-active .clr-pot-label { color: var(--clr-text); }
        .clr-pot.clr-active .clr-pot-label::before { content: '▲'; font-size: .7em; color: var(--clr-focus); }
        .clr-pot.clr-drop-target .clr-jar { transform: scale(1.07); }
        .clr-pot.clr-drop-target .clr-jar-glass,
        .clr-pot.clr-drop-target .clr-jar::before { border-color: var(--clr-focus); }
        .clr-jar { transition: transform .15s ease; }
        .clr-jar.clr-splash { animation: clr-splash .35s ease; }
        @keyframes clr-splash { 0% { transform: scale(1); } 40% { transform: scale(1.08, .94); } 100% { transform: scale(1); } }

        .clr-drops { display: flex; flex-wrap: wrap; justify-content: center; gap: 4px; max-width: 110px; min-height: 18px; }
        .clr-drop-dot {
            width: 16px; height: 16px; padding: 0; border-radius: 50%;
            border: 1.5px solid rgba(128,128,150,.55);
            transition: transform .12s;
        }
        .clr-drop-dot:hover { transform: scale(1.25); border-color: var(--clr-danger); }
        .clr-pot-empty-btn {
            font-size: .8em; font-weight: 500; color: var(--clr-danger);
            background: transparent; border: none; padding: .15em .4em; border-radius: .5em;
            visibility: hidden;
        }
        .clr-pot.clr-has .clr-pot-empty-btn { visibility: visible; }
        .clr-pot-empty-btn:hover { text-decoration: underline; }

        .clr-equals {
            align-self: center; font-size: 2em; font-weight: 600; color: var(--clr-muted);
            flex: 0 0 auto;
        }

        /* ── Résultat ── */
        .clr-result {
            flex: 2 1 210px;
            display: flex; flex-direction: column; align-items: center; gap: .55em;
            background: var(--clr-surface); border: 1px solid var(--clr-line);
            border-radius: 20px; padding: .9em .9em 1em;
            text-align: center;
        }
        .clr-splat-wrap { position: relative; width: 150px; height: 150px; display: flex; align-items: center; justify-content: center; }
        .clr-splat {
            width: 150px; height: 150px;
            background: var(--clr-well);
            border-radius: 58% 42% 55% 45% / 48% 55% 45% 52%;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            transition: background-color .45s ease, border-radius .6s ease, box-shadow .45s ease;
            box-shadow: inset -8px -10px 0 rgba(0,0,0,.12), inset 10px 10px 0 rgba(255,255,255,.14);
            color: var(--clr-muted);
            font-size: 2.2em; font-weight: 600;
        }
        .clr-splat.clr-alt { border-radius: 45% 55% 42% 58% / 55% 45% 55% 45%; }
        .clr-splat.clr-light-edge { box-shadow: inset -8px -10px 0 rgba(0,0,0,.07), 0 0 0 1.5px var(--clr-line); }
        .clr-result-name { font-size: 1.35em; font-weight: 600; line-height: 1.15; min-height: 1.15em; }
        .clr-result-hex { font-size: .8em; color: var(--clr-muted); letter-spacing: .03em; margin-top: -.35em; }

        .clr-recipe-bar {
            display: flex; width: 100%; height: 22px; border-radius: 11px; overflow: hidden;
            background: var(--clr-well); border: 1.5px solid var(--clr-line);
        }
        .clr-recipe-bar span {
            display: flex; align-items: center; justify-content: center;
            font-size: .72em; font-weight: 600; min-width: 0; overflow: hidden;
            transition: flex-grow .35s ease;
        }
        .clr-recipe-bar span + span { box-shadow: inset 1.5px 0 0 var(--clr-surface); }
        .clr-recipe-text { font-size: .82em; color: var(--clr-muted); line-height: 1.35; }
        .clr-result-desc { font-size: .9em; line-height: 1.45; max-width: 34ch; }

        .clr-compare {
            display: none; align-items: center; gap: .45em;
            font-size: .82em; color: var(--clr-muted);
            background: var(--clr-well); border-radius: 1em; padding: .25em .7em .25em .35em;
        }
        .clr-compare.clr-show { display: inline-flex; }
        .clr-compare i { width: 1.2em; height: 1.2em; border-radius: 50%; border: 1.5px solid var(--clr-line); flex-shrink: 0; }
        .clr-compare b { color: var(--clr-text); font-weight: 600; }

        /* ── Actions ── */
        .clr-actions { display: flex; gap: .6em; justify-content: center; flex-wrap: wrap; }
        .clr-btn {
            font-size: .92em; font-weight: 500;
            border-radius: 2em; padding: .45em 1.1em;
            border: 1.5px solid var(--clr-line); background: var(--clr-surface); color: var(--clr-text);
            transition: transform .12s, border-color .15s;
        }
        .clr-btn:hover { border-color: var(--clr-muted); }
        .clr-btn:active { transform: scale(.95); }
        .clr-btn-save { background: var(--clr-text); color: var(--clr-bg); border-color: var(--clr-text); }
        .clr-btn-save:hover { opacity: .88; border-color: var(--clr-text); }
        .clr-btn:disabled { opacity: .4; pointer-events: none; }

        /* ── Mes couleurs ── */
        .clr-saved { display: flex; flex-direction: column; gap: .5em; border-top: 1px dashed var(--clr-line); padding-top: .9em; }
        .clr-saved-title { font-size: .92em; font-weight: 600; }
        .clr-saved-row { display: flex; flex-wrap: wrap; gap: .45em; align-items: center; }
        .clr-chip {
            display: inline-flex; align-items: center; gap: .4em;
            border-radius: 2em; padding: .25em .35em .25em .3em;
            border: 1.5px solid var(--clr-line); background: var(--clr-surface); color: var(--clr-text);
            font-size: .85em; font-weight: 500;
            transition: border-color .15s, transform .12s;
        }
        .clr-chip:hover { border-color: var(--clr-muted); }
        .clr-chip:active { transform: scale(.96); }
        .clr-chip-dot { width: 1.3em; height: 1.3em; border-radius: 50%; border: 1.5px solid rgba(128,128,150,.45); flex-shrink: 0; }
        .clr-chip-del {
            width: 1.4em; height: 1.4em; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;
            color: var(--clr-muted); font-size: .95em; line-height: 1;
        }
        .clr-chip-del:hover { background: var(--clr-well); color: var(--clr-danger); }
        .clr-saved-empty { font-size: .85em; color: var(--clr-muted); }

        /* ── Toast ── */
        .clr-toast {
            position: absolute; bottom: 1em; left: 50%; transform: translate(-50%, 8px);
            background: var(--clr-text); color: var(--clr-bg);
            font-size: .85em; font-weight: 500;
            padding: .45em 1.1em; border-radius: 2em;
            pointer-events: none; opacity: 0; transition: opacity .25s, transform .25s;
            z-index: 100; white-space: nowrap;
        }
        .clr-toast.clr-toast-show { opacity: 1; transform: translate(-50%, 0); }

        /* ── Goutte volante / glissée (ajoutée au body) ── */
        .clr-flying-drop {
            position: fixed; z-index: 100000; pointer-events: none;
            width: 26px; height: 26px; margin: -13px 0 0 -13px;
            border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
            border: 2px solid rgba(255,255,255,.8);
            box-shadow: 0 4px 12px rgba(0,0,0,.35);
        }
        .clr-flying-drop.clr-dragged { width: 40px; height: 40px; margin: -20px 0 0 -20px; }

        /* ── Plein écran ── */
        .clr-container.clr-fullboard {
            position: fixed !important; inset: 0 !important;
            width: 100% !important; height: 100% !important;
            z-index: 9999 !important; border-radius: 0 !important;
            font-size: 18px !important;
            overflow-y: auto !important;
        }
        .clr-container.clr-fullboard .clr-body { width: min(1100px, 94vw); margin: 0 auto; }
        .clr-container.clr-fullboard .clr-blob { width: 76px; height: 68px; }
        .clr-container.clr-fullboard .clr-jar { width: 120px; height: 146px; }
        .clr-container.clr-fullboard .clr-splat-wrap,
        .clr-container.clr-fullboard .clr-splat { width: 200px; height: 200px; }

        @media (prefers-reduced-motion: reduce) {
            .clr-container *, .clr-container *::before { transition: none !important; animation: none !important; }
        }
        `;
        document.head.appendChild(s);
    }

    // ── Widget DOM ───────────────────────────────────────────────
    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'couleurs';
    widget.dataset.transparent = 'true';
    widget.tabIndex = 0;

    const p = (typeof findFreePosition === 'function') ? findFreePosition() : { x: 100, y: 100 };
    const initW = 720;
    widget.style.cssText = `left:100px; top:${p.y}px; overflow:visible;`;

    widget.addEventListener('mousedown', () => {
        if (typeof isDrawMode   !== 'undefined' && isDrawMode)   return;
        if (typeof isEraserMode !== 'undefined' && isEraserMode) return;
        if (widget.dataset.background !== 'true' && typeof bringToFront === 'function') bringToFront(widget);
    });

    widget.innerHTML = `
        <div class="drag-handle" title="Déplacer">✥</div>
        <div class="widget-rotate-handle" title="Faire pivoter">↻</div>
        <div class="widget-action-bar">
            <div class="widget-menu-handle"  onclick="toggleCtxMenu(this.closest('.widget,.shape-widget'))" title="Menu">☰</div>
            <div class="widget-pin-handle"   onclick="togglePin(this.closest('.widget,.shape-widget'))"    title="Épingler">📌</div>
            <div class="widget-back-handle"  onclick="sendToBack(this.closest('.widget,.shape-widget'))"   title="Envoyer derrière">🔽</div>
            <div class="widget-close-handle" onclick="(function(w){snapshotNow();closeCtxMenuAll();w.remove();saveBoard();})(this.closest('.widget'))" title="Fermer">×</div>
        </div>
        <div class="widget-ctx-menu"></div>`;

    const ec = document.createElement('div');
    ec.className = 'clr-ec';
    ec.style.overflow = 'visible';

    const paletteHTML = _CLR_ORDER.map(n => {
        const lbl = _CLR_BASE[n].label;
        const cap = lbl.charAt(0).toUpperCase() + lbl.slice(1);
        return `<button class="clr-paint" data-color="${n}" title="${cap} : clique pour verser une goutte, ou fais glisser vers un pot">
                    <span class="clr-blob" style="--c:${_CLR_BASE[n].hex}"></span>${cap}
                </button>`;
    }).join('');

    const potsHTML = _CLR_POT_NAMES.map((L, i) => `
        <div class="clr-pot${i === 0 ? ' clr-active' : ''}" data-pot="${i}">
            <button class="clr-jar" data-pot="${i}" title="Choisir le pot ${L}" aria-label="Pot ${L}">
                <span class="clr-jar-glass"><span class="clr-jar-liquid"></span></span>
                <span class="clr-jar-empty">vide</span>
                <span class="clr-jar-count">0</span>
            </button>
            <div class="clr-pot-label">Pot ${L}</div>
            <div class="clr-drops"></div>
            <button class="clr-pot-empty-btn" data-clear="${i}">Vider</button>
        </div>`).join('');

    ec.innerHTML = `
        <div class="clr-container" style="width:${initW}px;">
            <div class="clr-header">
                <span class="clr-title">
                    <span class="clr-title-dots"><i style="background:${_CLR_BASE.rouge.hex}"></i><i style="background:${_CLR_BASE.jaune.hex}"></i><i style="background:${_CLR_BASE.bleu.hex}"></i></span>
                    Mélange de couleurs
                </span>
                <div class="wf-btns" style="margin-left:auto">
                    <button class="clr-help-btn" title="Comment ça marche ?">?</button>
                    <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
                    <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran board"></button>
                    <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
                </div>
            </div>
            <div class="clr-help-popup">
                <h4>Comment ça marche ?</h4>
                <ol>
                    <li>Touche un pot pour le choisir (il est entouré).</li>
                    <li>Touche une couleur : une goutte tombe dans ce pot. Tu peux aussi faire glisser une couleur vers n'importe quel pot.</li>
                    <li>Le grand mélange à droite réunit toutes les gouttes des trois pots. Chaque goutte compte : plus il y en a d'une couleur, plus elle domine.</li>
                </ol>
                <p>Touche une petite goutte sous un pot pour l'enlever. « Garder » range la couleur dans Mes couleurs ; touche-la plus tard pour retrouver sa recette.</p>
            </div>
            <div class="clr-body">
                <div class="clr-palette">${paletteHTML}</div>
                <div class="clr-hint"></div>

                <div class="clr-workshop">
                    <div class="clr-pots">${potsHTML}</div>
                    <div class="clr-equals" aria-hidden="true">=</div>
                    <div class="clr-result" aria-live="polite">
                        <div class="clr-splat-wrap"><div class="clr-splat">?</div></div>
                        <div class="clr-result-name"></div>
                        <div class="clr-result-hex"></div>
                        <div class="clr-recipe-bar"></div>
                        <div class="clr-recipe-text"></div>
                        <div class="clr-compare"></div>
                        <div class="clr-result-desc"></div>
                    </div>
                </div>

                <div class="clr-actions">
                    <button class="clr-btn clr-btn-reset">Vider les trois pots</button>
                    <button class="clr-btn clr-btn-save">Garder cette couleur</button>
                </div>

                <div class="clr-saved">
                    <div class="clr-saved-title">Mes couleurs</div>
                    <div class="clr-saved-row"></div>
                </div>
            </div>
            <div class="clr-toast"></div>
        </div>`;

    widget.appendChild(ec);

    const board = document.getElementById('board');
    board.appendChild(widget);

    if (typeof bringToFront          === 'function') bringToFront(widget);
    if (typeof makeDraggable         === 'function') makeDraggable(widget);
    if (typeof makeDraggableRotate   === 'function') makeDraggableRotate(widget);
    _clrMakeResizable(widget);
    if (typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);

    // ── CSS wf-btns (si pas déjà présent) ────────────────────────
    if (!document.getElementById('wf-btns-style')) {
        const ws = document.createElement('style');
        ws.id = 'wf-btns-style';
        ws.textContent = `
    .wf-btns { display:flex; gap:5px; align-items:center; flex-shrink:0; }
    .wf-btn { width:13px; height:13px; border-radius:50%; border:none; cursor:pointer;
              display:flex; align-items:center; justify-content:center; padding:0; font-size:0; flex-shrink:0; }
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

    // ── Déplacement par l'en-tête ────────────────────────────────
    const clrHeader = widget.querySelector('.clr-header');
    if (clrHeader && typeof startWidgetDrag === 'function') {
        clrHeader.addEventListener('mousedown', (e) => {
            if (e.target.closest('button')) return;
            e.stopPropagation(); widget.focus();
            startWidgetDrag(e, widget);
        });
        clrHeader.addEventListener('touchstart', (e) => {
            if (e.target.closest('button')) return;
            e.stopPropagation();
            startWidgetDrag({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY, target: e.target }, widget);
        }, { passive: false });
    }

    // ── Boutons fenêtre ──────────────────────────────────────────
    const wfMin   = widget.querySelector('[data-role="wf-min"]');
    const wfMax   = widget.querySelector('[data-role="wf-max"]');
    const wfClose = widget.querySelector('[data-role="wf-close"]');
    const cont    = widget.querySelector('.clr-container');
    let _isMax = false, _savedW = '';

    function setFullboard(on) {
        _isMax = !!on;
        if (_isMax) {
            _savedW = cont.style.width;
            cont.classList.add('clr-fullboard');
        } else {
            cont.classList.remove('clr-fullboard');
            if (_savedW) cont.style.width = _savedW;
        }
    }
    widget._clrSetFullboard = setFullboard;

    if (wfMin) {
        wfMin.addEventListener('click', (e) => {
            e.stopPropagation();
            if (_isMax) setFullboard(false);
            if (typeof window._wfMiniBarCollapse === 'function') {
                ec.style.display = 'none';
                window._wfMiniBarCollapse(widget, '🎨 Couleurs', {
                    onExpand: () => { ec.style.display = ''; }
                });
            }
        });
    }
    if (wfMax) {
        wfMax.addEventListener('click', (e) => {
            e.stopPropagation();
            setFullboard(!_isMax);
            if (typeof saveBoard === 'function') saveBoard();
        });
    }
    if (wfClose) {
        wfClose.addEventListener('click', (e) => {
            e.stopPropagation();
            if (typeof snapshotNow === 'function') snapshotNow();
            widget.remove();
            if (typeof saveBoard === 'function') saveBoard();
        });
    }

    // ── Aide ─────────────────────────────────────────────────────
    const helpBtn   = widget.querySelector('.clr-help-btn');
    const helpPopup = widget.querySelector('.clr-help-popup');
    if (helpBtn && helpPopup) {
        helpBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            helpPopup.classList.toggle('clr-help-show');
        });
        helpPopup.addEventListener('click', (e) => e.stopPropagation());
        document.addEventListener('click', () => helpPopup.classList.remove('clr-help-show'));
    }

    // ── Touche Suppr ─────────────────────────────────────────────
    widget.addEventListener('keydown', (e) => {
        if (e.key !== 'Delete' && e.key !== 'Backspace') return;
        if (e.target !== widget) return;          // pas quand un bouton interne a le focus
        const tag = document.activeElement?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        if (document.activeElement?.isContentEditable) return;
        e.preventDefault(); e.stopPropagation();
        if (typeof snapshotNow === 'function') snapshotNow();
        widget.remove();
        if (typeof saveBoard === 'function') saveBoard();
    });

    _initCouleursWidget(widget);

    if (typeof saveBoard === 'function' && !window.isInitialLoading && !window.isRestoringState) saveBoard();
    return widget;
}

// ══════════════════════════════════════════════════════════════════
//  Poignée de redimensionnement pour .clr-container
// ══════════════════════════════════════════════════════════════════
function _clrMakeResizable(elmnt) {
    if (elmnt.querySelector('.custom-resize-handle')) return;
    const container = elmnt.querySelector('.clr-container');
    if (!container) return;

    const handle = document.createElement('div');
    handle.className = 'custom-resize-handle';
    handle.title = 'Redimensionner';
    if (getComputedStyle(elmnt).position === 'static') elmnt.style.position = 'relative';
    elmnt.appendChild(handle);

    handle.addEventListener('pointerdown', (e) => {
        if (e.button !== undefined && e.button !== 0) return;
        e.stopPropagation(); e.preventDefault();
        handle.setPointerCapture(e.pointerId);

        const startX = e.clientX;
        const startW = container.offsetWidth;

        function onMove(ev) {
            ev.preventDefault();
            const minW = parseInt(getComputedStyle(container).minWidth) || 320;
            container.style.width = Math.max(minW, startW + ev.clientX - startX) + 'px';
            // la hauteur s'adapte au contenu
        }
        function onUp() {
            handle.removeEventListener('pointermove',   onMove);
            handle.removeEventListener('pointerup',     onUp);
            handle.removeEventListener('pointercancel', onUp);
            handle.style.opacity = ''; handle.style.pointerEvents = '';
            elmnt.blur();
            if (typeof saveBoard === 'function') saveBoard();
        }
        handle.addEventListener('pointermove',   onMove);
        handle.addEventListener('pointerup',     onUp);
        handle.addEventListener('pointercancel', onUp);
    });
}

// ══════════════════════════════════════════════════════════════════
//  Logique interne du mélangeur
// ══════════════════════════════════════════════════════════════════
function _initCouleursWidget(widget) {

    // ── État ─────────────────────────────────────────────────────
    let pots = [[], [], []];      // chaque pot = liste de gouttes (noms)
    let activePot = 0;
    let savedColors = [];         // { hex, name, pots, ingredients }
    let prevMix = null;           // mélange d'avant le dernier changement
    let splatAlt = false;

    // ── Références DOM ───────────────────────────────────────────
    const q  = sel => widget.querySelector(sel);
    const qa = sel => widget.querySelectorAll(sel);
    const potEls     = [...qa('.clr-pot')];
    const hintEl     = q('.clr-hint');
    const splat      = q('.clr-splat');
    const nameEl     = q('.clr-result-name');
    const hexEl      = q('.clr-result-hex');
    const barEl      = q('.clr-recipe-bar');
    const recipeEl   = q('.clr-recipe-text');
    const compareEl  = q('.clr-compare');
    const descEl     = q('.clr-result-desc');
    const saveBtn    = q('.clr-btn-save');
    const resetBtn   = q('.clr-btn-reset');
    const savedRow   = q('.clr-saved-row');
    const toastEl    = q('.clr-toast');

    const reduceMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function textOn(rgb) { return _clrLuma(rgb) > 0.6 ? 'rgba(20,20,30,.8)' : 'rgba(255,255,255,.95)'; }

    function showToast(msg) {
        toastEl.textContent = msg;
        toastEl.classList.add('clr-toast-show');
        clearTimeout(showToast._t);
        showToast._t = setTimeout(() => toastEl.classList.remove('clr-toast-show'), 1800);
    }

    function persist() { if (typeof saveBoard === 'function') saveBoard(); }
    function snapshot() { if (typeof snapshotNow === 'function') snapshotNow(); }

    // Toute modification des pots passe par ici
    function change(fn) {
        const before = _clrMix(pots.flat());
        snapshot();
        fn();
        const after = _clrMix(pots.flat());
        if (!before || !after || before.hex !== after.hex) prevMix = before;
        render();
        persist();
    }

    // ── Rendu ────────────────────────────────────────────────────
    function renderHint() {
        hintEl.innerHTML = `Touche une couleur pour verser une goutte dans le <b>pot ${_CLR_POT_NAMES[activePot]}</b>, ou fais-la glisser vers un autre pot.`;
    }

    function renderPots() {
        pots.forEach((drops, i) => {
            const el = potEls[i];
            el.classList.toggle('clr-active', i === activePot);
            el.classList.toggle('clr-has', drops.length > 0);
            const liquid = el.querySelector('.clr-jar-liquid');
            const count  = el.querySelector('.clr-jar-count');
            const dotsEl = el.querySelector('.clr-drops');
            const m = _clrMix(drops);
            liquid.style.setProperty('--liq', m ? m.hex : 'transparent');
            liquid.style.height = m ? (18 + 72 * drops.length / _CLR_MAX_DROPS) + '%' : '0%';
            count.textContent = drops.length;
            el.querySelector('.clr-jar').title = m
                ? `Pot ${_CLR_POT_NAMES[i]} : ${m.name.toLowerCase()} (${drops.length} goutte${drops.length > 1 ? 's' : ''})`
                : `Pot ${_CLR_POT_NAMES[i]} : vide`;

            dotsEl.innerHTML = '';
            drops.forEach((n, j) => {
                const d = document.createElement('button');
                d.className = 'clr-drop-dot';
                d.style.background = _CLR_BASE[n].hex;
                d.title = `Enlever cette goutte de ${_CLR_BASE[n].label}`;
                d.setAttribute('aria-label', d.title);
                d.addEventListener('click', (e) => {
                    e.stopPropagation();
                    change(() => { pots[i].splice(j, 1); });
                });
                dotsEl.appendChild(d);
            });
        });
    }

    function renderResult() {
        const m = _clrMix(pots.flat());
        saveBtn.disabled = !m;
        resetBtn.disabled = !m;
        splatAlt = !splatAlt;
        splat.classList.toggle('clr-alt', splatAlt);

        if (!m) {
            splat.style.background = '';
            splat.style.boxShadow = '';
            splat.classList.remove('clr-light-edge');
            splat.textContent = '?';
            nameEl.textContent = 'Le grand mélange';
            hexEl.textContent = '';
            barEl.innerHTML = '';
            recipeEl.textContent = '';
            compareEl.classList.remove('clr-show');
            descEl.textContent = 'Verse des gouttes dans les pots : toutes leurs couleurs se mélangent ici.';
            return;
        }

        splat.textContent = '';
        splat.style.background = m.hex;
        splat.classList.toggle('clr-light-edge', _clrLuma(m.rgb) > 0.85);
        nameEl.textContent = m.name;
        hexEl.textContent = m.hex.toUpperCase();

        barEl.innerHTML = '';
        _CLR_ORDER.filter(n => m.counts[n]).forEach(n => {
            const s = document.createElement('span');
            const rgb = _clrHexToRgb(_CLR_BASE[n].hex);
            s.style.flexGrow = m.counts[n];
            s.style.background = _CLR_BASE[n].hex;
            s.style.color = textOn(rgb);
            s.textContent = m.counts[n];
            s.title = `${m.counts[n]} goutte${m.counts[n] > 1 ? 's' : ''} de ${_CLR_BASE[n].label} (${Math.round(100 * m.counts[n] / m.total)} %)`;
            barEl.appendChild(s);
        });
        recipeEl.textContent = _clrRecipeText(m.counts);

        if (prevMix && prevMix.hex !== m.hex) {
            const dl = _clrLuma(m.rgb) - _clrLuma(prevMix.rgb);
            let verdict = 'Couleur différente';
            if (prevMix.name === m.name || Math.abs(dl) > 0.04) {
                if (dl > 0.01) verdict = 'Plus clair qu’avant';
                else if (dl < -0.01) verdict = 'Plus foncé qu’avant';
                else verdict = 'Nuance différente';
            }
            compareEl.innerHTML = `<i style="background:${prevMix.hex}" title="Avant : ${prevMix.name}"></i>→<i style="background:${m.hex}"></i><b>${verdict}</b>`;
            compareEl.classList.add('clr-show');
        } else {
            compareEl.classList.remove('clr-show');
        }
        descEl.textContent = m.desc;
    }

    function renderSaved() {
        savedRow.innerHTML = '';
        if (savedColors.length === 0) {
            savedRow.innerHTML = '<span class="clr-saved-empty">Quand un mélange te plaît, touche « Garder cette couleur » pour le retrouver ici.</span>';
            return;
        }
        savedColors.forEach((c, idx) => {
            const chip = document.createElement('button');
            chip.className = 'clr-chip';
            const recipe = c.ingredients ? _clrRecipeText(_clrCount(c.ingredients)) : '';
            chip.title = `Remettre cette recette dans les pots${recipe ? ' : ' + recipe : ''}`;
            chip.innerHTML = `<span class="clr-chip-dot" style="background:${c.hex}"></span><span>${c.name}</span><span class="clr-chip-del" title="Supprimer">✕</span>`;
            chip.addEventListener('click', (e) => {
                e.stopPropagation();
                if (e.target.closest('.clr-chip-del')) {
                    snapshot();
                    savedColors.splice(idx, 1);
                    renderSaved();
                    persist();
                    return;
                }
                change(() => {
                    if (Array.isArray(c.pots) && c.pots.length === 3) pots = c.pots.map(pp => pp.slice());
                    else pots = [(c.ingredients || []).slice(0, _CLR_MAX_DROPS), [], []];
                });
                showToast(`Recette de « ${c.name} » remise dans les pots`);
            });
            savedRow.appendChild(chip);
        });
    }

    function _clrCount(list) {
        const c = {}; list.forEach(n => { c[n] = (c[n] || 0) + 1; }); return c;
    }

    function render() { renderHint(); renderPots(); renderResult(); }

    // ── Verser une goutte ────────────────────────────────────────
    function addDrop(potIdx, color) {
        if (pots[potIdx].length >= _CLR_MAX_DROPS) {
            showToast(`Le pot ${_CLR_POT_NAMES[potIdx]} est plein : vide-le ou choisis un autre pot`);
            return false;
        }
        change(() => { pots[potIdx].push(color); });
        const jar = potEls[potIdx].querySelector('.clr-jar');
        jar.classList.remove('clr-splash'); void jar.offsetWidth; jar.classList.add('clr-splash');
        return true;
    }

    function makeDropEl(color) {
        const d = document.createElement('div');
        d.className = 'clr-flying-drop';
        d.style.background = _CLR_BASE[color].hex;
        return d;
    }

    function flyThenAdd(fromEl, potIdx, color) {
        const jar = potEls[potIdx].querySelector('.clr-jar');
        if (pots[potIdx].length >= _CLR_MAX_DROPS) { addDrop(potIdx, color); return; }
        if (reduceMotion() || !fromEl || !jar.animate) { addDrop(potIdx, color); return; }
        const a = fromEl.querySelector('.clr-blob').getBoundingClientRect();
        const b = jar.getBoundingClientRect();
        const x0 = a.left + a.width / 2, y0 = a.top + a.height / 2;
        const dx = b.left + b.width / 2 - x0, dy = b.top + b.height * 0.45 - y0;
        const el = makeDropEl(color);
        el.style.left = x0 + 'px'; el.style.top = y0 + 'px';
        document.body.appendChild(el);
        const anim = el.animate([
            { transform: 'translate(0,0) scale(.8)' },
            { transform: `translate(${dx * 0.5}px, ${Math.min(dy * 0.5, 0) - 50}px) scale(1.05)`, offset: 0.45 },
            { transform: `translate(${dx}px, ${dy}px) scale(.55)`, opacity: .85 },
        ], { duration: 460, easing: 'cubic-bezier(.4,0,.6,1)' });
        anim.onfinish = () => { el.remove(); if (widget.isConnected) addDrop(potIdx, color); };
    }

    // ── Palette : clic = goutte dans le pot actif ; glisser = pot au choix
    function potIndexAt(x, y) {
        const hit = document.elementFromPoint(x, y);
        const pot = hit && hit.closest && hit.closest('.clr-pot');
        if (!pot || !widget.contains(pot)) return null;
        return parseInt(pot.dataset.pot, 10);
    }

    qa('.clr-paint').forEach(btn => {
        const color = btn.dataset.color;
        let suppressClick = false;

        const stop = e => e.stopPropagation();
        btn.addEventListener('mousedown', stop);
        btn.addEventListener('touchstart', stop, { passive: true });

        btn.addEventListener('pointerdown', (e) => {
            if (e.button !== undefined && e.button !== 0) return;
            e.stopPropagation();
            if (typeof bringToFront === 'function' && widget.dataset.background !== 'true') bringToFront(widget);
            const sx = e.clientX, sy = e.clientY;
            let ghost = null, hover = null;
            try { btn.setPointerCapture(e.pointerId); } catch (_) {}

            const setHover = idx => {
                if (hover === idx) return;
                if (hover !== null) potEls[hover].classList.remove('clr-drop-target');
                hover = idx;
                if (hover !== null) potEls[hover].classList.add('clr-drop-target');
            };
            const onMove = ev => {
                if (!ghost && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 8) {
                    ghost = makeDropEl(color);
                    ghost.classList.add('clr-dragged');
                    document.body.appendChild(ghost);
                }
                if (ghost) {
                    ev.preventDefault();
                    ghost.style.left = ev.clientX + 'px';
                    ghost.style.top  = ev.clientY + 'px';
                    setHover(potIndexAt(ev.clientX, ev.clientY));
                }
            };
            const onUp = ev => {
                btn.removeEventListener('pointermove', onMove);
                btn.removeEventListener('pointerup', onUp);
                btn.removeEventListener('pointercancel', onUp);
                if (ghost) {
                    ghost.remove();
                    setHover(null);
                    suppressClick = true;
                    setTimeout(() => { suppressClick = false; }, 0);
                    if (ev.type === 'pointerup') {
                        const idx = potIndexAt(ev.clientX, ev.clientY);
                        if (idx !== null) {
                            activePot = idx;
                            addDrop(idx, color);
                        }
                    }
                }
            };
            btn.addEventListener('pointermove', onMove);
            btn.addEventListener('pointerup', onUp);
            btn.addEventListener('pointercancel', onUp);
        });

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (suppressClick) return;
            flyThenAdd(btn, activePot, color);
        });
    });

    // ── Pots : choisir le pot actif ──────────────────────────────
    potEls.forEach((el, i) => {
        el.querySelector('.clr-jar').addEventListener('click', (e) => {
            e.stopPropagation();
            activePot = i;
            renderHint(); renderPots();
        });
        el.querySelector('.clr-pot-empty-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            if (!pots[i].length) return;
            change(() => { pots[i] = []; });
            showToast(`Pot ${_CLR_POT_NAMES[i]} vidé`);
        });
    });

    resetBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        change(() => { pots = [[], [], []]; });
        prevMix = null;
        renderResult();
        showToast('Les trois pots sont vidés');
    });

    saveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const m = _clrMix(pots.flat());
        if (!m) { showToast('Verse d’abord des gouttes dans un pot'); return; }
        if (savedColors.find(c => c.hex === m.hex)) { showToast('Cette couleur est déjà dans Mes couleurs'); return; }
        snapshot();
        savedColors.push({ hex: m.hex, name: m.name, pots: pots.map(pp => pp.slice()), ingredients: pots.flat() });
        renderSaved();
        showToast(`« ${m.name} » ajoutée à Mes couleurs`);
        persist();
    });

    // ── Sauvegarde / restauration (format compatible v1) ─────────
    widget._clrGetData = () => {
        const c = widget.querySelector('.clr-container');
        return {
            buckets: pots,
            activePot,
            savedColors,
            containerW: c ? c.offsetWidth : null,
            fullboard: c ? c.classList.contains('clr-fullboard') : false,
        };
    };
    widget._clrSetData = (data) => {
        if (!data) return;
        if (Array.isArray(data.buckets)) {
            pots = [0, 1, 2].map(i => (Array.isArray(data.buckets[i]) ? data.buckets[i] : [])
                .filter(n => _CLR_BASE[n]).slice(0, _CLR_MAX_DROPS));
        }
        if (Number.isInteger(data.activePot) && data.activePot >= 0 && data.activePot < 3) activePot = data.activePot;
        if (Array.isArray(data.savedColors)) {
            savedColors = data.savedColors.map(c => {
                // Recalcule le nom avec le nouveau moteur (anciennes sauvegardes incluses)
                const ing = Array.isArray(c.ingredients) ? c.ingredients.filter(n => _CLR_BASE[n]) : [];
                const m = ing.length ? _clrMix(ing) : null;
                return m ? { hex: m.hex, name: m.name, pots: c.pots, ingredients: ing } : c;
            });
        }
        const c = widget.querySelector('.clr-container');
        if (c && data.containerW) c.style.width = data.containerW + 'px';
        if (data.fullboard && typeof widget._clrSetFullboard === 'function') widget._clrSetFullboard(true);
        prevMix = null;
        render();
        renderSaved();
    };

    render();
    renderSaved();
}
