// =========================================================================
// WIDGET ROBOT À PROGRAMMER — Le Bureau du Prof
// Initiation à la programmation (cycle 3, CM1 / CM2) : un robot de type
// Bee-Bot à guider sur une grille repérée (A1, B4…) avec des instructions.
//   • 🎯 Défi     : écrire un programme qui mène le robot au drapeau 🚩
//                   en ramassant les diamants 💎 (⭐⭐⭐ = programme le plus court) ;
//   • 🔮 Prédire  : lire un programme SANS le lancer et prévoir la case
//                   d'arrivée et l'orientation du robot ;
//   • 🐞 Déboguer : un programme contient une erreur, la trouver et la corriger ;
//   • ✏️ Libre    : construire son propre parcours avec la palette.
//   • Flèches 🤖 Robot (relatives : avancer, reculer, tourner à gauche / droite)
//     ou 🧭 Carte (absolues : Nord, Sud, Est, Ouest) ;
//   • boucle 🔁 Répéter [ ], exécution animée, pas à pas, vitesse, trace,
//     coordonnées, niveaux 1 à 4 (grilles de 5×5 à 8×8).
//
// Même fenêtre que « Chasse au son » : redimensionnement libre,
// aide, réduire, plein écran (fullboard), fermer.
// Sur téléphone : ouverture directe en plein écran (bouton vert).
// L'état (mode, niveau, grille, programme, réponses, réglages) est restauré
// après actualisation via save-load.js (_robGetData / _robSetData).
//
// Dépendances : board, findFreePosition(), makeDraggable(),
//   makeDraggableRotate(), bringToFront(), snapshotNow(), saveBoard()
//   (+ window._wfMiniBarCollapse défini par activite-francais-mot-le-plus-long.js)
// =========================================================================

// ── Données ───────────────────────────────────────────────────────────────
// Orientation : 0 = Nord (haut), 1 = Est (droite), 2 = Sud (bas), 3 = Ouest (gauche)
const RB_DIRS = [
    { dx: 0,  dy: -1, nom: 'Nord',  le: 'le Nord' },
    { dx: 1,  dy: 0,  nom: 'Est',   le: 'l\'Est' },
    { dx: 0,  dy: 1,  nom: 'Sud',   le: 'le Sud' },
    { dx: -1, dy: 0,  nom: 'Ouest', le: 'l\'Ouest' }
];
const RB_CMD = {
    F: { ico: '▲', lbl: 'Avancer', titre: 'Avancer d\'une case (dans le sens où regarde le robot)' },
    B: { ico: '▼', lbl: 'Reculer', titre: 'Reculer d\'une case (sans se retourner)' },
    L: { ico: '↶', lbl: 'Gauche',  titre: 'Tourner d\'un quart de tour à gauche (sans avancer)' },
    R: { ico: '↷', lbl: 'Droite',  titre: 'Tourner d\'un quart de tour à droite (sans avancer)' },
    N: { ico: '⬆', lbl: 'Nord',    titre: 'Aller d\'une case vers le Nord',  d: 0 },
    E: { ico: '➡', lbl: 'Est',     titre: 'Aller d\'une case vers l\'Est',   d: 1 },
    S: { ico: '⬇', lbl: 'Sud',     titre: 'Aller d\'une case vers le Sud',   d: 2 },
    O: { ico: '⬅', lbl: 'Ouest',   titre: 'Aller d\'une case vers l\'Ouest', d: 3 }
};
const RB_SET = { rel: ['F', 'B', 'L', 'R'], abs: ['N', 'E', 'S', 'O'] };
const RB_KEYS = {
    rel: { ArrowUp: 'F', ArrowDown: 'B', ArrowLeft: 'L', ArrowRight: 'R' },
    abs: { ArrowUp: 'N', ArrowDown: 'S', ArrowLeft: 'O', ArrowRight: 'E' }
};
// min / max : longueur du programme le plus court (défis) ; pred : longueur des programmes à lire
const RB_LEVELS = {
    1: { nom: 'Découverte',  n: 5, obst: 3,  gems: 0, min: 4,  max: 9,  rep: false, pred: [4, 6] },
    2: { nom: 'Explorateur', n: 6, obst: 6,  gems: 1, min: 7,  max: 15, rep: false, pred: [5, 8] },
    3: { nom: 'Expert',      n: 7, obst: 9,  gems: 2, min: 10, max: 22, rep: true,  pred: [6, 9] },
    4: { nom: 'Champion',    n: 8, obst: 12, gems: 3, min: 14, max: 30, rep: true,  pred: [7, 11] }
};
const RB_MODES = {
    defi:    { lbl: '🎯 Défi',     ico: '🎯', titre: 'Écrire un programme qui amène le robot au drapeau' },
    predire: { lbl: '🔮 Prédire',  ico: '🔮', titre: 'Lire un programme et prévoir où le robot s\'arrête' },
    debug:   { lbl: '🐞 Déboguer', ico: '🐞', titre: 'Trouver et corriger l\'erreur d\'un programme' },
    libre:   { lbl: '✏️ Libre',    ico: '✏️', titre: 'Construire son propre parcours, puis le programmer' }
};
const RB_TOOLS = {
    rock:  { ico: '🪨', lbl: 'Rocher' },
    gem:   { ico: '💎', lbl: 'Diamant' },
    flag:  { ico: '🚩', lbl: 'Arrivée' },
    start: { ico: '🤖', lbl: 'Départ', titre: 'Départ du robot (touche-le encore pour le faire tourner)' },
    erase: { ico: '🧽', lbl: 'Effacer' }
};
const RB_SPEEDS = { lent: 850, normal: 500, rapide: 230 };
const RB_MAX_TOK = 60;      // nombre maximal de blocs dans un programme
const RB_MAX_STEPS = 300;   // nombre maximal d'actions exécutées (boucles comprises)
const RB_MAX_GEMS = 4;

const RB_BOT_SVG = `
<svg viewBox="0 0 100 100" aria-hidden="true">
  <polygon points="50,1 62,15 38,15" fill="#dc2626"/>
  <ellipse cx="50" cy="57" rx="37" ry="38" fill="#fbbf24" stroke="#78350f" stroke-width="4"/>
  <path d="M16 64 Q50 70 84 64" stroke="#1f2937" stroke-width="9" fill="none" stroke-linecap="round"/>
  <path d="M22 82 Q50 88 78 82" stroke="#1f2937" stroke-width="8" fill="none" stroke-linecap="round"/>
  <circle cx="36" cy="36" r="10" fill="#fff" stroke="#1f2937" stroke-width="3"/>
  <circle cx="64" cy="36" r="10" fill="#fff" stroke="#1f2937" stroke-width="3"/>
  <circle cx="36" cy="33" r="4.5" fill="#1f2937"/>
  <circle cx="64" cy="33" r="4.5" fill="#1f2937"/>
</svg>`;

// ── Outils ────────────────────────────────────────────────────────────────
function _rbRand(n) { return Math.floor(Math.random() * n); }
function _rbShuffle(a) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
}
function _rbKey(x, y) { return x + ',' + y; }
function _rbCase(x, y) { return String.fromCharCode(65 + x) + (y + 1); }
function _rbEsc(t) {
    return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function _rbIsPhone() {
    if (typeof isMobileBoardMode === 'function') { try { if (isMobileBoardMode()) return true; } catch (e) {} }
    return !!(window.matchMedia && window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse)').matches);
}
function _rbCopyGrid(g) {
    return {
        n: g.n,
        start: { x: g.start.x, y: g.start.y, d: g.start.d },
        flag: g.flag ? [g.flag[0], g.flag[1]] : null,
        obst: g.obst.map(p => [p[0], p[1]]),
        gems: g.gems.map(p => [p[0], p[1]])
    };
}
function _rbCopyProg(p) { return p.map(t => t.c === '(' ? { c: '(', n: t.n } : { c: t.c }); }
function _rbValidGrid(g) {
    if (!g || typeof g !== 'object') return null;
    const n = +g.n;
    if (!(n >= 4 && n <= 10)) return null;
    const inG = (x, y) => Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < n && y < n;
    const s = g.start || {};
    if (!inG(+s.x, +s.y)) return null;
    const pts = (a) => (Array.isArray(a) ? a : []).filter(p => Array.isArray(p) && inG(+p[0], +p[1])).map(p => [+p[0], +p[1]]);
    const flag = Array.isArray(g.flag) && inG(+g.flag[0], +g.flag[1]) ? [+g.flag[0], +g.flag[1]] : null;
    return { n, start: { x: +s.x, y: +s.y, d: ((+s.d || 0) % 4 + 4) % 4 }, flag, obst: pts(g.obst), gems: pts(g.gems).slice(0, RB_MAX_GEMS) };
}
function _rbValidProg(p) {
    return (Array.isArray(p) ? p : []).filter(t => t && (RB_CMD[t.c] || t.c === '(' || t.c === ')'))
        .slice(0, RB_MAX_TOK)
        .map(t => t.c === '(' ? { c: '(', n: Math.max(2, Math.min(9, +t.n || 2)) } : { c: t.c });
}

// Un pas du robot : nouvelle position, orientation, quart de tour éventuel, déplacement (+1 / -1 / 0)
function _rbMove(p, c) {
    if (c === 'L') return { x: p.x, y: p.y, d: (p.d + 3) % 4, turn: -1, move: 0 };
    if (c === 'R') return { x: p.x, y: p.y, d: (p.d + 1) % 4, turn: 1, move: 0 };
    if (c === 'F' || c === 'B') {
        const s = c === 'F' ? 1 : -1, D = RB_DIRS[p.d];
        return { x: p.x + s * D.dx, y: p.y + s * D.dy, d: p.d, turn: 0, move: s };
    }
    const nd = RB_CMD[c].d, D = RB_DIRS[nd];
    let t = (nd - p.d + 4) % 4;
    if (t === 3) t = -1;
    return { x: p.x + D.dx, y: p.y + D.dy, d: nd, turn: t, move: 1 };
}

// Programme : liste de blocs { c:'F' } … { c:'(', n:3 } … { c:')' }
function _rbParse(prog) {
    let i = 0;
    function block(inRep) {
        const out = [];
        while (i < prog.length) {
            const t = prog[i];
            if (t.c === ')') { i++; if (inRep) return out; continue; }
            if (t.c === '(') { const idx = i; i++; out.push({ rep: t.n, idx, body: block(true) }); }
            else { out.push({ c: t.c, idx: i }); i++; }
        }
        return out;
    }
    return block(false);
}
function _rbExpand(tree, limit) {
    const steps = [];
    let over = false;
    (function run(list) {
        for (const nd of list) {
            if (over) return;
            if (nd.rep) { for (let k = 0; k < nd.rep && !over; k++) run(nd.body); }
            else {
                steps.push({ c: nd.c, idx: nd.idx });
                if (steps.length > limit) { over = true; return; }
            }
        }
    })(tree);
    return { steps, over };
}
function _rbStepsOf(prog) { return _rbExpand(_rbParse(prog), RB_MAX_STEPS); }
function _rbCount(prog) { return prog.filter(t => t.c !== ')').length; }
function _rbNums(prog) {
    const m = {};
    let k = 0;
    prog.forEach((t, i) => { if (t.c !== ')') m[i] = ++k; });
    return m;
}
function _rbMatch(prog, i) {
    const t = prog[i];
    if (!t) return -1;
    if (t.c === '(') {
        let depth = 0;
        for (let k = i; k < prog.length; k++) {
            if (prog[k].c === '(') depth++;
            else if (prog[k].c === ')') { depth--; if (depth === 0) return k; }
        }
    } else if (t.c === ')') {
        let depth = 0;
        for (let k = i; k >= 0; k--) {
            if (prog[k].c === ')') depth++;
            else if (prog[k].c === '(') { depth--; if (depth === 0) return k; }
        }
    }
    return -1;
}

// Exécution complète (sans animation) d'une liste d'actions
function _rbSimSteps(g, steps) {
    const ob = new Set(g.obst.map(p => _rbKey(p[0], p[1])));
    const gm = new Map(g.gems.map((p, i) => [_rbKey(p[0], p[1]), i]));
    let p = { x: g.start.x, y: g.start.y, d: g.start.d };
    const got = new Set(), trace = [[p.x, p.y]];
    for (let s = 0; s < steps.length; s++) {
        const r = _rbMove(p, steps[s].c);
        if (r.move) {
            const out = r.x < 0 || r.y < 0 || r.x >= g.n || r.y >= g.n;
            if (out || ob.has(_rbKey(r.x, r.y))) return { pos: { x: p.x, y: p.y, d: r.d }, crash: s, why: out ? 'out' : 'rock', got, trace };
            trace.push([r.x, r.y]);
            const k = _rbKey(r.x, r.y);
            if (gm.has(k)) got.add(gm.get(k));
        }
        p = { x: r.x, y: r.y, d: r.d };
    }
    return { pos: p, crash: -1, got, trace };
}
function _rbIsWin(g, res) {
    return res.crash < 0 && !!g.flag && res.pos.x === g.flag[0] && res.pos.y === g.flag[1] && res.got.size === g.gems.length;
}

// Programme le plus court (parcours en largeur) : diamants ramassés puis arrivée
function _rbSolve(g, set) {
    if (!g.flag) return null;
    const n = g.n;
    const ob = new Set(g.obst.map(p => _rbKey(p[0], p[1])));
    const gm = new Map(g.gems.map((p, i) => [_rbKey(p[0], p[1]), i]));
    const full = (1 << g.gems.length) - 1;
    const key = (x, y, d, m) => ((x * n + y) * 4 + d) * 16 + m;
    const k0 = key(g.start.x, g.start.y, g.start.d, 0);
    const prev = new Map([[k0, null]]);
    const q = [[g.start.x, g.start.y, g.start.d, 0, k0]];
    for (let h = 0; h < q.length; h++) {
        const [x, y, d, m, kc] = q[h];
        if (x === g.flag[0] && y === g.flag[1] && m === full) {
            const path = [];
            let k = kc;
            while (prev.get(k)) { const pr = prev.get(k); path.push(pr[1]); k = pr[0]; }
            return path.reverse();
        }
        for (const c of set) {
            const r = _rbMove({ x, y, d }, c);
            let nm = m;
            if (r.move) {
                if (r.x < 0 || r.y < 0 || r.x >= n || r.y >= n || ob.has(_rbKey(r.x, r.y))) continue;
                const gk = _rbKey(r.x, r.y);
                if (gm.has(gk)) nm |= 1 << gm.get(gk);
            }
            const k = key(r.x, r.y, r.d, nm);
            if (prev.has(k)) continue;
            prev.set(k, [kc, c]);
            q.push([r.x, r.y, r.d, nm, k]);
        }
    }
    return null;
}

function _rbBlankGrid(n) {
    return { n, start: { x: 0, y: n - 1, d: 0 }, flag: [n - 1, 0], obst: [], gems: [] };
}

// Défi aléatoire dont le programme le plus court a une longueur adaptée au niveau
function _rbGenDefi(L, set) {
    const n = L.n;
    let best = null, bestScore = Infinity;
    for (let t = 0; t < 500; t++) {
        const cells = [];
        for (let x = 0; x < n; x++) for (let y = 0; y < n; y++) cells.push([x, y]);
        _rbShuffle(cells);
        const s = cells.pop();
        const fi = cells.findIndex(c => Math.abs(c[0] - s[0]) + Math.abs(c[1] - s[1]) >= Math.max(3, n - 2));
        if (fi < 0) continue;
        const f = cells.splice(fi, 1)[0];
        const gems = cells.splice(0, L.gems);
        const obst = cells.splice(0, L.obst);
        const g = { n, start: { x: s[0], y: s[1], d: _rbRand(4) }, flag: f, obst, gems };
        const sol = _rbSolve(g, set);
        if (!sol) continue;
        if (sol.length >= L.min && sol.length <= L.max) return { grid: g, sol };
        const sc = sol.length < L.min ? L.min - sol.length : sol.length - L.max;
        if (sc < bestScore) { bestScore = sc; best = { grid: g, sol }; }
    }
    if (best) return best;
    const g = _rbBlankGrid(n);
    return { grid: g, sol: _rbSolve(g, set) || [] };
}

// Programme aléatoire à lire (mode Prédire)
function _rbRandProg(len, set, allowRep) {
    const rel = set === RB_SET.rel;
    const out = [];
    let last = '';
    const pick = () => {
        let c;
        for (let k = 0; k < 10; k++) {
            if (rel) { const r = Math.random(); c = r < 0.45 ? 'F' : r < 0.65 ? 'L' : r < 0.85 ? 'R' : 'B'; }
            else c = set[_rbRand(4)];
            // pas de « gauche puis droite » (ou l'inverse) qui s'annulent
            if (!((c === 'L' && last === 'R') || (c === 'R' && last === 'L') ||
                  (c === 'F' && last === 'B') || (c === 'B' && last === 'F'))) break;
        }
        last = c;
        return c;
    };
    let count = 0, usedRep = false;
    while (count < len) {
        if (allowRep && !usedRep && count <= len - 3 && Math.random() < 0.4) {
            const bl = 1 + _rbRand(2);
            const body = [];
            for (let k = 0; k < bl; k++) body.push(pick());
            if (rel && !body.some(c => c === 'F' || c === 'B')) body[0] = 'F';
            out.push({ c: '(', n: 2 + _rbRand(3) });
            body.forEach(c => out.push({ c }));
            out.push({ c: ')' });
            count += 1 + bl;
            usedRep = true;
            last = '';
        } else {
            out.push({ c: pick() });
            count++;
        }
    }
    return out;
}
function _rbGenPredict(L, set) {
    const n = L.n;
    for (let t = 0; t < 800; t++) {
        const cells = [];
        for (let x = 0; x < n; x++) for (let y = 0; y < n; y++) cells.push([x, y]);
        _rbShuffle(cells);
        const s = cells.pop();
        const obst = cells.splice(0, Math.round(L.obst * 0.6));
        const g = { n, start: { x: s[0], y: s[1], d: _rbRand(4) }, flag: null, obst, gems: [] };
        const len = L.pred[0] + _rbRand(L.pred[1] - L.pred[0] + 1);
        const prog = _rbRandProg(len, set, L.rep);
        const ex = _rbStepsOf(prog);
        if (ex.over || ex.steps.length > 40) continue;
        const res = _rbSimSteps(g, ex.steps);
        if (res.crash >= 0) continue;
        if (res.pos.x === s[0] && res.pos.y === s[1]) continue;
        if (res.trace.length < 3) continue;
        return { grid: g, prog };
    }
    const g = { n, start: { x: 0, y: n - 1, d: 0 }, flag: null, obst: [], gems: [] };
    return { grid: g, prog: set === RB_SET.rel ? [{ c: 'F' }, { c: 'F' }, { c: 'R' }, { c: 'F' }] : [{ c: 'N' }, { c: 'N' }, { c: 'E' }] };
}

// Regroupe les instructions identiques qui se suivent (3 ou plus) dans une boucle
function _rbCompress(cmds, allowRep) {
    const out = [];
    for (let i = 0; i < cmds.length;) {
        let j = i;
        while (j < cmds.length && cmds[j] === cmds[i]) j++;
        const run = j - i;
        if (allowRep && run >= 3 && run <= 9) out.push({ c: '(', n: run }, { c: cmds[i] }, { c: ')' });
        else for (let k = 0; k < run; k++) out.push({ c: cmds[i] });
        i = j;
    }
    return out;
}
// Glisse une erreur dans un programme juste (mode Déboguer)
function _rbInjectBug(g, prog, set) {
    for (let t = 0; t < 120; t++) {
        const p = _rbCopyProg(prog);
        const cand = p.map((x, i) => i).filter(i => p[i].c !== ')');
        if (!cand.length) return null;
        const i = cand[_rbRand(cand.length)];
        let kind = 'change', i2 = -1;
        if (p[i].c === '(') {
            p[i].n = p[i].n <= 2 ? p[i].n + 1 : p[i].n + (Math.random() < 0.5 ? -1 : 1);
            kind = 'rep';
        } else if (Math.random() < 0.3 && p[i + 1] && RB_CMD[p[i + 1].c] && p[i + 1].c !== p[i].c) {
            const tmp = p[i].c; p[i].c = p[i + 1].c; p[i + 1].c = tmp;
            kind = 'swap'; i2 = i + 1;
        } else {
            const others = set.filter(c => c !== p[i].c);
            p[i].c = others[_rbRand(others.length)];
        }
        const ex = _rbStepsOf(p);
        if (ex.over) continue;
        if (_rbIsWin(g, _rbSimSteps(g, ex.steps))) continue;
        return { prog: p, idx: i, idx2: i2, kind };
    }
    return null;
}

// ── CSS ───────────────────────────────────────────────────────────────────
(function () {
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

    if (document.getElementById('rbt-style')) return;
    const s = document.createElement('style');
    s.id = 'rbt-style';
    s.textContent = `
        .widget[data-type="robot"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        .rbt-container {
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
            -webkit-user-select: none;
            overflow: hidden;
            outline: none;
            cursor: default;
        }
        .rbt-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; cursor: grab; }
        .rbt-header:active { cursor: grabbing; }
        .rbt-container.wf-fullboard .rbt-header { cursor: default; }   /* plein écran : la fenêtre ne se déplace pas */
        .rbt-header .rbt-badge { pointer-events: none; }
        .rbt-header button, .rbt-header .wf-btn, .rbt-header .rbt-help-btn { cursor: pointer; }
        .rbt-title { font-size: 13px; font-weight: 800; color: #374151; letter-spacing: .3px; pointer-events: none; }
        .rbt-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; background: #e0e7ff; color: #3730a3; white-space: nowrap; }

        .rbt-container.wf-minimized > *:not(.rbt-header) { display: none !important; }
        .rbt-container.wf-minimized { gap: 0; }
        .rbt-container.wf-fullboard {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: auto !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
            overflow-y: auto;
            padding-left: 50px !important;
        }

        .rbt-tools {
            display: flex; gap: 5px; flex-wrap: wrap; align-items: center;
            padding: 6px; background: #fafafa; border: 1px solid #eee; border-radius: 10px;
        }
        .rbt-sep { width: 1px; height: 22px; background: #ddd; margin: 0 3px; }
        .rbt-grp { display: inline-flex; gap: 5px; align-items: center; }
        .rbt-lbl { font-size: 11px; font-weight: 700; color: #6b7280; }
        .rbt-btn {
            padding: 5px 12px; border-radius: 8px; border: none;
            font-size: 11px; font-weight: 700; cursor: pointer;
            transition: background .15s, transform .1s; white-space: nowrap;
        }
        .rbt-btn:active { transform: scale(0.96); }
        .rbt-btn:disabled { opacity: .45; cursor: default; transform: none; }
        .rbt-btn-blue  { background: #4a90e2; color: #fff; }
        .rbt-btn-blue:hover:not(:disabled)  { background: #357abd; }
        .rbt-btn-grey  { background: #f0f0f0; color: #333; border: 1px solid #ddd; }
        .rbt-btn-grey:hover:not(:disabled)  { background: #e0e0e0; }
        .rbt-btn-green { background: #28a745; color: #fff; }
        .rbt-btn-green:hover:not(:disabled) { background: #1f8a39; }
        .rbt-btn-violet { background: #7c3aed; color: #fff; }
        .rbt-btn-violet:hover:not(:disabled) { background: #6d28d9; }
        .rbt-btn.on    { background: #e0e7ff; color: #3730a3; border: 1px solid #a5b4fc; }
        .rbt-seg { display: inline-flex; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
        .rbt-seg button {
            padding: 5px 9px; border: none; background: #f5f5f5; font-size: 11px; font-weight: 700;
            color: #555; cursor: pointer; border-right: 1px solid #ddd; white-space: nowrap;
        }
        .rbt-seg button:last-child { border-right: none; }
        .rbt-seg button.active { background: #e0e7ff; color: #3730a3; }
        .rbt-seg button:disabled { opacity: .45; cursor: default; }

        /* Consigne */
        .rbt-consigne {
            display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
            padding: 8px 12px; border-radius: 12px; background: #eef2ff; border: 1px solid #c7d2fe;
            font-size: 16px; color: #312e81; line-height: 1.35;
        }
        .rbt-consigne .rbt-ico { font-size: 1.5em; line-height: 1; flex-shrink: 0; }
        .rbt-consigne .rbt-txt { flex: 1; min-width: 200px; }
        .rbt-pos {
            flex-shrink: 0; font-weight: 800; font-size: .9em; background: #fff; border: 1px solid #c7d2fe;
            border-radius: 20px; padding: 3px 10px; color: #3730a3; white-space: nowrap;
        }

        /* Zone principale : grille + programme */
        .rbt-main { display: flex; gap: 10px; flex-shrink: 0; min-height: 0; }
        .rbt-stage {
            flex: 1 1 55%; min-width: 0; position: relative; overflow: hidden;
            display: flex; align-items: center; justify-content: center;
            background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 12px;
        }
        .rbt-board { --c: 50px; --n: 5; display: block; }
        .rbt-board.coords {
            display: grid;
            grid-template-columns: calc(var(--c) * .6) auto;
            grid-template-rows: calc(var(--c) * .6) auto;
        }
        .rbt-corner { display: flex; align-items: center; justify-content: center; font-size: calc(var(--c) * .34); color: #64748b; font-weight: 900; }
        .rbt-labs-x { display: flex; }
        .rbt-labs-y { display: flex; flex-direction: column; }
        .rbt-labs-x span, .rbt-labs-y span {
            display: flex; align-items: center; justify-content: center; font-weight: 800; color: #475569;
            font-size: max(11px, calc(var(--c) * .3)); font-family: 'Nunito', 'Segoe UI', sans-serif;
        }
        .rbt-labs-x span { width: var(--c); }
        .rbt-labs-y span { height: var(--c); }
        .rbt-field {
            position: relative; width: calc(var(--c) * var(--n)); height: calc(var(--c) * var(--n));
            border: 2px solid #64748b; box-sizing: content-box; border-radius: 4px; background: #fff;
        }
        .rbt-cells {
            position: absolute; inset: 0; display: grid;
            grid-template-columns: repeat(var(--n), var(--c)); grid-auto-rows: var(--c);
        }
        .rbt-cell {
            box-sizing: border-box; border: 1px solid #cbd5e1; background: #fff; position: relative;
            display: flex; align-items: center; justify-content: center;
            font-size: calc(var(--c) * .55); line-height: 1;
            font-family: 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif;
        }
        .rbt-cell.alt { background: #f1f5f9; }
        .rbt-cell.start::after {
            content: ''; position: absolute; inset: 12%; border: 2px dashed #f59e0b; border-radius: 50%;
        }
        .rbt-cell.flag { background: #fef2f2; }
        .rbt-cell.rock { background: #e7e5e4; }
        .rbt-cell .rbt-it { pointer-events: none; transition: opacity .3s, transform .3s; }
        .rbt-cell.got .rbt-it { opacity: .2; transform: scale(.6); filter: grayscale(1); }
        .rbt-cell.edit { cursor: pointer; }
        .rbt-cell.edit:hover { box-shadow: inset 0 0 0 3px #a5b4fc; }
        .rbt-cell.ans { box-shadow: inset 0 0 0 4px #8b5cf6; background: #ede9fe; }
        .rbt-cell .rbt-ans {
            color: #6d28d9; font-weight: 900; font-family: 'Nunito', 'Segoe UI', sans-serif;
            font-size: calc(var(--c) * .5); display: inline-block;
        }
        .rbt-trace { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 2; }
        .rbt-trace polyline { fill: none; stroke: #6366f1; stroke-width: .09; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: .18 .14; opacity: .85; }
        .rbt-robot {
            position: absolute; z-index: 3; pointer-events: none;
            left: calc(var(--c) * var(--x, 0)); top: calc(var(--c) * var(--y, 0));
            width: var(--c); height: var(--c);
            transform: rotate(calc(var(--a, 0) * 1deg));
            transition: left var(--dur, 400ms) ease-in-out, top var(--dur, 400ms) ease-in-out, transform var(--dur, 400ms) ease-in-out;
        }
        .rbt-robot.rbt-noanim { transition: none !important; }
        .rbt-bot-in { width: 100%; height: 100%; padding: 6%; box-sizing: border-box; }
        .rbt-bot-in svg { width: 100%; height: 100%; display: block; filter: drop-shadow(0 2px 2px rgba(0,0,0,.25)); }
        .rbt-bot-in.bump-f { animation: rbtBumpF .45s ease-out; }
        .rbt-bot-in.bump-b { animation: rbtBumpB .45s ease-out; }
        .rbt-robot.win .rbt-bot-in { animation: rbtWin .9s ease-in-out 2; }
        @keyframes rbtBumpF { 40% { transform: translateY(-24%); } 60% { transform: translateY(-10%) rotate(-8deg); } 80% { transform: rotate(8deg); } }
        @keyframes rbtBumpB { 40% { transform: translateY(24%); } 60% { transform: translateY(10%) rotate(-8deg); } 80% { transform: rotate(8deg); } }
        @keyframes rbtWin { 30% { transform: scale(1.25); } 60% { transform: scale(.95) rotate(12deg); } 80% { transform: rotate(-12deg); } }

        .rbt-side { flex: 1 1 42%; min-width: 250px; display: flex; flex-direction: column; gap: 7px; overflow: auto; }
        .rbt-panel { border: 1px solid #e5e7eb; border-radius: 12px; padding: 7px; background: #fafafa; display: flex; flex-direction: column; gap: 6px; }
        .rbt-row { display: flex; gap: 5px; flex-wrap: wrap; align-items: center; }
        .rbt-sub { font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: .5px; }
        .rbt-cmds { display: flex; flex-wrap: wrap; gap: 6px; }
        .rbt-cmd {
            flex: 1 1 58px; min-width: 54px; padding: 6px 4px; border-radius: 10px; border: 2px solid #cbd5e1;
            background: #fff; font-weight: 800; cursor: pointer; color: #1f2937;
            display: flex; flex-direction: column; align-items: center; gap: 2px;
            transition: transform .1s, filter .15s; touch-action: manipulation;
        }
        .rbt-cmd:hover { filter: brightness(.95); }
        .rbt-cmd:active { transform: scale(.94); }
        .rbt-cmd .ico { font-size: 22px; line-height: 1; }
        .rbt-cmd small { font-size: 10px; }
        .rbt-cmd.c-F, .rbt-chip.c-F { border-color: #16a34a; background: #f0fdf4; color: #14532d; }
        .rbt-cmd.c-B, .rbt-chip.c-B { border-color: #ea580c; background: #fff7ed; color: #7c2d12; }
        .rbt-cmd.c-L, .rbt-chip.c-L { border-color: #2563eb; background: #eff6ff; color: #1e3a8a; }
        .rbt-cmd.c-R, .rbt-chip.c-R { border-color: #9333ea; background: #faf5ff; color: #581c87; }
        .rbt-cmd.c-N, .rbt-chip.c-N { border-color: #16a34a; background: #f0fdf4; color: #14532d; }
        .rbt-cmd.c-S, .rbt-chip.c-S { border-color: #ea580c; background: #fff7ed; color: #7c2d12; }
        .rbt-cmd.c-E, .rbt-chip.c-E { border-color: #9333ea; background: #faf5ff; color: #581c87; }
        .rbt-cmd.c-O, .rbt-chip.c-O { border-color: #2563eb; background: #eff6ff; color: #1e3a8a; }
        .rbt-cmd.c-rep { border-color: #0d9488; background: #f0fdfa; color: #134e4a; }

        .rbt-prog {
            min-height: 58px; flex: 1 1 auto; display: flex; flex-wrap: wrap; align-content: flex-start; align-items: center;
            gap: 7px 5px; padding: 9px 7px 7px; background: #fff; border: 2px dashed #c7d2fe; border-radius: 10px;
            overflow: auto; position: relative;
        }
        .rbt-prog.ro { border-style: solid; border-color: #ddd6fe; background: #faf5ff; }
        .rbt-chip {
            position: relative; min-width: 36px; height: 40px; padding: 0 6px; box-sizing: border-box;
            border-radius: 8px; border: 2px solid #cbd5e1; background: #fff;
            display: inline-flex; flex-direction: column; align-items: center; justify-content: center;
            font-weight: 800; cursor: pointer; transition: transform .12s, box-shadow .12s;
        }
        .rbt-prog.ro .rbt-chip { cursor: default; }
        .rbt-chip .ico { font-size: 18px; line-height: 1; }
        .rbt-chip small { font-size: 8.5px; line-height: 1.1; }
        .rbt-chip.rep, .rbt-chip.rep-end { flex-direction: row; gap: 4px; border-color: #0d9488; background: #ccfbf1; color: #134e4a; }
        .rbt-chip.rep-end { min-width: 22px; padding: 0 5px; }
        .rbt-prog.ro .rbt-chip.rep-end { cursor: default; }
        .rbt-chip .br { font-size: 20px; font-weight: 900; line-height: 1; }
        .rbt-chip.rep b {
            background: #0d9488; color: #fff; border-radius: 6px; padding: 2px 6px; font-size: 13px; cursor: pointer;
        }
        .rbt-prog.ro .rbt-chip.rep b { cursor: default; }
        .rbt-chip.d1 { box-shadow: 0 4px 0 -1px #5eead4; }
        .rbt-chip.d2 { box-shadow: 0 4px 0 -1px #5eead4, 0 8px 0 -2px #99f6e4; }
        .rbt-chip.d3 { box-shadow: 0 4px 0 -1px #5eead4, 0 8px 0 -2px #99f6e4, 0 12px 0 -3px #ccfbf1; }
        .rbt-num {
            position: absolute; top: -7px; left: -6px; background: #334155; color: #fff;
            font-size: 9px; border-radius: 8px; padding: 0 4px; line-height: 14px; font-weight: 800;
        }
        .rbt-chip.act { outline: 3px solid #f59e0b; outline-offset: 1px; transform: scale(1.1); z-index: 1; }
        .rbt-chip.bad { background: #fee2e2 !important; border-color: #dc2626 !important; color: #7f1d1d !important; }
        .rbt-chip.hint { animation: rbtHint 1s ease-in-out infinite; }
        @keyframes rbtHint { 50% { outline: 3px solid #dc2626; outline-offset: 2px; transform: scale(1.08); } }
        .rbt-caret { width: 3px; height: 40px; background: #6366f1; border-radius: 2px; animation: rbtBlink 1s steps(1) infinite; flex-shrink: 0; }
        @keyframes rbtBlink { 50% { opacity: .2; } }
        .rbt-start {
            font-size: 10px; font-weight: 800; color: #6366f1; background: #eef2ff; border: 1px solid #c7d2fe;
            border-radius: 6px; padding: 3px 6px; cursor: pointer;
        }
        .rbt-empty { font-size: 12px; color: #9ca3af; font-weight: 600; }
        .rbt-count { font-size: 12px; color: #475569; font-weight: 600; }
        .rbt-palette .rbt-tool { font-size: 12px; }
        .rbt-orient button { font-size: 12px; }

        /* Résultat */
        .rbt-info {
            padding: 8px 12px; border-radius: 10px; font-size: 15px; line-height: 1.4; min-height: 24px;
            background: #f3f4f6; border: 1px solid #e5e7eb; color: #374151;
        }
        .rbt-info.ok   { background: #f0fff4; border-color: #b7e4c7; color: #14532d; }
        .rbt-info.warn { background: #fffbea; border-color: #f3e1a0; color: #6b4b00; }
        .rbt-info.ko   { background: #fef2f2; border-color: #fecaca; color: #7f1d1d; }
        .rbt-container.wf-fullboard .rbt-consigne { font-size: 19px; }
        .rbt-container.wf-fullboard .rbt-info { font-size: 18px; }

        /* Aide */
        .rbt-help-btn {
            width: 22px; height: 22px; border-radius: 50%; border: 1px solid #bbb; background: #f5f5f5;
            color: #666; font-size: 12px; font-weight: 700; cursor: pointer;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .rbt-help-btn:hover { background: #e0e0e0; color: #333; }
        .rbt-help-popup {
            display: none; position: absolute; top: 36px; right: 10px; background: #fff;
            border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            padding: 12px 14px; width: 380px; max-width: calc(100% - 20px); max-height: 75%; overflow-y: auto;
            font-size: 11px; color: #444; z-index: 10; line-height: 1.5; box-sizing: border-box;
        }
        .rbt-help-popup.show { display: block; }
        .rbt-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #374151; }
        .rbt-help-popup p { margin: 0 0 6px; }
        .rbt-help-popup p:last-child { margin-bottom: 0; }

        .rbt-resize-handle {
            position: absolute; right: 0; bottom: 0; width: 18px; height: 18px; cursor: se-resize;
            background: linear-gradient(135deg, transparent 50%, #aaa 50%);
            border-radius: 0 0 14px 0; opacity: 0; transition: opacity .2s; z-index: 5;
        }
        .rbt-container:hover .rbt-resize-handle { opacity: 1; }

        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .rbt-container.wf-fullboard {
                left: 40px !important;
                width: calc(100vw - 40px) !important;
                max-width: calc(100vw - 40px) !important;
                height: 100dvh !important;
                min-width: 0 !important;
                padding-left: calc(10px + env(safe-area-inset-left)) !important;
            }
            .rbt-container .rbt-sep { display: none; }
            .rbt-container .rbt-tools { gap: 4px; padding: 4px; }
            .rbt-container .rbt-btn { padding: 4px 8px; }
            .rbt-container .rbt-seg button { padding: 4px 7px; }
            .rbt-container .rbt-consigne, .rbt-container.wf-fullboard .rbt-consigne { font-size: 14px; padding: 6px 8px; gap: 6px; }
            .rbt-container .rbt-consigne .rbt-txt { min-width: 0; }
            .rbt-container .rbt-info, .rbt-container.wf-fullboard .rbt-info { font-size: 14px; padding: 6px 10px; }
            .rbt-container .rbt-main { flex-direction: column; height: auto !important; }
            .rbt-container .rbt-stage { flex: none; }
            .rbt-container .rbt-side { min-width: 0; overflow: visible; flex: none; }
            .rbt-container .rbt-prog { min-height: 50px; max-height: 160px; }
        }
    `;
    document.head.appendChild(s);
})();

// ── Création du widget ────────────────────────────────────────────────────
function createRobotWidget() {
    snapshotNow();
    const pos = findFreePosition();

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'robot';
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
    container.className = 'rbt-container';
    const initW = Math.round(window.innerWidth * 0.7);
    const initH = Math.round(initW * 9 / 16);
    container.style.width = initW + 'px';

    // ── En-tête ───────────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.className = 'rbt-header';
    header.innerHTML = `
        <span class="rbt-title">🤖 Robot à programmer</span>
        <span class="rbt-badge"></span>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    const badge = header.querySelector('.rbt-badge');
    container.appendChild(header);

    // ── Réglages ──────────────────────────────────────────────────────────
    const tools = document.createElement('div');
    tools.className = 'rbt-tools';
    tools.innerHTML = `
        <div class="rbt-seg" data-group="mode">
            ${Object.keys(RB_MODES).map(k => `<button data-mode="${k}" title="${RB_MODES[k].titre}">${RB_MODES[k].lbl}</button>`).join('')}
        </div>
        <span class="rbt-sep"></span>
        <span class="rbt-grp"><span class="rbt-lbl">Niveau</span>
        <div class="rbt-seg" data-group="lvl">
            ${Object.keys(RB_LEVELS).map(k => {
                const L = RB_LEVELS[k];
                return `<button data-lvl="${k}" title="${L.nom} : grille ${L.n}×${L.n}${L.gems ? ', ' + L.gems + ' diamant' + (L.gems > 1 ? 's' : '') : ''}">${k}</button>`;
            }).join('')}
        </div></span>
        <span class="rbt-sep"></span>
        <span class="rbt-grp"><span class="rbt-lbl">Flèches</span>
        <div class="rbt-seg" data-group="abs">
            <button data-abs="0" title="Déplacements relatifs, comme un Bee-Bot : avancer, reculer, tourner à gauche ou à droite (la gauche du robot dépend de son orientation)">🤖 Robot</button>
            <button data-abs="1" title="Déplacements absolus : aller vers le Nord, le Sud, l'Est ou l'Ouest">🧭 Carte</button>
        </div></span>
        <span class="rbt-sep"></span>
        <button class="rbt-btn rbt-btn-grey" data-act="coords" title="Afficher les coordonnées des cases (A1, B4…)">🔤 Coordonnées</button>
        <button class="rbt-btn rbt-btn-grey" data-act="trace" title="Dessiner le chemin parcouru par le robot">〰️ Trace</button>
        <button class="rbt-btn rbt-btn-blue" data-act="new" title="Tirer une nouvelle grille">🎲 Nouvelle grille</button>
    `;
    container.appendChild(tools);

    // ── Consigne ──────────────────────────────────────────────────────────
    const consigne = document.createElement('div');
    consigne.className = 'rbt-consigne';
    consigne.innerHTML = '<span class="rbt-ico"></span><span class="rbt-txt"></span><span class="rbt-pos" title="Position et orientation du robot"></span>';
    const consIco = consigne.querySelector('.rbt-ico');
    const consTxt = consigne.querySelector('.rbt-txt');
    const posEl   = consigne.querySelector('.rbt-pos');
    container.appendChild(consigne);

    // ── Grille + programme ────────────────────────────────────────────────
    const main = document.createElement('div');
    main.className = 'rbt-main';
    main.style.height = Math.round(initH * 0.68) + 'px';

    const stage = document.createElement('div');
    stage.className = 'rbt-stage';
    const board = document.createElement('div');
    board.className = 'rbt-board';
    stage.appendChild(board);
    main.appendChild(stage);

    const side = document.createElement('div');
    side.className = 'rbt-side';
    side.innerHTML = `
        <div class="rbt-panel rbt-palette" data-role="palette">
            <span class="rbt-sub">✏️ Palette : touche les cases</span>
            <div class="rbt-row">
                ${Object.keys(RB_TOOLS).map(k => `<button class="rbt-btn rbt-btn-grey rbt-tool" data-tool="${k}" title="${RB_TOOLS[k].titre || RB_TOOLS[k].lbl}">${RB_TOOLS[k].ico} ${RB_TOOLS[k].lbl}</button>`).join('')}
                <button class="rbt-btn rbt-btn-grey" data-act="empty" title="Vider la grille">🧹 Vider</button>
            </div>
        </div>
        <div class="rbt-panel" data-role="edit">
            <span class="rbt-sub">🧩 Instructions</span>
            <div class="rbt-cmds" data-role="cmds"></div>
            <div class="rbt-row">
                <button class="rbt-btn rbt-btn-grey" data-act="rep" title="Ajouter une boucle : les instructions placées entre [ et ] seront répétées">🔁 Répéter</button>
                <button class="rbt-btn rbt-btn-grey" data-act="del" title="Effacer l'instruction placée avant le curseur (touche Retour arrière)">⌫ Effacer</button>
                <button class="rbt-btn rbt-btn-grey" data-act="clear" title="Effacer tout le programme">🗑 Tout effacer</button>
            </div>
        </div>
        <div class="rbt-panel" style="flex:1 1 auto;min-height:0;">
            <span class="rbt-sub" data-role="prog-title">📜 Mon programme</span>
            <div class="rbt-prog" data-role="prog"></div>
            <div class="rbt-count" data-role="count"></div>
        </div>
        <div class="rbt-panel rbt-orient" data-role="orient">
            <span class="rbt-sub">🧭 À la fin, il regarde vers :</span>
            <div class="rbt-row">
                ${RB_DIRS.map((D, i) => `<button class="rbt-btn rbt-btn-grey" data-ansd="${i}">${['⬆', '➡', '⬇', '⬅'][i]} ${D.nom}</button>`).join('')}
            </div>
        </div>
        <div class="rbt-row" data-role="run">
            <button class="rbt-btn rbt-btn-violet" data-act="check" title="Lancer le programme pour vérifier ta prévision">✓ Vérifier</button>
            <button class="rbt-btn rbt-btn-green" data-act="play" title="Exécuter le programme (touche Entrée)">▶ Lancer</button>
            <button class="rbt-btn rbt-btn-grey" data-act="step" title="Exécuter une seule instruction à la fois">👣 Pas à pas</button>
            <button class="rbt-btn rbt-btn-grey" data-act="reset" title="Remettre le robot sur sa case de départ">↺ Départ</button>
            <div class="rbt-seg" data-group="speed" title="Vitesse du robot">
                <button data-speed="lent" title="Lent">🐢</button>
                <button data-speed="normal" title="Normal">🚶</button>
                <button data-speed="rapide" title="Rapide">🐇</button>
            </div>
        </div>
        <div class="rbt-row" data-role="debug">
            <button class="rbt-btn rbt-btn-grey" data-act="hint" title="Montrer où se trouve l'erreur">💡 Indice</button>
            <button class="rbt-btn rbt-btn-grey" data-act="undo-fix" title="Revenir au programme de départ (avec l'erreur)">↩ Programme de départ</button>
        </div>
    `;
    main.appendChild(side);
    container.appendChild(main);

    const palette  = side.querySelector('[data-role="palette"]');
    const editPan  = side.querySelector('[data-role="edit"]');
    const cmdsEl   = side.querySelector('[data-role="cmds"]');
    const progEl   = side.querySelector('[data-role="prog"]');
    const progTit  = side.querySelector('[data-role="prog-title"]');
    const countEl  = side.querySelector('[data-role="count"]');
    const orientEl = side.querySelector('[data-role="orient"]');
    const runRow   = side.querySelector('[data-role="run"]');
    const debugRow = side.querySelector('[data-role="debug"]');
    const btn = (a) => side.querySelector(`[data-act="${a}"]`);

    const info = document.createElement('div');
    info.className = 'rbt-info';
    container.appendChild(info);

    // ── Aide ──────────────────────────────────────────────────────────────
    const helpBtn = document.createElement('button');
    helpBtn.className = 'rbt-help-btn';
    helpBtn.title = 'Mode d\'emploi';
    helpBtn.textContent = '?';
    const wfBtnsDiv = header.querySelector('.wf-btns');
    wfBtnsDiv.insertBefore(helpBtn, wfBtnsDiv.firstChild);

    const helpPopup = document.createElement('div');
    helpPopup.className = 'rbt-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 Robot à programmer</h4>
        <p><b>4 modes</b> : 🎯 <b>Défi</b> (écrire un programme qui mène le robot au drapeau 🚩 en ramassant
        les diamants 💎), 🔮 <b>Prédire</b> (lire un programme <i>sans le lancer</i> et trouver la case d'arrivée
        et l'orientation du robot), 🐞 <b>Déboguer</b> (un programme contient une erreur : la trouver et la corriger),
        ✏️ <b>Libre</b> (construire son parcours avec la palette 🪨 💎 🚩 🤖).</p>
        <p><b>Flèches</b> : 🤖 <b>Robot</b> = déplacements <b>relatifs</b>, comme un Bee-Bot : avancer, reculer,
        tourner d'un quart de tour (la droite du robot n'est pas forcément la droite de l'écran !).
        🧭 <b>Carte</b> = déplacements <b>absolus</b> vers le Nord, le Sud, l'Est ou l'Ouest.</p>
        <p><b>Programme</b> : chaque bouton ajoute une instruction au <b>curseur</b> (trait violet). Touchez une
        instruction pour placer le curseur juste après, ⌫ efface celle qui est avant le curseur.
        🔁 <b>Répéter</b> crée une boucle <b>[ ]</b> : les instructions placées entre les crochets sont répétées ;
        touchez <b>×2</b> pour changer le nombre de répétitions. Effacer un crochet supprime la boucle mais garde son contenu.
        Au clavier : flèches pour ajouter, Retour arrière pour effacer, Entrée pour lancer.</p>
        <p><b>Exécution</b> : ▶ Lancer, 👣 Pas à pas (une instruction à la fois, pour chercher une erreur),
        ↺ Départ, vitesse 🐢 🚶 🐇. L'instruction en cours est entourée en orange.</p>
        <p><b>Niveaux</b> : 1 = 5×5, 2 = 6×6 avec un diamant, 3 = 7×7 avec deux diamants (pensez à Répéter),
        4 = 8×8 avec trois diamants. ⭐⭐⭐ = programme le plus court possible (on compte chaque bloc, une boucle compte pour un).</p>
        <p><b>Repérage</b> : 🔤 Coordonnées affiche les lettres des colonnes et les numéros des lignes ;
        la position du robot s'écrit « C4 · Nord ». 〰️ Trace dessine le chemin parcouru.</p>
    `;
    container.appendChild(helpPopup);

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'rbt-resize-handle';
    container.appendChild(resizeHandle);

    widget.appendChild(container);

    // ── État interne ──────────────────────────────────────────────────────
    let mode = 'defi';
    let lvlId = 1;
    let abs = false;
    let speed = 'normal';
    let showCoords = true;
    let showTrace = true;
    let tool = 'rock';
    let grid = _rbBlankGrid(5);
    let optLen = 0;               // longueur du programme le plus court (défi / déboguer)
    let prog = [];
    let cursor = 0;
    let pred = { ans: null, ansD: null, checked: false };
    let bug = { orig: null, idx: -1, idx2: -1, kind: '', shown: false };
    let lastMsg = null;

    // Exécution
    let rob = { x: 0, y: 0, d: 0 }, angle = 0;
    let got = new Set(), trace = [];
    let steps = [], ptr = 0, status = 'idle';   // idle | run | pause | done | crash
    let crashInfo = null;
    let timer = null, finishTimer = null, bumpTimer = null;

    // Éléments de la grille (recréés par renderBoard)
    let fieldEl = null, cellsEl = null, traceLine = null, traceSvg = null, robotEl = null, botIn = null;

    const L = () => RB_LEVELS[lvlId];
    const cmdSet = () => abs ? RB_SET.abs : RB_SET.rel;
    const dur = () => Math.round(RB_SPEEDS[speed] * 0.8);
    function save() { if (typeof saveBoard === 'function') saveBoard(); }
    function msg(cls, html) { lastMsg = { cls, html }; renderInfo(); }

    // ── Nouvelle partie ───────────────────────────────────────────────────
    function newGame() {
        const lv = L(), set = cmdSet();
        prog = []; cursor = 0; optLen = 0;
        pred = { ans: null, ansD: null, checked: false };
        bug = { orig: null, idx: -1, idx2: -1, kind: '', shown: false };
        if (mode === 'defi') {
            const g = _rbGenDefi(lv, set);
            grid = g.grid; optLen = g.sol.length;
        } else if (mode === 'debug') {
            let made = null;
            for (let t = 0; t < 10 && !made; t++) {
                const g = _rbGenDefi(lv, set);
                const ok = _rbCompress(g.sol, lv.rep);
                const b = _rbInjectBug(g.grid, ok, set);
                if (b) made = { g, ok, b };
            }
            if (made) {
                grid = made.g.grid; optLen = made.g.sol.length;
                prog = made.b.prog;
                bug = { orig: _rbCopyProg(made.b.prog), idx: made.b.idx, idx2: made.b.idx2, kind: made.b.kind, shown: false };
            } else {
                const g = _rbGenDefi(lv, set);
                grid = g.grid; optLen = g.sol.length;
                prog = _rbCompress(g.sol, lv.rep).slice(0, -1);
                bug = { orig: _rbCopyProg(prog), idx: prog.length - 1, idx2: -1, kind: 'missing', shown: false };
            }
            cursor = prog.length;
        } else if (mode === 'predire') {
            const g = _rbGenPredict(lv, set);
            grid = g.grid; prog = g.prog; cursor = prog.length;
        } else {
            grid = _rbBlankGrid(lv.n);
        }
        lastMsg = null;
        resetRun();
        renderAll();
        save();
    }

    // ── Exécution du programme ────────────────────────────────────────────
    function clearTimers() {
        clearTimeout(timer); clearTimeout(finishTimer); clearTimeout(bumpTimer);
        timer = finishTimer = bumpTimer = null;
    }
    function resetRun() {
        clearTimers();
        status = 'idle'; ptr = 0; steps = []; crashInfo = null;
        rob = { x: grid.start.x, y: grid.start.y, d: grid.start.d };
        angle = rob.d * 90;
        got = new Set();
        trace = [[rob.x, rob.y]];
        if (robotEl) {
            robotEl.classList.remove('win');
            botIn.className = 'rbt-bot-in';
            placeRobot(true);
            updateCells();
            updateTrace();
            setActive(-1);
            progEl.querySelectorAll('.bad').forEach(c => c.classList.remove('bad'));
        }
        updatePos();
        renderRunBtns();
    }
    function prepare() {
        const ex = _rbStepsOf(prog);
        if (!ex.steps.length) {
            msg('warn', mode === 'predire' ? '⚠️ Ce programme est vide.' : '⚠️ Ton programme est vide : ajoute d\'abord des instructions avec les boutons.');
            return false;
        }
        if (ex.over) {
            msg('warn', `⚠️ Avec ses boucles, ce programme ferait plus de ${RB_MAX_STEPS} actions : diminue le nombre de répétitions.`);
            return false;
        }
        steps = ex.steps; ptr = 0;
        lastMsg = { cls: '', html: '▶ Le robot exécute le programme… Observe bien l\'instruction entourée en orange.' };
        renderInfo();
        return true;
    }
    function play() {
        if (status === 'run') { pause(); return; }
        if (status === 'done' || status === 'crash') resetRun();
        if (status === 'idle' && !prepare()) return;
        status = 'run';
        renderRunBtns();
        tick();
    }
    function pause() {
        clearTimeout(timer); timer = null;
        if (status === 'run') status = 'pause';
        renderRunBtns();
    }
    function stepOnce() {
        if (status === 'run') { pause(); return; }
        if (status === 'done' || status === 'crash') resetRun();
        if (status === 'idle' && !prepare()) return;
        status = 'pause';
        doStep();
        renderRunBtns();
    }
    function tick() {
        if (status !== 'run') return;
        doStep();
        if (status === 'run') timer = setTimeout(tick, RB_SPEEDS[speed]);
        renderRunBtns();
    }
    function doStep() {
        if (ptr >= steps.length) { status = 'done'; finish(); return; }
        const st = steps[ptr];
        setActive(st.idx);
        const r = _rbMove(rob, st.c);
        if (r.turn) angle += r.turn * 90;
        if (r.move) {
            const out = r.x < 0 || r.y < 0 || r.x >= grid.n || r.y >= grid.n;
            const rock = !out && grid.obst.some(p => p[0] === r.x && p[1] === r.y);
            if (out || rock) {
                rob.d = r.d;
                placeRobot(false);
                const cls = r.move > 0 ? 'bump-f' : 'bump-b';
                bumpTimer = setTimeout(() => { botIn.className = 'rbt-bot-in'; void botIn.offsetWidth; botIn.className = 'rbt-bot-in ' + cls; }, r.turn ? dur() : 0);
                crashInfo = { idx: st.idx, c: st.c, why: out ? 'out' : 'rock', x: r.x, y: r.y };
                const chip = progEl.querySelector(`[data-i="${st.idx}"]`);
                if (chip) chip.classList.add('bad');
                ptr++;
                status = 'crash';
                clearTimeout(timer); timer = null;
                finishTimer = setTimeout(finish, (r.turn ? dur() : 0) + 450);
                updatePos();
                return;
            }
        }
        rob = { x: r.x, y: r.y, d: r.d };
        if (r.move) {
            trace.push([r.x, r.y]);
            const gi = grid.gems.findIndex(p => p[0] === r.x && p[1] === r.y);
            if (gi >= 0 && !got.has(gi)) { got.add(gi); setTimeout(updateCells, Math.round(dur() * 0.7)); }
        }
        placeRobot(false);
        updateTrace();
        updatePos();
        ptr++;
        if (ptr >= steps.length) {
            status = 'done';
            clearTimeout(timer); timer = null;
            finishTimer = setTimeout(finish, dur() + 80);
        }
    }
    function rating(count) { return count <= optLen ? 3 : (count <= optLen + 3 ? 2 : 1); }
    function finish() {
        finishTimer = null;
        if (status !== 'crash') setActive(-1);
        const nums = _rbNums(prog);
        const here = `<b>${_rbCase(rob.x, rob.y)}</b>, tourné vers <b>${RB_DIRS[rob.d].le}</b>`;
        if (mode === 'predire') {
            const okPos = pred.ans && pred.ans[0] === rob.x && pred.ans[1] === rob.y;
            const okD = abs || pred.ansD === rob.d;
            if (okPos && okD) {
                robotEl.classList.add('win');
                msg('ok', `🌟 Bravo, tu avais bien prévu ! Le robot s'arrête en ${here}.`);
            } else {
                let det;
                if (okPos) det = ' La case était juste, mais pas l\'orientation.';
                else det = pred.ans ? ` (tu avais choisi ${_rbCase(pred.ans[0], pred.ans[1])}).` : '.';
                msg('warn', `🤔 Pas tout à fait : le robot s'arrête en ${here}${det} Suis la trace et clique sur 👣 pour revoir le programme instruction par instruction.`);
            }
        } else if (status === 'crash' && crashInfo) {
            const C = RB_CMD[crashInfo.c];
            const what = crashInfo.why === 'out' ? 'sortirait de la grille' : `heurte un rocher 🪨 en ${_rbCase(crashInfo.x, crashInfo.y)}`;
            msg('ko', `💥 Aïe ! À l'instruction n°${nums[crashInfo.idx]} (« ${C.lbl} »), le robot ${what}. Il s'arrête en ${_rbCase(rob.x, rob.y)}. Corrige ton programme puis relance-le.`);
        } else if (!grid.flag) {
            msg('', `🏁 Programme terminé : le robot est en ${here}.`);
        } else {
            const res = { crash: -1, pos: rob, got };
            const count = _rbCount(prog);
            if (_rbIsWin(grid, res)) {
                robotEl.classList.add('win');
                if (mode === 'libre') { const s = _rbSolve(grid, cmdSet()); optLen = s ? s.length : count; }
                const st = rating(count);
                const etoiles = '⭐'.repeat(st) + '☆'.repeat(3 - st);
                let det;
                if (count < optLen) det = ` : encore plus court que prévu grâce à 🔁 Répéter !`;
                else if (count === optLen) det = ' : c\'est le programme le plus court possible !';
                else det = ` (le plus court en a ${optLen} : sauras-tu le raccourcir ?)`;
                const bravo = mode === 'debug' ? '🛠️ Bug corrigé, le robot est arrivé au drapeau !' : 'Bravo, le robot est arrivé au drapeau !';
                msg('ok', `${etoiles} ${bravo} Ton programme utilise <b>${count}</b> instruction${count > 1 ? 's' : ''}${det}`);
            } else if (rob.x === grid.flag[0] && rob.y === grid.flag[1]) {
                const k = grid.gems.length - got.size;
                msg('warn', `💎 Le robot est bien sur le drapeau, mais il manque ${k} diamant${k > 1 ? 's' : ''} à ramasser en chemin.`);
            } else {
                msg('warn', `🏁 Programme terminé : le robot est en ${here}, ce n'est pas le drapeau 🚩 (${_rbCase(grid.flag[0], grid.flag[1])}). Observe la trace et corrige ton programme.`);
            }
        }
        renderRunBtns();
    }

    // ── Rendu : réglages et consigne ──────────────────────────────────────
    function renderBars() {
        tools.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
        tools.querySelectorAll('[data-lvl]').forEach(b => b.classList.toggle('active', +b.dataset.lvl === lvlId));
        tools.querySelectorAll('[data-abs]').forEach(b => b.classList.toggle('active', (b.dataset.abs === '1') === abs));
        tools.querySelector('[data-act="coords"]').classList.toggle('on', showCoords);
        tools.querySelector('[data-act="trace"]').classList.toggle('on', showTrace);
        tools.querySelector('[data-act="new"]').innerHTML = mode === 'libre' ? '🎲 Grille vide' : '🎲 Nouvelle grille';
        palette.style.display = mode === 'libre' ? '' : 'none';
        palette.querySelectorAll('[data-tool]').forEach(b => b.classList.toggle('on', b.dataset.tool === tool));
        editPan.style.display = mode === 'predire' ? 'none' : '';
        progTit.textContent = mode === 'predire' ? '📜 Le programme à lire' : (mode === 'debug' ? '📜 Le programme à corriger' : '📜 Mon programme');
        orientEl.style.display = (mode === 'predire' && !abs) ? '' : 'none';
        orientEl.querySelectorAll('[data-ansd]').forEach(b => {
            b.classList.toggle('on', pred.ansD === +b.dataset.ansd);
            b.disabled = pred.checked;
        });
        debugRow.style.display = mode === 'debug' ? '' : 'none';
        runRow.querySelectorAll('[data-speed]').forEach(b => b.classList.toggle('active', b.dataset.speed === speed));
        const predWait = mode === 'predire' && !pred.checked;
        btn('check').style.display = mode === 'predire' ? '' : 'none';
        btn('check').disabled = pred.checked;
        ['play', 'step', 'reset'].forEach(a => { btn(a).style.display = predWait ? 'none' : ''; });
        renderRunBtns();
    }
    function renderRunBtns() {
        const p = btn('play');
        p.innerHTML = status === 'run' ? '⏸ Pause' : '▶ Lancer';
        p.classList.toggle('rbt-btn-green', status !== 'run');
        p.classList.toggle('rbt-btn-grey', status === 'run');
    }
    function renderCmds() {
        cmdsEl.innerHTML = cmdSet().map(c => {
            const C = RB_CMD[c];
            return `<button class="rbt-cmd c-${c}" data-cmd="${c}" title="${_rbEsc(C.titre)}"><span class="ico">${C.ico}</span><small>${C.lbl}</small></button>`;
        }).join('');
    }
    function gemsTxt() {
        const k = grid.gems.length;
        if (!k) return '';
        return k > 1 ? ` en ramassant les <b>${k} diamants 💎</b>` : ' en ramassant le <b>diamant 💎</b>';
    }
    function renderConsigne() {
        consIco.textContent = RB_MODES[mode].ico;
        let t;
        if (mode === 'defi') {
            t = `Programme le robot pour qu'il atteigne le drapeau 🚩${gemsTxt()}, sans toucher les rochers 🪨. Programme le plus court : <b>${optLen}</b> instructions.`;
        } else if (mode === 'debug') {
            t = `Ce programme devait mener le robot au drapeau 🚩${gemsTxt()}, mais <b>une erreur</b> s'y est glissée. Lance-le, observe où ça se passe mal, puis corrige-le.`;
        } else if (mode === 'predire') {
            t = `Lis le programme <b>sans le lancer</b> : sur quelle case le robot va-t-il s'arrêter${abs ? '' : ' et vers où regardera-t-il'} ? Touche la case${abs ? '' : ', choisis son orientation'}, puis clique sur <b>✓ Vérifier</b>.`;
        } else {
            t = 'Construis ton parcours avec la palette (🪨 rochers, 💎 diamants, 🚩 arrivée, 🤖 départ), puis écris le programme du robot. Tu peux aussi inventer un défi pour un camarade !';
        }
        consTxt.innerHTML = t;
        badge.textContent = `Niv. ${lvlId} · ${grid.n}×${grid.n} · ${abs ? '🧭 Carte' : '🤖 Robot'}`;
    }
    function updatePos() {
        posEl.textContent = showCoords ? `🤖 ${_rbCase(rob.x, rob.y)} · ${RB_DIRS[rob.d].nom}` : `🤖 ${RB_DIRS[rob.d].nom}`;
    }

    // ── Rendu : grille ────────────────────────────────────────────────────
    function renderBoard() {
        const n = grid.n;
        board.style.setProperty('--n', n);
        board.classList.toggle('coords', showCoords);
        let h = '';
        if (showCoords) {
            h += `<div class="rbt-corner" title="Le Nord est en haut">N↑</div>`;
            h += `<div class="rbt-labs-x">${Array.from({ length: n }, (_, i) => `<span>${String.fromCharCode(65 + i)}</span>`).join('')}</div>`;
            h += `<div class="rbt-labs-y">${Array.from({ length: n }, (_, i) => `<span>${i + 1}</span>`).join('')}</div>`;
        }
        h += `<div class="rbt-field">
                <div class="rbt-cells"></div>
                <svg class="rbt-trace" viewBox="0 0 ${n} ${n}" preserveAspectRatio="none"><polyline points=""/></svg>
                <div class="rbt-robot rbt-noanim"><div class="rbt-bot-in">${RB_BOT_SVG}</div></div>
              </div>`;
        board.innerHTML = h;
        fieldEl   = board.querySelector('.rbt-field');
        cellsEl   = board.querySelector('.rbt-cells');
        traceSvg  = board.querySelector('.rbt-trace');
        traceLine = traceSvg.querySelector('polyline');
        robotEl   = board.querySelector('.rbt-robot');
        botIn     = board.querySelector('.rbt-bot-in');
        fieldEl.style.setProperty('--dur', dur() + 'ms');
        updateCells();
        placeRobot(true);
        updateTrace();
        fit();
    }
    function updateCells() {
        if (!cellsEl) return;
        const n = grid.n;
        const ob = new Set(grid.obst.map(p => _rbKey(p[0], p[1])));
        const gm = new Map(grid.gems.map((p, i) => [_rbKey(p[0], p[1]), i]));
        const editable = mode === 'libre' || (mode === 'predire' && !pred.checked);
        let h = '';
        for (let y = 0; y < n; y++) {
            for (let x = 0; x < n; x++) {
                const k = _rbKey(x, y);
                const cls = ['rbt-cell'];
                if ((x + y) % 2) cls.push('alt');
                if (editable) cls.push('edit');
                let inner = '';
                if (ob.has(k)) { cls.push('rock'); inner = '<span class="rbt-it">🪨</span>'; }
                else if (gm.has(k)) { if (got.has(gm.get(k))) cls.push('got'); inner = '<span class="rbt-it">💎</span>'; }
                else if (grid.flag && grid.flag[0] === x && grid.flag[1] === y) { cls.push('flag'); inner = '<span class="rbt-it">🚩</span>'; }
                if (grid.start.x === x && grid.start.y === y) cls.push('start');
                if (mode === 'predire' && pred.ans && pred.ans[0] === x && pred.ans[1] === y) {
                    cls.push('ans');
                    inner = (!abs && pred.ansD != null)
                        ? `<span class="rbt-ans" style="transform:rotate(${pred.ansD * 90}deg)">⬆</span>`
                        : '<span class="rbt-ans">?</span>';
                }
                h += `<div class="${cls.join(' ')}" data-x="${x}" data-y="${y}" title="${_rbCase(x, y)}">${inner}</div>`;
            }
        }
        cellsEl.innerHTML = h;
    }
    function placeRobot(noAnim) {
        if (!robotEl) return;
        if (noAnim) robotEl.classList.add('rbt-noanim');
        robotEl.style.setProperty('--x', rob.x);
        robotEl.style.setProperty('--y', rob.y);
        robotEl.style.setProperty('--a', angle);
        if (noAnim) { void robotEl.offsetWidth; robotEl.classList.remove('rbt-noanim'); }
    }
    function updateTrace() {
        if (!traceLine) return;
        traceSvg.style.display = showTrace ? '' : 'none';
        traceLine.setAttribute('points', trace.map(p => (p[0] + 0.5) + ',' + (p[1] + 0.5)).join(' '));
    }
    // Taille des cases : la plus grande possible dans la zone
    function fit() {
        const col = getComputedStyle(main).flexDirection === 'column';
        if (col) {
            const w = stage.clientWidth || main.clientWidth;
            stage.style.height = Math.max(200, Math.min(w, Math.round(window.innerHeight * 0.5))) + 'px';
        } else if (stage.style.height) {
            stage.style.height = '';
        }
        const W = stage.clientWidth - 16, H = stage.clientHeight - 16;
        if (W <= 0 || H <= 0) return;
        const lab = showCoords ? 0.6 : 0;
        const c = Math.max(22, Math.min(140, Math.floor(Math.min(W / (grid.n + lab), H / (grid.n + lab)) - 1)));
        board.style.setProperty('--c', c + 'px');
    }

    // ── Rendu : programme ─────────────────────────────────────────────────
    function renderProg() {
        const ro = mode === 'predire';
        progEl.classList.toggle('ro', ro);
        const nums = _rbNums(prog);
        const hintOn = mode === 'debug' && bug.shown && bug.orig && JSON.stringify(prog) === JSON.stringify(bug.orig);
        let h = ro ? '' : '<span class="rbt-start" data-cur="0" title="Placer le curseur au début du programme">début</span>';
        if (!ro && cursor === 0) h += '<span class="rbt-caret"></span>';
        let depth = 0;
        prog.forEach((t, i) => {
            let cls, inner, title;
            if (t.c === '(') {
                cls = 'rep';
                title = `Répéter ${t.n} fois les instructions entre [ et ]`;
                inner = `<span class="rbt-num">${nums[i]}</span><span class="ico">🔁</span><b data-rep="${i}" title="${ro ? '' : 'Touche pour changer le nombre de répétitions'}">×${t.n}</b><span class="br">[</span>`;
            } else if (t.c === ')') {
                depth = Math.max(0, depth - 1);
                cls = 'rep-end';
                title = 'Fin de la boucle';
                inner = '<span class="br">]</span>';
            } else {
                const C = RB_CMD[t.c];
                cls = 'c-' + t.c;
                title = C.titre;
                inner = `<span class="rbt-num">${nums[i]}</span><span class="ico">${C.ico}</span><small>${C.lbl}</small>`;
            }
            const hint = hintOn && (i === bug.idx || i === bug.idx2) ? ' hint' : '';
            h += `<span class="rbt-chip ${cls} d${Math.min(depth, 3)}${hint}" data-i="${i}" title="${_rbEsc(title)}">${inner}</span>`;
            if (t.c === '(') depth++;
            if (!ro && cursor === i + 1) h += '<span class="rbt-caret"></span>';
        });
        if (!prog.length && !ro) h += '<span class="rbt-empty">Programme vide : ajoute des instructions avec les boutons.</span>';
        progEl.innerHTML = h;
        const caret = progEl.querySelector('.rbt-caret');
        if (caret) scrollIntoProg(caret);
    }
    function scrollIntoProg(el) {
        const top = el.offsetTop, bot = top + el.offsetHeight;
        if (top < progEl.scrollTop) progEl.scrollTop = top - 8;
        else if (bot > progEl.scrollTop + progEl.clientHeight) progEl.scrollTop = bot - progEl.clientHeight + 8;
    }
    function setActive(idx) {
        progEl.querySelectorAll('.rbt-chip.act').forEach(c => c.classList.remove('act'));
        if (idx < 0) return;
        const chip = progEl.querySelector(`[data-i="${idx}"]`);
        if (chip) { chip.classList.add('act'); scrollIntoProg(chip); }
    }
    function renderCount() {
        const n = _rbCount(prog);
        let h = `<b>${n}</b> instruction${n > 1 ? 's' : ''}`;
        if ((mode === 'defi' || mode === 'debug') && optLen) h += ` · le plus court : <b>${optLen}</b>`;
        if (mode !== 'predire' && prog.length >= RB_MAX_TOK) h += ' · programme plein';
        countEl.innerHTML = h;
    }
    function renderInfo() {
        let cls = '', html;
        if (lastMsg) { cls = lastMsg.cls; html = lastMsg.html; }
        else if (mode === 'predire') {
            html = !pred.ans
                ? '🔮 Suis le programme dans ta tête (ou avec ton doigt), puis touche la case où le robot va s\'arrêter.'
                : `Ta prévision : <b>${_rbCase(pred.ans[0], pred.ans[1])}</b>${(!abs && pred.ansD != null) ? ', tourné vers <b>' + RB_DIRS[pred.ansD].le + '</b>' : ''}. ${(!abs && pred.ansD == null) ? 'Choisis aussi son orientation, puis' : 'Clique sur'} <b>✓ Vérifier</b>.`;
        } else if (mode === 'debug') {
            html = '🐞 Lance le programme (ou avance 👣 pas à pas) pour voir où il se trompe. Touche une instruction pour placer le curseur juste après, ⌫ pour l\'effacer.';
        } else if (mode === 'libre') {
            html = '✏️ Choisis un outil de la palette et touche les cases de la grille. Touche le robot 🤖 avec l\'outil Départ pour le faire tourner.';
        } else {
            html = prog.length
                ? '📜 Clique sur <b>▶ Lancer</b> pour tester ton programme, ou sur <b>👣 Pas à pas</b> pour l\'exécuter instruction par instruction.'
                : '👆 Ajoute des instructions avec les boutons (ou les flèches du clavier), puis clique sur <b>▶ Lancer</b>.';
        }
        info.className = 'rbt-info' + (cls ? ' ' + cls : '');
        info.innerHTML = html;
    }
    function renderAll() {
        renderBars();
        renderCmds();
        renderConsigne();
        renderBoard();
        renderProg();
        renderCount();
        renderInfo();
        updatePos();
        if (_isMax) requestAnimationFrame(fitFullHeight);
    }

    // ── Modification du programme ─────────────────────────────────────────
    function progChanged() {
        resetRun();
        lastMsg = null;
        renderProg();
        renderCount();
        renderInfo();
        save();
    }
    function full(k) {
        if (prog.length + k > RB_MAX_TOK) { msg('warn', `⚠️ Le programme est plein (${RB_MAX_TOK} blocs au maximum). Utilise 🔁 Répéter pour le raccourcir !`); return true; }
        return false;
    }
    function addCmd(c) {
        if (mode === 'predire' || !RB_CMD[c] || full(1)) return;
        prog.splice(cursor, 0, { c });
        cursor++;
        progChanged();
    }
    function addRep() {
        if (mode === 'predire' || full(2)) return;
        prog.splice(cursor, 0, { c: '(', n: 2 }, { c: ')' });
        cursor++;
        progChanged();
    }
    function delCmd() {
        if (mode === 'predire' || cursor <= 0) return;
        const i = cursor - 1, t = prog[i];
        if (t.c === '(' || t.c === ')') {
            const j = _rbMatch(prog, i);
            if (j >= 0) {
                prog.splice(Math.max(i, j), 1);
                prog.splice(Math.min(i, j), 1);
                cursor = t.c === '(' ? i : i - 1;
            } else { prog.splice(i, 1); cursor = i; }
        } else {
            prog.splice(i, 1);
            cursor = i;
        }
        cursor = Math.max(0, Math.min(cursor, prog.length));
        progChanged();
    }

    // ── Palette (mode Libre) et prévision (mode Prédire) ──────────────────
    function cellClick(x, y) {
        if (mode === 'predire') {
            if (pred.checked) return;
            pred.ans = [x, y];
            lastMsg = null;
            updateCells(); renderInfo(); save();
            return;
        }
        if (mode !== 'libre') return;
        const same = (p) => p[0] === x && p[1] === y;
        const isStart = grid.start.x === x && grid.start.y === y;
        const clearCell = () => {
            grid.obst = grid.obst.filter(p => !same(p));
            grid.gems = grid.gems.filter(p => !same(p));
            if (grid.flag && same(grid.flag)) grid.flag = null;
        };
        if (tool === 'start') {
            if (isStart) grid.start.d = (grid.start.d + 1) % 4;
            else { clearCell(); grid.start.x = x; grid.start.y = y; }
        } else if (isStart) {
            msg('warn', '🤖 Le robot est sur cette case : choisis l\'outil « Départ » pour le déplacer ou le faire tourner.');
            return;
        } else if (tool === 'rock') {
            const had = grid.obst.some(same);
            clearCell();
            if (!had) grid.obst.push([x, y]);
        } else if (tool === 'gem') {
            const had = grid.gems.some(same);
            if (!had && grid.gems.length >= RB_MAX_GEMS) { msg('warn', `💎 ${RB_MAX_GEMS} diamants au maximum.`); return; }
            clearCell();
            if (!had) grid.gems.push([x, y]);
        } else if (tool === 'flag') {
            const had = grid.flag && same(grid.flag);
            clearCell();
            grid.flag = had ? null : [x, y];
        } else {
            clearCell();
        }
        lastMsg = null;
        resetRun();
        renderInfo();
        save();
    }
    function verify() {
        if (mode !== 'predire' || pred.checked) return;
        if (!pred.ans) { msg('warn', '👆 Touche d\'abord la case où le robot va s\'arrêter.'); return; }
        if (!abs && pred.ansD == null) { msg('warn', '🧭 Choisis aussi vers où le robot regardera à la fin.'); return; }
        pred.checked = true;
        resetRun();
        renderBars();
        updateCells();
        if (!prepare()) return;
        status = 'run';
        renderRunBtns();
        tick();
        save();
    }
    function showHint() {
        if (mode !== 'debug' || !bug.orig) return;
        const same = JSON.stringify(prog) === JSON.stringify(bug.orig);
        bug.shown = true;
        const nums = _rbNums(bug.orig);
        let h;
        if (bug.kind === 'swap') h = `💡 Deux instructions voisines ont été inversées : les n°${nums[bug.idx]} et n°${nums[bug.idx2]}.`;
        else if (bug.kind === 'rep') h = `💡 Regarde la boucle n°${nums[bug.idx]} : le nombre de répétitions n'est pas le bon.`;
        else if (bug.kind === 'missing') h = '💡 Le programme s\'arrête trop tôt : il manque la fin !';
        else h = `💡 Une seule instruction est fausse : la n°${nums[bug.idx]}. Par quoi faut-il la remplacer ?`;
        if (!same) h += ' (numéros du programme de départ : clique sur ↩ pour le retrouver)';
        renderProg();
        msg('warn', h);
        save();
    }
    function undoFix() {
        if (mode !== 'debug' || !bug.orig) return;
        prog = _rbCopyProg(bug.orig);
        cursor = prog.length;
        progChanged();
    }

    // ── Événements ────────────────────────────────────────────────────────
    progEl.addEventListener('click', (e) => {
        e.stopPropagation();
        if (mode === 'predire') return;
        const rb = e.target.closest('[data-rep]');
        if (rb) {
            const t = prog[+rb.dataset.rep];
            if (t && t.c === '(') { t.n = t.n >= 9 ? 2 : t.n + 1; cursor = +rb.dataset.rep + 1; progChanged(); }
            return;
        }
        if (e.target.closest('[data-cur]')) { cursor = 0; renderProg(); save(); return; }
        const chip = e.target.closest('[data-i]');
        if (chip) { cursor = +chip.dataset.i + 1; renderProg(); save(); return; }
        cursor = prog.length; renderProg();
    });

    board.addEventListener('click', (e) => {
        e.stopPropagation();
        const cell = e.target.closest('.rbt-cell');
        if (cell) cellClick(+cell.dataset.x, +cell.dataset.y);
    });

    container.addEventListener('click', (e) => {
        const b = e.target.closest('[data-act],[data-mode],[data-lvl],[data-abs],[data-cmd],[data-speed],[data-tool],[data-ansd]');
        if (!b || !container.contains(b) || progEl.contains(b) || board.contains(b)) return;
        e.stopPropagation();
        if (b.disabled) return;
        const ds = b.dataset;
        if (ds.mode) { if (ds.mode !== mode) { mode = ds.mode; newGame(); } return; }
        if (ds.lvl)  { lvlId = +ds.lvl; newGame(); return; }
        if (ds.abs)  { const a = ds.abs === '1'; if (a !== abs) { abs = a; newGame(); } return; }
        if (ds.cmd)  { addCmd(ds.cmd); return; }
        if (ds.speed) {
            speed = ds.speed;
            if (fieldEl) fieldEl.style.setProperty('--dur', dur() + 'ms');
            renderBars(); save(); return;
        }
        if (ds.tool) { tool = ds.tool; renderBars(); save(); return; }
        if (ds.ansd) {
            if (pred.checked) return;
            pred.ansD = +ds.ansd; lastMsg = null;
            renderBars(); updateCells(); renderInfo(); save(); return;
        }
        switch (ds.act) {
            case 'new': newGame(); break;
            case 'coords': showCoords = !showCoords; renderBars(); renderBoard(); updatePos(); save(); break;
            case 'trace': showTrace = !showTrace; renderBars(); updateTrace(); save(); break;
            case 'rep': addRep(); break;
            case 'del': delCmd(); break;
            case 'clear': if (mode !== 'predire') { prog = []; cursor = 0; progChanged(); } break;
            case 'play': play(); break;
            case 'step': stepOnce(); break;
            case 'reset': resetRun(); lastMsg = null; renderInfo(); break;
            case 'check': verify(); break;
            case 'hint': showHint(); break;
            case 'undo-fix': undoFix(); break;
            case 'empty':
                if (mode === 'libre') { grid = { n: grid.n, start: grid.start, flag: null, obst: [], gems: [] }; lastMsg = null; resetRun(); renderInfo(); save(); }
                break;
        }
    });

    // Clavier : flèches = instructions, Retour arrière = effacer, Entrée = lancer
    widget.addEventListener('keydown', (e) => {
        const tag = (e.target && e.target.tagName) || '';
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.ctrlKey || e.metaKey || e.altKey) return;
        if (container.classList.contains('wf-minimized')) return;
        let done = false;
        const c = RB_KEYS[abs ? 'abs' : 'rel'][e.key];
        if (c && mode !== 'predire') { addCmd(c); done = true; }
        else if (e.key === 'Backspace' && mode !== 'predire') { delCmd(); done = true; }
        else if (e.key === 'Enter') { if (mode === 'predire' && !pred.checked) verify(); else play(); done = true; }
        if (done) { e.preventDefault(); e.stopPropagation(); }
    });

    // Les zones de travail ne déplacent pas le widget
    [tools, consigne, main, info, helpPopup].forEach(el => {
        el.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            if (!widget.contains(document.activeElement)) { try { widget.focus({ preventScroll: true }); } catch (err) {} }
        });
        el.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
    });

    helpBtn.addEventListener('click', (e) => { e.stopPropagation(); helpPopup.classList.toggle('show'); });
    function onDocClick() { helpPopup.classList.remove('show'); }
    document.addEventListener('click', onDocClick);

    // ── Redimensionnement libre (largeur + hauteur de la zone de jeu) ─────
    function startResize(x0, y0) {
        const startW = container.offsetWidth, startH = main.offsetHeight;
        return (x, y) => {
            container.style.width = Math.max(520, startW + x - x0) + 'px';
            main.style.height     = Math.max(220, startH + y - y0) + 'px';
            fit();
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

    let _ro = null;
    if (typeof ResizeObserver === 'function') { _ro = new ResizeObserver(() => fit()); _ro.observe(stage); }
    function cleanup() {
        clearTimers();
        window.removeEventListener('resize', onWinResize);
        document.removeEventListener('click', onDocClick);
        if (_ro) _ro.disconnect();
    }
    function onWinResize() {
        if (!document.body.contains(widget)) { cleanup(); return; }
        if (_isMax) fitFullHeight();
        fit();
    }
    window.addEventListener('resize', onWinResize);

    // ── Boutons fenêtre ───────────────────────────────────────────────────
    const wfMin   = header.querySelector('[data-role="wf-min"]');
    const wfMax   = header.querySelector('[data-role="wf-max"]');
    const wfClose = header.querySelector('[data-role="wf-close"]');
    let _savedW = null, _savedH = null;
    let _isMax = false;

    function fitFullHeight() {
        if (getComputedStyle(main).flexDirection === 'column') { fit(); return; }
        const others = [header, tools, consigne, info].reduce((a, el) => a + (el.offsetHeight || 0), 0);
        const avail = window.innerHeight - others - 9 * 4 - 30;
        main.style.height = Math.max(220, Math.round(avail)) + 'px';
        fit();
    }

    wfMin.addEventListener('click', (e) => {
        e.stopPropagation();
        if (_isMax) wfMax.click();
        if (typeof window._wfMiniBarCollapse === 'function') {
            window._wfMiniBarCollapse(widget, '🤖 Robot à programmer', { onExpand: () => requestAnimationFrame(fit) });
        } else {
            container.classList.toggle('wf-minimized');
            requestAnimationFrame(fit);
        }
    });

    wfMax.addEventListener('click', (e) => {
        e.stopPropagation();
        _isMax = !_isMax;
        if (_isMax) {
            _savedW = container.style.width;
            _savedH = main.style.height;
            container.classList.add('wf-fullboard');
            requestAnimationFrame(fitFullHeight);
        } else {
            container.classList.remove('wf-fullboard');
            if (_savedW) container.style.width = _savedW;
            if (_savedH) main.style.height = _savedH;
        }
        requestAnimationFrame(fit);
        save();
    });

    wfClose.addEventListener('click', (e) => {
        e.stopPropagation();
        cleanup();
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

    // Le tableau global s'appelle « board » : ici « board » désigne la grille du robot
    const boardEl = document.getElementById('board');
    boardEl.appendChild(widget);
    if (typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);
    bringToFront(widget);
    makeDraggable(widget);
    makeDraggableRotate(widget);

    newGame();

    // ── API pour save-load.js ─────────────────────────────────────────────
    let _restored = false, _autoMax = false;

    widget._robGetData = () => ({
        containerW: _isMax ? (parseFloat(_savedW) || container.offsetWidth) : container.offsetWidth,
        mainH:      _isMax ? (parseFloat(_savedH) || main.offsetHeight) : main.offsetHeight,
        mode, lvl: lvlId, abs, speed, showCoords, showTrace, tool,
        grid: _rbCopyGrid(grid),
        optLen,
        prog: _rbCopyProg(prog),
        cursor,
        pred: { ans: pred.ans ? [pred.ans[0], pred.ans[1]] : null, ansD: pred.ansD },
        bug: bug.orig ? { orig: _rbCopyProg(bug.orig), idx: bug.idx, idx2: bug.idx2, kind: bug.kind, shown: bug.shown } : null,
        fullboard: _isMax && !_autoMax
    });

    // Sur téléphone, ouverture directe en plein écran (bouton vert)
    if (_rbIsPhone()) requestAnimationFrame(() => {
        if (!_restored && !_isMax) { _autoMax = true; wfMax.click(); }
    });

    widget._robSetData = (d) => {
        _restored = true;
        if (_autoMax && _isMax) wfMax.click();
        _autoMax = false;
        const toPhoneFull = () => {
            if (_rbIsPhone() && !_isMax) { _autoMax = true; wfMax.click(); return true; }
            return false;
        };
        if (!d) { toPhoneFull(); return; }
        if (d.containerW) container.style.width = d.containerW + 'px';
        if (d.mainH)      main.style.height = d.mainH + 'px';
        if (RB_MODES[d.mode]) mode = d.mode;
        if (RB_LEVELS[d.lvl]) lvlId = +d.lvl;
        if (typeof d.abs === 'boolean') abs = d.abs;
        if (RB_SPEEDS[d.speed]) speed = d.speed;
        if (typeof d.showCoords === 'boolean') showCoords = d.showCoords;
        if (typeof d.showTrace === 'boolean') showTrace = d.showTrace;
        if (RB_TOOLS[d.tool]) tool = d.tool;
        const g = _rbValidGrid(d.grid);
        if (g) {
            grid = g;
            // On ne garde que les instructions du jeu de flèches choisi
            const set = cmdSet();
            prog = _rbValidProg(d.prog).filter(t => t.c === '(' || t.c === ')' || set.includes(t.c));
            cursor = Math.max(0, Math.min(prog.length, +d.cursor || 0));
            optLen = +d.optLen || 0;
            if ((mode === 'defi' || mode === 'debug') && !optLen) { const s = _rbSolve(grid, set); optLen = s ? s.length : 0; }
            const pa = d.pred && Array.isArray(d.pred.ans) && d.pred.ans[0] >= 0 && d.pred.ans[0] < grid.n && d.pred.ans[1] >= 0 && d.pred.ans[1] < grid.n ? [+d.pred.ans[0], +d.pred.ans[1]] : null;
            const pd = d.pred && d.pred.ansD != null && +d.pred.ansD >= 0 && +d.pred.ansD < 4 ? +d.pred.ansD : null;
            pred = { ans: pa, ansD: pd, checked: false };
            bug = (d.bug && Array.isArray(d.bug.orig))
                ? { orig: _rbValidProg(d.bug.orig), idx: +d.bug.idx, idx2: +d.bug.idx2, kind: String(d.bug.kind || ''), shown: !!d.bug.shown }
                : { orig: null, idx: -1, idx2: -1, kind: '', shown: false };
            lastMsg = null;
            resetRun();
            renderAll();
        } else {
            newGame();
        }
        if (!toPhoneFull() && d.fullboard && !_isMax) wfMax.click();
        setTimeout(fit, 250);
    };

    saveBoard();
    return widget;
}
