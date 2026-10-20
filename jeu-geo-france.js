// =========================================================================
// WIDGET JEU : GÉO FRANCE — REPLACE SUR LA CARTE
// -------------------------------------------------------------------------
// Le jeu donne un nom ; l'élève clique (ou touche) l'endroit de la carte.
// • Carte 1 « France physique » : villes, fleuves, massifs, pays frontaliers,
//   mers et océan (chaque catégorie peut être activée / désactivée).
// • Carte 2 « Régions » : les 13 régions de France métropolitaine.
// • Carte 3 « Départements » : les 96 départements, en deux modes :
//     - on donne le NOM (numéros affichés sur la carte, ou non) ;
//     - on donne le NUMÉRO (noms affichés sur la carte, ou non).
// • 3 essais par question, puis la réponse est montrée en orange.
// • Indice (zone entourée), passer, zoom (molette, pincement, boutons),
//   chrono, étoiles, records mémorisés dans le navigateur, son.
// • Sauvegarde du tableau : réglages, partie en cours, taille
//   (via _jgfGetData / createJeuGeoFranceWidget(data), cf. save-load.js).
//
// Données de carte : reprises de activites-geo-france.js (chargé avant),
// contours des régions et départements : IGN Admin Express (Licence ouverte).
// =========================================================================
(function () {
    'use strict';

    var TYPE      = 'jeu-geo-france';
    var STORE_KEY = 'jgf-progress-v1';
    var DEF_W = 960, DEF_H = 660, MIN_W = 380, MIN_H = 420;
    var MAX_TRIES = 3;
    var NS = 'http://www.w3.org/2000/svg';

    function dataReady() {
        return typeof GF_W !== 'undefined' && typeof _gfAdm === 'function' && typeof GF_DEPS !== 'undefined';
    }

    // ── Cartes et catégories ────────────────────────────────────────────
    var MAPS = {
        physique:     { name: 'France physique', short: 'Physique',    ico: '⛰️', cls: 'g1',
                        desc: 'Villes, fleuves, massifs, pays voisins, mers' },
        regions:      { name: 'Les régions',     short: 'Régions',     ico: '🧩', cls: 'g2',
                        desc: 'Les 13 régions de métropole' },
        departements: { name: 'Les départements', short: 'Départements', ico: '🔢', cls: 'g3',
                        desc: 'Les 96 départements, par nom ou par numéro' }
    };
    var CATS = {
        villes:  { label: 'Villes',  ico: '🏙️', kind: 'Grande ville',      color: '#d63b3b' },
        fleuves: { label: 'Fleuves', ico: '🌊', kind: 'Fleuve',            color: '#2b7bd0' },
        massifs: { label: 'Massifs', ico: '⛰️', kind: 'Massif montagneux', color: '#9a6a3a' },
        pays:    { label: 'Pays',    ico: '🗺️', kind: 'Pays frontalier',   color: '#4d7c2f' },
        mers:    { label: 'Mers',    ico: '⚓', kind: 'Mer / océan',        color: '#2f7aa8' },
        regions: { label: 'Régions', ico: '🧩', kind: 'Région',            color: '#7c3aed' },
        departements: { label: 'Départements', ico: '🔢', kind: 'Département', color: '#2f4f9e' }
    };
    var PHYS_CATS = ['villes', 'fleuves', 'massifs', 'pays', 'mers'];

    // Repères des mers : un clic dans l'eau est attribué à la mer la plus proche
    var SEA_ANCHORS = {
        manche:       [[-2.6, 49.95], [-4.5, 49.4], [-1.0, 50.1], [0.8, 50.45], [-5.4, 49.1], [-3.4, 49.2]],
        merdunord:    [[2.35, 51.38], [2.0, 51.22], [3.0, 51.6], [1.75, 51.15]],
        atlantique:   [[-3.9, 45.3], [-2.2, 46.0], [-4.0, 47.2], [-5.4, 48.0], [-1.8, 44.2], [-5.0, 46.4], [-3.2, 44.0]],
        mediterranee: [[5.4, 42.35], [3.8, 42.9], [7.2, 43.25], [4.8, 41.6], [8.0, 41.7], [9.9, 42.6], [6.5, 42.9], [3.4, 43.15]]
    };

    function defaultCfg() {
        return { map: 'physique', cats: { villes: true, fleuves: true, massifs: true, pays: true, mers: true },
                 depMode: 'nom', helpLabels: true, len: 'all' };
    }
    function cfgKey(c) {
        var k = c.map;
        if (c.map === 'physique') k += ':' + PHYS_CATS.filter(function (x) { return c.cats[x]; }).join('+');
        if (c.map === 'departements') k += ':' + c.depMode + (c.helpLabels ? '+aide' : '');
        return k + ':' + c.len;
    }

    // ── Progression (records, son) ──────────────────────────────────────
    function loadProgress() {
        try {
            var p = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
            return { best: p.best || {}, sound: p.sound !== false };
        } catch (e) { return { best: {}, sound: true }; }
    }
    function saveProgress(p) { try { localStorage.setItem(STORE_KEY, JSON.stringify(p)); } catch (e) {} }

    // ── Sons ────────────────────────────────────────────────────────────
    var _actx = null;
    function beep(freq, dur, type, vol, delay) {
        try {
            _actx = _actx || new (window.AudioContext || window.webkitAudioContext)();
            var t = _actx.currentTime + (delay || 0);
            var o = _actx.createOscillator(), gn = _actx.createGain();
            o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
            gn.gain.setValueAtTime(0.0001, t);
            gn.gain.exponentialRampToValueAtTime(vol || 0.08, t + 0.01);
            gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            o.connect(gn); gn.connect(_actx.destination);
            o.start(t); o.stop(t + dur + 0.02);
        } catch (e) {}
    }
    function fmtTime(ms) {
        var s = Math.floor((ms || 0) / 1000), m = Math.floor(s / 60);
        s = s % 60;
        return m + ':' + (s < 10 ? '0' : '') + s;
    }
    function shuffle(a) {
        for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; }
        return a;
    }
    function esc(s) {
        return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
    }
    function mix(hex, t) {
        if (typeof _gfMix === 'function') return _gfMix(hex, t);
        return hex;
    }

    // ── CSS ─────────────────────────────────────────────────────────────
    function injectCSS() {
        if (document.getElementById('jgf-style')) return;
        var s = document.createElement('style');
        s.id = 'jgf-style';
        s.textContent = [
'.jgf-root{position:relative;box-sizing:border-box;display:flex;flex-direction:column;overflow:hidden;border-radius:18px;',
'  background:radial-gradient(ellipse at 50% 35%,#2fae8a 0%,#1d8a6c 45%,#0f5e4a 100%);color:#fff;',
'  box-shadow:0 10px 30px rgba(0,0,0,.35),inset 0 0 0 1px rgba(255,255,255,.12);font-family:"Nunito",sans-serif;',
'  user-select:none;-webkit-user-select:none;outline:none;--ui:1;cursor:move}',
'.jgf-root *{box-sizing:border-box}',
'.jgf-root .jgf-ov,.jgf-root .jgf-mapwrap{cursor:default}',
'.jgf-root.jgf-fullboard{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;z-index:9999;border-radius:0}',
'.widget.phone-fs .jgf-root{width:100%!important;height:100%!important;border-radius:0}',
// En-tête
'.jgf-head{flex:0 0 auto;display:flex;align-items:center;gap:10px;padding:8px 12px 6px 14px;background:linear-gradient(180deg,rgba(0,0,0,.18),rgba(0,0,0,0))}',
'.jgf-title{font-weight:900;font-size:calc(22px*var(--ui));letter-spacing:.5px;white-space:nowrap;text-shadow:0 2px 0 rgba(0,0,0,.25)}',
'.jgf-title b{color:#ffd23f}',
'.jgf-lvlbtn{white-space:nowrap;display:flex;align-items:center;gap:6px;border:none;cursor:pointer;border-radius:999px;padding:4px 12px 4px 6px;font-family:inherit;',
'  background:rgba(0,0,0,.28);color:#fff;font-weight:800;font-size:calc(14px*var(--ui));box-shadow:inset 0 0 0 1px rgba(255,255,255,.18)}',
'.jgf-lvlbtn:hover{background:rgba(0,0,0,.4)}',
'.jgf-pill{border-radius:999px;padding:2px 9px;font-size:calc(11px*var(--ui));font-weight:900;text-transform:uppercase;letter-spacing:.6px}',
'.jgf-pill.g1{background:#22c55e;color:#06321a}.jgf-pill.g2{background:#c4b5fd;color:#2e1065}.jgf-pill.g3{background:#38bdf8;color:#062a3a}',
'.jgf-spacer{flex:1}',
'.jgf-icon{width:28px;height:28px;border-radius:50%;border:none;cursor:pointer;background:rgba(0,0,0,.25);color:#fff;font-size:15px;padding:0;',
'  display:flex;align-items:center;justify-content:center;box-shadow:inset 0 0 0 1px rgba(255,255,255,.18);flex-shrink:0;font-family:inherit;font-weight:900}',
'.jgf-icon:hover{background:rgba(0,0,0,.42)}',
// Corps : carte + colonne latérale
'.jgf-body{flex:1 1 0;display:flex;flex-direction:row-reverse;min-height:0;gap:10px;padding:4px 12px 12px}',
'.jgf-body.col{flex-direction:column}',
'.jgf-mapwrap{position:relative;flex:1 1 auto;min-width:0;min-height:0;border-radius:12px;overflow:hidden;background:#cfe6f3;',
'  box-shadow:0 6px 18px rgba(0,0,0,.4),0 0 0 4px rgba(255,255,255,.9)}',
'.jgf-map{position:absolute;inset:0;display:block;width:100%;height:100%;touch-action:none;cursor:crosshair}',
'.jgf-root.jgf-fullboard{max-width:100vw;max-height:100vh;max-height:100dvh}',
'body.jgf-noscroll{overflow:hidden!important}',
'.jgf-zoom{position:absolute;right:8px;top:8px;display:flex;flex-direction:column;gap:5px;z-index:3}',
'.jgf-zoom button{width:calc(32px*var(--ui));height:calc(32px*var(--ui));border-radius:9px;border:none;cursor:pointer;background:rgba(255,255,255,.92);',
'  color:#0f5e4a;font-weight:900;font-size:calc(18px*var(--ui));box-shadow:0 2px 6px rgba(0,0,0,.25);font-family:inherit;padding:0;line-height:1}',
'.jgf-zoom button:hover{background:#fff}',
'.jgf-side{flex:0 0 calc(250px*var(--ui));display:flex;flex-direction:column;gap:calc(8px*var(--ui));min-height:0;overflow-y:auto;overflow-x:hidden}',
'.jgf-body.col .jgf-side{flex:0 0 auto;flex-direction:row;flex-wrap:wrap;align-items:stretch;overflow:visible}',
'.jgf-body.col .jgf-q{flex:1 1 100%}',
'.jgf-body.col .jgf-progress,.jgf-body.col .jgf-stats,.jgf-body.col .jgf-btns{flex:1 1 auto}',
// Carte « question »
'.jgf-q{background:#fff;color:#123;border-radius:14px;padding:calc(8px*var(--ui)) 12px calc(10px*var(--ui));text-align:center;',
'  box-shadow:0 5px 0 rgba(0,0,0,.18),0 0 0 3px #ffd23f;position:relative}',
'.jgf-q.pop{animation:jgfQPop .35s ease-out}',
'@keyframes jgfQPop{0%{transform:scale(.85)}70%{transform:scale(1.04)}100%{transform:scale(1)}}',
'.jgf-q small{display:block;font-size:calc(11px*var(--ui));font-weight:900;letter-spacing:.8px;text-transform:uppercase;color:#678}',
'.jgf-qname{display:block;font-size:calc(27px*var(--ui));font-weight:900;line-height:1.1;margin:4px 0 5px;color:#0f3b30;word-break:break-word}',
'.jgf-qkind{display:inline-block;border-radius:999px;padding:2px 10px;font-size:calc(11px*var(--ui));font-weight:900;color:#fff;background:#0f5e4a}',
'.jgf-qtries{display:block;min-height:1em;line-height:1;font-size:calc(12px*var(--ui));letter-spacing:1px;margin-bottom:3px}',
'.jgf-qtries .off{opacity:.2;filter:grayscale(1)}',
'.jgf-progress{background:rgba(0,0,0,.25);border-radius:12px;padding:6px 10px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14)}',
'.jgf-progress small{display:flex;justify-content:space-between;font-size:calc(11px*var(--ui));font-weight:900;letter-spacing:.6px;text-transform:uppercase;opacity:.9}',
'.jgf-pbar{height:calc(10px*var(--ui));border-radius:999px;background:rgba(255,255,255,.18);overflow:hidden;margin-top:5px;display:flex}',
'.jgf-pbar i{display:block;height:100%;transition:width .3s}',
'.jgf-pbar .ok{background:#ffc21a}.jgf-pbar .ko{background:#fb923c}',
'.jgf-stats{display:flex;gap:5px}',
'.jgf-stat{flex:1;background:rgba(0,0,0,.25);border-radius:12px;padding:3px 6px;text-align:center;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14);min-width:calc(54px*var(--ui))}',
'.jgf-stat small{display:block;font-size:calc(9px*var(--ui));font-weight:900;letter-spacing:.6px;opacity:.8;text-transform:uppercase}',
'.jgf-stat span{display:block;font-size:calc(17px*var(--ui));font-weight:900;line-height:1.15}',
'.jgf-stat.err span{color:#ff9aa2}',
'.jgf-btns{display:grid;grid-template-columns:1fr 1fr;gap:6px}',
'.jgf-body.col .jgf-btns{display:flex;flex-wrap:wrap}',
'.jgf-btn{border:none;cursor:pointer;border-radius:12px;padding:calc(7px*var(--ui)) 10px;font-weight:800;font-size:calc(13px*var(--ui));font-family:inherit;',
'  color:#0b3b2e;background:#e9fff6;box-shadow:0 3px 0 #9fd8c2;display:flex;align-items:center;justify-content:center;gap:5px;white-space:nowrap}',
'.jgf-btn:hover{filter:brightness(1.05)}.jgf-btn:active{transform:translateY(2px);box-shadow:0 1px 0 #9fd8c2}',
'.jgf-btn:disabled{opacity:.45;cursor:default;transform:none}',
'.jgf-btn.jgf-hint{background:#ffd23f;box-shadow:0 3px 0 #c99a00;color:#3a2a00}',
'.jgf-btn.jgf-go,.jgf-btn.jgf-next{background:#22c55e;box-shadow:0 3px 0 #15803d;color:#fff}',
'.jgf-btn.jgf-choose{background:#c4b5fd;box-shadow:0 3px 0 #7c3aed;color:#2e1065}',
'.jgf-msg{min-height:2.4em;font-size:calc(13px*var(--ui));text-align:center;font-weight:800;color:#ffe48a;line-height:1.25}',
'.jgf-body.col .jgf-msg{flex:1 1 100%;min-height:1.3em}',
// Carte SVG
'.jgf-map text{font-family:"Nunito","Segoe UI",sans-serif;paint-order:stroke;stroke-linejoin:round;pointer-events:none}',
'.jgf-water{fill:#cfe6f3}',
'.jgf-other{fill:#ebece6;stroke:#fff;stroke-width:1}',
'.jgf-bgc{fill:#e4e6dc;stroke:#fff;stroke-width:1.2}',
'.jgf-france{fill:#fdf6e1;stroke:#8a6d3b;stroke-width:2}',
'.jgf-clk{cursor:pointer}',
'.jgf-country{fill:#e4e6dc;stroke:#fff;stroke-width:1.2;transition:fill .2s}',
'.jgf-country.jgf-clk:hover{fill:#d5dbc8}',
'.jgf-country.ok{fill:#b7e4a6}.jgf-country.ko{fill:#fed7aa}',
'.jgf-massif{stroke:#9a6a3a;stroke-width:1;stroke-opacity:.55;transition:stroke-width .2s}',
'.jgf-massif.jgf-clk:hover{stroke-width:2.5;stroke-opacity:1}',
'.jgf-massif.ok{stroke:#15803d;stroke-width:3;stroke-opacity:1}.jgf-massif.ko{stroke:#ea580c;stroke-width:3;stroke-opacity:1}',
'.jgf-lake{fill:#9ccbe8;stroke:#2b7bd0;stroke-width:1.5}',
'.jgf-river{fill:none;stroke:#2b7bd0;stroke-width:3.5;stroke-linecap:round;stroke-linejoin:round;pointer-events:none}',
'.jgf-river.ok{stroke:#15803d;stroke-width:5.5}.jgf-river.ko{stroke:#ea580c;stroke-width:5.5}',
'.jgf-river-hit{fill:none;stroke:transparent;stroke-width:16;stroke-linecap:round}',
'.jgf-river-hit:hover + .jgf-river{stroke-width:5.5}',
'.jgf-city{fill:#d63b3b;stroke:#fff;stroke-width:2;pointer-events:none}',
'.jgf-city.ok{fill:#16a34a}.jgf-city.ko{fill:#f97316}',
'.jgf-hit{fill:transparent;stroke:none}',
'.jgf-hit:hover + .jgf-city{stroke:#ffd23f}',
'.jgf-monaco{fill:#e4e6dc;stroke:#6b7280;stroke-width:1.5;pointer-events:none}',
'.jgf-monaco.ok{fill:#86efac}.jgf-monaco.ko{fill:#fdba74}',
'.jgf-region,.jgf-dep{fill-rule:evenodd;transition:fill .25s}',
'.jgf-region{fill:#fdf6e1;stroke:#fdf6e1;stroke-width:.6}',
'.jgf-dep{fill:#fdf6e1;stroke:#c9b98f;stroke-width:.8}',
'.jgf-region.jgf-clk:hover,.jgf-dep.jgf-clk:hover{fill:#f3e5bd}',
'.jgf-dep.ko,.jgf-region.ko{fill:#fdba74!important;stroke:#fdba74}',
'.jgf-gap{fill:#e4e6dc;stroke:none;pointer-events:none}',
'.jgf-line{fill:none;pointer-events:none;stroke-linejoin:round;stroke-linecap:round}',
'.jgf-regline{stroke:#8a6d3b;stroke-width:1.6}',
'.jgf-outer{stroke:#8a6d3b;stroke-width:1.6}',
'.jgf-bad{animation:jgfBad .8s ease-out}',
'@keyframes jgfBad{0%,40%{fill:#f87171}100%{}}',
'.jgf-badl{animation:jgfBadL .8s ease-out}',
'@keyframes jgfBadL{0%,40%{stroke:#ef4444}100%{}}',
'.jgf-l-city{fill:#1f2937;font-weight:900;stroke:#fff;stroke-width:4}',
'.jgf-l-river{fill:#1d5fa8;font-weight:800;font-style:italic;stroke:#fff;stroke-width:4}',
'.jgf-l-massif{fill:#7a4b1c;font-weight:900;font-style:italic;stroke:#fdf6e1;stroke-width:4}',
'.jgf-l-country{fill:#3f5f22;font-weight:800;font-style:italic;stroke:#eef3e5;stroke-width:4;letter-spacing:1px}',
'.jgf-l-sea{fill:#245f86;font-weight:800;font-style:italic;stroke:#cfe6f3;stroke-width:3;letter-spacing:1px}',
'.jgf-l-reg{fill:#2d3748;font-weight:900;stroke:rgba(255,255,255,.85);stroke-width:4}',
'.jgf-l-dep{fill:#1f2937;font-weight:800;stroke:rgba(255,255,255,.85);stroke-width:3}',
'.jgf-l-ko{fill:#9a3412}',
'.jgf-pulse{fill:none;stroke:#16a34a;stroke-width:4;animation:jgfPulse 1.1s ease-out forwards;transform-box:fill-box;transform-origin:center;pointer-events:none}',
'.jgf-pulse.ko{stroke:#ea580c;animation-iteration-count:2}',
'@keyframes jgfPulse{0%{opacity:1;transform:scale(.3)}100%{opacity:0;transform:scale(1.6)}}',
'.jgf-hintc{fill:rgba(255,210,63,.2);stroke:#e0a800;stroke-width:3;stroke-dasharray:8 6;animation:jgfHint 1s ease-in-out infinite;pointer-events:none}',
'@keyframes jgfHint{0%,100%{opacity:.45}50%{opacity:1}}',
'.jgf-miss{animation:jgfMiss .9s ease-out forwards;transform-box:fill-box;transform-origin:center;pointer-events:none}',
'@keyframes jgfMiss{0%{opacity:0;transform:scale(.4)}20%{opacity:1;transform:scale(1.1)}70%{opacity:1}100%{opacity:0;transform:scale(1)}}',
'.jgf-mapwrap.shake{animation:jgfShake .3s}',
'@keyframes jgfShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}',
// Fenêtres superposées
'.jgf-ov{position:absolute;inset:0;z-index:20;display:none;align-items:center;justify-content:center;background:rgba(6,40,31,.78);backdrop-filter:blur(3px);padding:14px}',
'.jgf-ov.show{display:flex}',
'.jgf-card{background:#fff;color:#123;border-radius:18px;padding:16px 18px;max-width:100%;max-height:100%;overflow:auto;box-shadow:0 12px 40px rgba(0,0,0,.4);text-align:center;position:relative}',
'.jgf-card h3{margin:0 0 10px;font-size:calc(22px*var(--ui));font-weight:900;color:#0f5e4a}',
'.jgf-x{position:absolute;top:10px;right:10px;background:#0f5e4a!important}',
'.jgf-maps{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:12px}',
'.jgf-mapbtn{border:none;cursor:pointer;border-radius:14px;padding:10px 8px;background:#eef6f3;color:#0f5e4a;font-family:inherit;box-shadow:0 3px 0 #c8ddd5;text-align:center}',
'.jgf-mapbtn em{display:block;font-style:normal;font-size:calc(30px*var(--ui));line-height:1.1}',
'.jgf-mapbtn b{display:block;font-size:calc(15px*var(--ui));font-weight:900;margin:3px 0 2px}',
'.jgf-mapbtn small{display:block;font-size:calc(11px*var(--ui));color:#567;font-weight:700;line-height:1.2}',
'.jgf-mapbtn .n{display:inline-block;margin-bottom:3px;border-radius:999px;padding:0 8px;background:#0f5e4a;color:#fff;font-size:calc(10px*var(--ui));font-weight:900}',
'.jgf-mapbtn.cur{background:#0f5e4a;color:#fff;box-shadow:0 3px 0 #062a20}',
'.jgf-mapbtn.cur small{color:#cfe9df}.jgf-mapbtn.cur .n{background:#ffd23f;color:#3a2a00}',
'.jgf-optrow{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:6px;margin:8px 0}',
'.jgf-optrow > span{font-weight:900;color:#345;font-size:calc(13px*var(--ui));margin-right:2px}',
'.jgf-chip{border:2px solid #c8ddd5;cursor:pointer;border-radius:999px;padding:4px 11px;background:#fff;color:#345;font-family:inherit;font-weight:800;font-size:calc(13px*var(--ui))}',
'.jgf-chip.on{background:#0f5e4a;border-color:#0f5e4a;color:#fff}',
'.jgf-setup-note{font-size:calc(12px*var(--ui));color:#678;margin:2px 0 10px;font-weight:700}',
'.jgf-card .jgf-btn{box-shadow:0 3px 0 #b7d6cb;background:#eef6f3}',
'.jgf-card .jgf-btn.jgf-go,.jgf-card .jgf-btn.jgf-next{background:#22c55e;box-shadow:0 3px 0 #15803d;color:#fff}',
'.jgf-card .jgf-btn.jgf-choose{background:#c4b5fd;box-shadow:0 3px 0 #7c3aed;color:#2e1065}',
'.jgf-card .jgf-btn.jgf-go{font-size:calc(17px*var(--ui));padding:9px 26px;margin:6px auto 0}',
'.jgf-win-stars{font-size:calc(44px*var(--ui));letter-spacing:6px;margin:4px 0}',
'.jgf-win-stars .on{color:#ffc400;text-shadow:0 2px 0 #c99a00;display:inline-block;animation:jgfStar .5s backwards}',
'.jgf-win-stars .off{color:#d7e3df}',
'@keyframes jgfStar{0%{transform:scale(0) rotate(-40deg)}70%{transform:scale(1.25)}100%{transform:scale(1)}}',
'.jgf-win-txt{font-size:calc(15px*var(--ui));margin:6px 0 12px;color:#345;line-height:1.45}',
'.jgf-win-btns{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}',
'.jgf-confetti{position:absolute;width:8px;height:12px;border-radius:2px;top:-14px;pointer-events:none;animation:jgfFall linear forwards;z-index:21}',
'@keyframes jgfFall{to{transform:translateY(110vh) rotate(720deg)}}',
'.jgf-grip{position:absolute;right:2px;bottom:2px;width:20px;height:20px;cursor:nwse-resize;z-index:15;opacity:.6;touch-action:none;',
'  background:linear-gradient(135deg,transparent 50%,rgba(255,255,255,.55) 50%,rgba(255,255,255,.55) 60%,transparent 60%,transparent 72%,rgba(255,255,255,.55) 72%,rgba(255,255,255,.55) 82%,transparent 82%)}',
'.jgf-grip:hover{opacity:1}',
'.jgf-root.jgf-narrow .jgf-head{gap:6px;padding:8px 8px 6px 10px}',
'.jgf-root.jgf-narrow .jgf-title .jgf-tt{display:none}',
'.jgf-root.jgf-narrow .jgf-lvlword{display:none}',
'.jgf-root.jgf-narrow .jgf-icon{width:24px;height:24px;font-size:12px}',
'.jgf-root.jgf-narrow .jgf-help{display:none}',
'.jgf-root.jgf-narrow .jgf-btn .jgf-bl{display:none}',
'.jgf-root.jgf-narrow .jgf-maps{grid-template-columns:1fr}',
'.jgf-root.jgf-fullboard .jgf-grip,.widget.phone-fs .jgf-grip{display:none}',
'@media (max-width: 768px), (max-height: 500px) and (pointer: coarse){',
'  .jgf-root.jgf-fullboard{left:40px!important;width:calc(100vw - 40px)!important;height:100vh!important;height:100dvh!important;',
'    padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) 0}',
'}'
        ].join('\n');
        document.head.appendChild(s);
    }

    function injectWfButtons() {
        if (document.getElementById('wf-btns-style')) return;
        var ws = document.createElement('style');
        ws.id = 'wf-btns-style';
        ws.textContent = [
            '.wf-btns { display:flex; gap:5px; align-items:center; flex-shrink:0; }',
            '.wf-btn { width:13px; height:13px; border-radius:50%; border:none; cursor:pointer;',
            '    display:flex; align-items:center; justify-content:center; font-size:0;',
            '    transition:filter .15s, transform .1s; flex-shrink:0; position:relative; }',
            '.wf-btn:hover { filter:brightness(0.82); transform:scale(1.15); }',
            '.wf-btn:active { transform:scale(0.92); }',
            '.wf-btn-min   { background:#febc2e; }',
            '.wf-btn-max   { background:#28c840; }',
            '.wf-btn-close { background:#ff5f57; }',
            '.wf-btns:hover .wf-btn::after { font-size:8px; font-weight:900; color:rgba(0,0,0,0.5); line-height:1; }',
            ".wf-btns:hover .wf-btn-min::after   { content:'−'; }",
            ".wf-btns:hover .wf-btn-max::after   { content:'⤢'; font-size:7px; }",
            ".wf-btns:hover .wf-btn-close::after { content:'×'; font-size:10px; }"
        ].join('\n');
        document.head.appendChild(ws);
    }

    function el(tag, cls, html) {
        var e = document.createElement(tag);
        if (cls) e.className = cls;
        if (html != null) e.innerHTML = html;
        return e;
    }
    function svgEl(tag, attrs, parent) {
        var e = document.createElementNS(NS, tag);
        for (var k in attrs) e.setAttribute(k, attrs[k]);
        if (parent) parent.appendChild(e);
        return e;
    }
    var _uid = 0;

    // =====================================================================
    // Initialisation d'un widget
    // =====================================================================
    function initGeoFranceGame(widget, data) {
        if (!widget || widget._jgfInit) return;
        widget._jgfInit = true;
        injectCSS();
        injectWfButtons();
        data = data || {};

        var prog = loadProgress();
        var P = 'jgf' + (++_uid) + '_';
        var S = {
            cfg: defaultCfg(), setupCfg: null,
            order: [], idx: 0, status: {}, tries: 0, errors: 0, hints: 0, first: 0,
            elapsed: 0, t0: 0, running: false, done: false, lock: false, hintId: null,
            w: DEF_W, h: DEF_H, fullboard: false
        };

        widget.dataset.transparent = 'true';
        if (typeof applyTransparency === 'function') { try { applyTransparency(widget, true); } catch (e) {} }
        var host = widget.querySelector('.widget-content') || widget;
        if (host !== widget) { host.style.padding = '0'; host.style.background = 'transparent'; }

        var root = el('div', 'jgf-root');
        root.tabIndex = 0;
        if (!dataReady()) {
            root.style.width = '420px'; root.style.height = '200px';
            root.innerHTML = '<div style="padding:30px;text-align:center;font-weight:800">Les données de la carte sont introuvables.<br>Le fichier activites-geo-france.js doit être chargé avant jeu-geo-france.js.</div>';
            host.appendChild(root);
            return;
        }

        root.innerHTML =
            '<div class="jgf-head">' +
                '<div class="jgf-title">🗺️<span class="jgf-tt"> Géo <b>France</b></span></div>' +
                '<button class="jgf-lvlbtn" title="Choisir une carte"><span class="jgf-pill"></span><span class="jgf-lvltxt"></span> ▾</button>' +
                '<div class="jgf-spacer"></div>' +
                '<div class="wf-btns">' +
                    '<button class="jgf-icon jgf-sound" title="Son"></button>' +
                    '<button class="jgf-icon jgf-help" title="Comment jouer ?">?</button>' +
                    '<button class="wf-btn wf-btn-min" title="Réduire"></button>' +
                    '<button class="wf-btn wf-btn-max" title="Plein écran"></button>' +
                    '<button class="wf-btn wf-btn-close" title="Fermer"></button>' +
                '</div>' +
            '</div>' +
            '<div class="jgf-body">' +
                '<div class="jgf-side">' +
                    '<div class="jgf-q"><span class="jgf-qtries"></span><small class="jgf-qlbl">Clique sur la carte :</small>' +
                        '<span class="jgf-qname">—</span><span class="jgf-qkind">—</span></div>' +
                    '<div class="jgf-progress"><small><span>Progression</span><span class="jgf-v-prog">0 / 0</span></small>' +
                        '<div class="jgf-pbar"><i class="ok"></i><i class="ko"></i></div></div>' +
                    '<div class="jgf-stats">' +
                        '<div class="jgf-stat err"><small>Erreurs</small><span class="jgf-v-err">0</span></div>' +
                        '<div class="jgf-stat"><small>Temps</small><span class="jgf-v-time">0:00</span></div>' +
                        '<div class="jgf-stat"><small>Record</small><span class="jgf-v-best">–</span></div>' +
                    '</div>' +
                    '<div class="jgf-btns">' +
                        '<button class="jgf-btn jgf-hint" title="Entourer la zone où chercher">💡<span class="jgf-bl"> Indice</span></button>' +
                        '<button class="jgf-btn jgf-skip" title="Montrer la réponse et passer">⏭<span class="jgf-bl"> Passer</span></button>' +
                        '<button class="jgf-btn jgf-reset" title="Recommencer une nouvelle série">↺<span class="jgf-bl"> Rejouer</span></button>' +
                        '<button class="jgf-btn jgf-choose" title="Choisir une autre carte">🗺️<span class="jgf-bl"> Cartes</span></button>' +
                    '</div>' +
                    '<div class="jgf-msg"></div>' +
                '</div>' +
                '<div class="jgf-mapwrap">' +
                    '<div class="jgf-zoom"><button class="jgf-zin" title="Zoomer">+</button><button class="jgf-zout" title="Dézoomer">−</button>' +
                        '<button class="jgf-zall" title="Carte entière">⌂</button></div>' +
                '</div>' +
            '</div>' +
            '<div class="jgf-ov jgf-ov-setup"><div class="jgf-card jgf-setup" style="max-width:640px;">' +
                '<button class="jgf-icon jgf-x" title="Fermer">✕</button><h3>Choisis ta carte</h3>' +
                '<div class="jgf-maps"></div><div class="jgf-opts"></div>' +
                '<div class="jgf-optrow jgf-lenrow"></div>' +
                '<div class="jgf-setup-note jgf-best-note"></div>' +
                '<button class="jgf-btn jgf-go">▶ Jouer</button>' +
            '</div></div>' +
            '<div class="jgf-ov jgf-ov-win"><div class="jgf-card"><h3 class="jgf-win-title">Bravo !</h3><div class="jgf-win-stars"></div><div class="jgf-win-txt"></div>' +
                '<div class="jgf-win-btns"><button class="jgf-btn jgf-w-see">👀 Voir la carte</button><button class="jgf-btn jgf-choose jgf-w-maps">🗺️ Autre carte</button>' +
                '<button class="jgf-btn jgf-next jgf-w-again">↺ Rejouer</button></div></div></div>' +
            '<div class="jgf-ov jgf-ov-help"><div class="jgf-card" style="max-width:480px;text-align:left;"><button class="jgf-icon jgf-x">✕</button><h3 style="text-align:center;">Comment jouer ?</h3>' +
                '<p style="margin:6px 0;">🎯 <b>But :</b> un nom s\'affiche à côté de la carte. <b>Clique ou touche</b> l\'endroit où il se trouve sur la carte.</p>' +
                '<p style="margin:6px 0;">🗺️ <b>3 cartes :</b> la France physique (villes, fleuves, massifs, pays voisins, mers), les <b>13 régions</b>, les <b>96 départements</b>.</p>' +
                '<p style="margin:6px 0;">🔢 <b>Départements :</b> on te donne le <b>nom</b> (les numéros peuvent être affichés pour t\'aider) ou le <b>numéro</b> (les noms peuvent être affichés).</p>' +
                '<p style="margin:6px 0;">❌ Tu as <b>3 essais</b> par question. Ensuite, la bonne réponse est montrée en <b style="color:#ea580c">orange</b>.</p>' +
                '<p style="margin:6px 0;">🔍 <b>Zoom :</b> molette, pincement à deux doigts ou boutons + / −. Fais glisser la carte pour la déplacer (utile pour l\'Île-de-France !).</p>' +
                '<p style="margin:6px 0;">⭐ Sans erreur et sans indice = 3 étoiles !</p></div></div>' +
            '<div class="jgf-grip" title="Redimensionner"></div>';
        host.appendChild(root);

        var $ = function (sel) { return root.querySelector(sel); };
        var body = $('.jgf-body'), mapWrap = $('.jgf-mapwrap'), qBox = $('.jgf-q');

        // ── Déplacement du widget : comme les autres jeux, on peut l'attraper
        //    n'importe où sauf sur la carte, les boutons et les fenêtres.
        var NO_DRAG = '.jgf-mapwrap, .jgf-ov, .jgf-grip, button, input, select, textarea, label, a';
        function isolate(e) {
            if ((e.type === 'pointerdown' || e.type === 'mousedown') && typeof bringToFront === 'function') {
                try { bringToFront(widget); } catch (er) {}
            }
            var fixe = S.fullboard || widget.classList.contains('phone-fs');
            if (!fixe && e.target.closest && !e.target.closest(NO_DRAG)) return;
            e.stopPropagation();
        }
        ['pointerdown', 'mousedown', 'touchstart'].forEach(function (t) {
            root.addEventListener(t, isolate, t === 'touchstart' ? { passive: true } : false);
        });

        // =================================================================
        // Construction de la carte
        // =================================================================
        var ADM = _gfAdm();
        var regColor = {};
        GF_REGIONS.forEach(function (r) { regColor[r[0]] = r[5]; });
        var svg = null, gLabels = null, gFx = null;
        var items = {}, labels = [], scalables = [];
        var vb = { x: 0, y: 0, w: GF_W, h: GF_H }, animId = null;

        function addLabel(it, cls, x, y, size, dx, dy, anchor, opts) {
            opts = opts || {};
            var t = svgEl('text', { 'class': cls, 'text-anchor': anchor || 'middle' }, gLabels);
            var lb = { el: t, ax: x, ay: y, dx: dx || 0, dy: dy || 0, size: size, kind: opts.kind || 'main',
                       maxW: opts.maxW || 0, sw: opts.sw || 4, cur: [] };
            labels.push(lb);
            it.label = lb;
            return lb;
        }
        function setLines(lb, lines) {
            lb.cur = lines;
            while (lb.el.firstChild) lb.el.removeChild(lb.el.firstChild);
            lines.forEach(function (line) {
                var t = document.createElementNS(NS, 'tspan');
                t.textContent = line.t;
                if (line.w) t.setAttribute('font-weight', line.w);
                lb.el.appendChild(t);
            });
        }
        function newItem(id, cat, name, extra) {
            var it = { id: id, cat: cat, name: name, shapes: [], center: null, label: null };
            for (var k in extra) it[k] = extra[k];
            items[id] = it;
            return it;
        }

        function buildMap() {
            if (svg) svg.remove();
            items = {}; labels = []; scalables = [];
            var c = S.cfg, isPhys = c.map === 'physique';
            svg = svgEl('svg', { 'class': 'jgf-map', viewBox: '0 0 ' + GF_W.toFixed(1) + ' ' + GF_H.toFixed(1), preserveAspectRatio: 'xMidYMid meet' });
            svg.innerHTML =
                '<defs><pattern id="' + P + 'hatch" patternUnits="userSpaceOnUse" width="9" height="9" patternTransform="rotate(45)">' +
                '<rect width="9" height="9" fill="#c99a63" fill-opacity="0.38"></rect>' +
                '<line x1="0" y1="0" x2="0" y2="9" stroke="#9a6a3a" stroke-width="2.2" stroke-opacity="0.45"></line></pattern>' +
                '<clipPath id="' + P + 'clip"><rect x="0" y="0" width="' + GF_W.toFixed(1) + '" height="' + GF_H.toFixed(1) + '"></rect></clipPath></defs>' +
                '<rect class="jgf-water" x="-5000" y="-5000" width="12000" height="12000"></rect>' +
                '<g clip-path="url(#' + P + 'clip)"><g class="jgf-g-land"></g><g class="jgf-g-main"></g><g class="jgf-g-top"></g>' +
                '<g class="jgf-g-labels"></g><g class="jgf-g-fx"></g></g>';
            mapWrap.insertBefore(svg, mapWrap.firstChild);
            var gLand = svg.querySelector('.jgf-g-land'), gMain = svg.querySelector('.jgf-g-main'), gTop = svg.querySelector('.jgf-g-top');
            gLabels = svg.querySelector('.jgf-g-labels'); gFx = svg.querySelector('.jgf-g-fx');

            Object.keys(GF_SHAPES_OTHER).forEach(function (k) { svgEl('path', { 'class': 'jgf-other', d: _gfPath(GF_SHAPES_OTHER[k], true) }, gLand); });

            // Pays frontaliers (cliquables seulement dans la carte physique, catégorie « pays »)
            var paysOn = isPhys && c.cats.pays;
            GF_COUNTRIES.slice().sort(function (a, b) { return (a.id === 'andorre') - (b.id === 'andorre'); }).forEach(function (co) {
                if (!co.shape) return;
                var d = _gfPath(co.shape, true);
                if (!paysOn) { svgEl('path', { 'class': 'jgf-bgc', d: d }, gLand); return; }
                var it = newItem(co.id, 'pays', co.name);
                // les petits pays (Andorre, Luxembourg) passent au premier plan :
                // sinon l'Andorre est recouverte par le massif des Pyrénées
                var small = co.size && co.size < 1;
                var p = svgEl('path', { 'class': 'jgf-country jgf-clk', d: d, 'data-id': co.id }, small ? gTop : gLand);
                it.shapes.push(p); it.main = p;
                var fs = 21 * (co.size || 1);
                var lp = _gfP(co.lbl[0], co.lbl[1]);
                addLabel(it, 'jgf-l-country', lp[0], lp[1], fs, 0, fs * 0.35, 'middle');
                it.lines = [co.name];
                if (co.size && co.size < 1) {
                    // petit pays : zone de clic élargie
                    var xs = co.shape.map(function (q) { return _gfP(q[0], q[1]); });
                    var cx = 0, cy = 0; xs.forEach(function (q) { cx += q[0]; cy += q[1]; }); cx /= xs.length; cy /= xs.length;
                    var h = svgEl('circle', { 'class': 'jgf-hit jgf-clk', cx: cx, cy: cy, r: 8, 'data-id': co.id }, gTop);
                    scalables.push({ el: h, r: 0, px: 10 });
                    it.center = [cx, cy];
                }
            });

            if (isPhys) {
                svgEl('path', { 'class': 'jgf-france', d: _gfPath(GF_FRANCE, true) }, gMain);
                svgEl('path', { 'class': 'jgf-france', d: _gfPath(GF_CORSICA, true) }, gMain);
                buildPhysique(gMain, gTop);
            } else {
                buildAdmin(gMain, gTop);
            }
            // Monaco : simple point, toujours visible
            var mo = GF_COUNTRIES.filter(function (x) { return x.id === 'monaco'; })[0];
            if (mo) {
                var mp = _gfP(mo.point[0], mo.point[1]);
                var dot = svgEl('circle', { 'class': 'jgf-monaco', cx: mp[0], cy: mp[1], r: 5 }, gTop);
                scalables.push({ el: dot, r: 5 });
                if (paysOn) {
                    var itm = newItem('monaco', 'pays', mo.name, { center: mp });
                    var hm = svgEl('circle', { 'class': 'jgf-hit jgf-clk', cx: mp[0], cy: mp[1], r: 8, 'data-id': 'monaco' }, gTop);
                    scalables.push({ el: hm, r: 0, px: 13 });
                    itm.shapes.push(dot); itm.main = dot;
                    var lpm = _gfP(mo.lbl[0], mo.lbl[1]);
                    addLabel(itm, 'jgf-l-country', lpm[0], lpm[1], 13, 0, 4, 'middle');
                    itm.lines = [mo.name];
                }
            }
            vb = fullView();
            setView(vb);
        }

        function buildPhysique(gMain, gTop) {
            var c = S.cfg;
            if (c.cats.massifs) GF_MASSIFS.forEach(function (m) {
                var it = newItem(m.id, 'massifs', m.name);
                var p = svgEl('path', { 'class': 'jgf-massif jgf-clk', d: _gfPath(m.shape, true), fill: 'url(#' + P + 'hatch)', 'data-id': m.id }, gMain);
                it.shapes.push(p); it.main = p;
                var lp = _gfP(m.lbl[0], m.lbl[1]);
                addLabel(it, 'jgf-l-massif', lp[0], lp[1], 21, 0, 7, 'middle');
                it.lines = m.name === 'Massif central' ? ['Massif', 'central'] : [m.name];
            });
            svgEl('path', { 'class': 'jgf-lake', d: _gfPath(GF_LEMAN, true) }, gMain);
            if (c.cats.fleuves) GF_RIVERS.forEach(function (r) {
                var it = newItem(r.id, 'fleuves', r.name);
                var d = _gfSmooth(r.path);
                svgEl('path', { 'class': 'jgf-river-hit jgf-clk', d: d, 'data-id': r.id, 'vector-effect': 'non-scaling-stroke' }, gMain);
                var line = svgEl('path', { 'class': 'jgf-river', d: d, 'vector-effect': 'non-scaling-stroke' }, gMain);
                it.shapes.push(line); it.main = line; it.line = true;
                var lp = _gfP(r.lbl[0], r.lbl[1]);
                addLabel(it, 'jgf-l-river', lp[0], lp[1], 19, 0, 6, 'middle');
                it.lines = [r.name];
            });
            if (c.cats.villes) GF_CITIES.forEach(function (ci) {
                var p = _gfP(ci.p[0], ci.p[1]);
                var it = newItem(ci.id, 'villes', ci.name, { center: p });
                var hit = svgEl('circle', { 'class': 'jgf-hit jgf-clk', cx: p[0], cy: p[1], r: 10, 'data-id': ci.id }, gTop);
                var r = ci.id === 'paris' ? 8 : 6;
                var dot = svgEl('circle', { 'class': 'jgf-city', cx: p[0], cy: p[1], r: r }, gTop);
                scalables.push({ el: dot, r: r });
                scalables.push({ el: hit, r: r, px: 14 });
                it.shapes.push(dot); it.main = dot;
                var pos = { r: [13, 6, 'start'], l: [-13, 6, 'end'], b: [0, 28, 'middle'] }[ci.lp] || [13, 6, 'start'];
                addLabel(it, 'jgf-l-city', p[0], p[1], ci.id === 'paris' ? 22 : 19, pos[0], pos[1], pos[2]);
                it.lines = [ci.name];
            });
            if (c.cats.mers) GF_SEAS.forEach(function (m) {
                var a = SEA_ANCHORS[m.id] || [m.lbl];
                var lp = _gfP(m.lbl[0], m.lbl[1]);
                var it = newItem(m.id, 'mers', m.name, { center: _gfP(a[0][0], a[0][1]), sea: true,
                    anchors: a.map(function (q) { return _gfP(q[0], q[1]); }) });
                addLabel(it, 'jgf-l-sea', lp[0], lp[1], 18, 0, 6, 'middle', { sw: 3 });
                it.lines = m.lines || [m.name];
            });
        }

        function buildAdmin(gMain, gTop) {
            var c = S.cfg, isReg = c.map === 'regions';
            // Comble l'écart entre le vrai tracé des frontières et les pays voisins dessinés à la main
            var hand = [[].concat(GF_B_BE, GF_B_LU, GF_B_DE, GF_B_CH, GF_B_IT), GF_B_ES];
            var gd = '';
            ADM.borders.forEach(function (real, i) {
                var back = hand[i].slice().reverse().map(function (q) { return _gfP(q[0], q[1]); });
                gd += real.concat(back).map(function (q, j) { return (j ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join('') + 'Z';
            });
            svgEl('path', { 'class': 'jgf-gap', d: gd }, gMain);

            if (isReg) {
                GF_REGIONS.forEach(function (r) {
                    var code = r[0], id = 'r-' + code;
                    var deps = GF_DEPS.filter(function (d) { return d[2] === code; }).map(function (d) { return ADM.deps[d[0]]; });
                    var it = newItem(id, 'regions', r[1], { color: r[5] });
                    var p = svgEl('path', { 'class': 'jgf-region jgf-clk', d: deps.map(function (d) { return d.d; }).join(''), 'data-id': id }, gMain);
                    it.shapes.push(p); it.main = p;
                    var shift = { '53': [-80, 4], '27': [6, 48], '11': [8, 14], '75': [30, -22] }[code] || [0, 0];
                    addLabel(it, 'jgf-l-reg', r[6] + shift[0], r[7] + shift[1], code === '11' ? 15 : 21, 0, 7, 'middle');
                    it.lines = r[2];
                    it.center = [r[6] + shift[0], r[7] + shift[1]];
                });
                svgEl('path', { 'class': 'jgf-line jgf-regline', d: ADM.dReg, 'vector-effect': 'non-scaling-stroke' }, gTop);
            } else {
                var shade = [0, 0.32, -0.07, 0.18, 0.42, 0.08], regCount = {};
                GF_DEPS.forEach(function (r) {
                    var dep = ADM.deps[r[0]], id = 'd-' + dep.code;
                    var n = regCount[dep.reg] = (regCount[dep.reg] || 0) + 1;
                    var small = ['75', '92', '93', '94'].indexOf(dep.code) >= 0;
                    var it = newItem(id, 'departements', dep.name, {
                        code: dep.code, small: small, center: dep.lbl,
                        color: mix(regColor[dep.reg], shade[(n - 1) % shade.length]),
                        nameLines: typeof _gfSplitName === 'function' ? _gfSplitName(dep.name) : [dep.name]
                    });
                    var p = svgEl('path', { 'class': 'jgf-dep jgf-clk', d: dep.d, 'data-id': id, 'vector-effect': 'non-scaling-stroke' }, gMain);
                    it.shapes.push(p); it.main = p;
                    addLabel(it, 'jgf-l-dep', dep.lbl[0], dep.lbl[1], 14, 0, 0, 'middle', { kind: 'dep', maxW: small ? 330 : 0, sw: 3 });
                });
                svgEl('path', { 'class': 'jgf-line jgf-regline', d: ADM.dReg, 'vector-effect': 'non-scaling-stroke' }, gTop);
            }
            svgEl('path', { 'class': 'jgf-line jgf-outer', d: ADM.dOuter, 'vector-effect': 'non-scaling-stroke' }, gTop);
        }

        // Étiquettes et couleurs selon l'état de chaque élément
        function refreshItem(it) {
            var st = S.status[it.id];
            it.shapes.forEach(function (s) {
                s.classList.toggle('ok', st === 'ok');
                s.classList.toggle('ko', st === 'ko');
            });
            if ((it.cat === 'regions' || it.cat === 'departements') && it.main) {
                if (st === 'ok') { it.main.style.fill = it.color; if (it.cat === 'regions') it.main.style.stroke = it.color; }
                else { it.main.style.fill = ''; it.main.style.stroke = ''; }
            }
            if (!it.label) return;
            var lines = [];
            if (it.cat === 'departements') {
                var showCode = st || (S.cfg.depMode === 'nom' && S.cfg.helpLabels);
                var showName = st || (S.cfg.depMode === 'numero' && S.cfg.helpLabels);
                if (showCode) lines.push({ t: it.code, k: 1, w: 900 });
                if (showName) it.nameLines.forEach(function (t) { lines.push({ t: t, k: showCode ? 0.62 : 0.72 }); });
            } else if (st) {
                lines = it.lines.map(function (t) { return { t: t }; });
            }
            it.label.el.classList.toggle('jgf-l-ko', st === 'ko');
            setLines(it.label, lines);
        }
        function refreshAll() {
            Object.keys(items).forEach(function (id) { refreshItem(items[id]); });
            setView(vb);
        }

        // =================================================================
        // Vue : zoom et déplacement
        // =================================================================
        function aspect() {
            var w = svg && svg.clientWidth, h = svg && svg.clientHeight;
            return (w && h) ? w / h : GF_W / GF_H;
        }
        function fullView() {
            var a = aspect();
            if (a > GF_W / GF_H) { var w = GF_H * a; return { x: (GF_W - w) / 2, y: 0, w: w, h: GF_H }; }
            var h = GF_W / a; return { x: 0, y: (GF_H - h) / 2, w: GF_W, h: h };
        }
        function clampView(v) {
            var f = fullView();
            var w = Math.min(f.w, Math.max(f.w / 16, v.w)), h = w * f.h / f.w;
            var cx = v.x + v.w / 2, cy = v.y + v.h / 2;
            var x = Math.max(f.x, Math.min(f.x + f.w - w, cx - w / 2));
            var y = Math.max(f.y, Math.min(f.y + f.h - h, cy - h / 2));
            return { x: x, y: y, w: w, h: h };
        }
        function lblBoost() {
            var w = svg && svg.clientWidth;
            if (!w) return 1;
            return Math.max(1, Math.min(2, 560 / w));
        }
        function setView(v) {
            vb = v;
            if (!svg) return;
            svg.setAttribute('viewBox', v.x.toFixed(2) + ' ' + v.y.toFixed(2) + ' ' + v.w.toFixed(2) + ' ' + v.h.toFixed(2));
            var s = Math.min(1, Math.pow(v.w / GF_W, 0.7)) * lblBoost();
            var upp = v.w / (svg.clientWidth || 600);
            scalables.forEach(function (o) {
                var r = o.r * s;
                if (o.px) r = Math.max(r, o.px * upp);
                o.el.setAttribute('r', r.toFixed(2));
            });
            labels.forEach(function (lb) {
                var hide = !lb.cur.length || (lb.maxW && v.w > lb.maxW);
                lb.el.style.display = hide ? 'none' : '';
                if (hide) return;
                lb.el.setAttribute('font-size', (lb.size * s).toFixed(2));
                lb.el.style.strokeWidth = (lb.sw * s).toFixed(2) + 'px';
                var x = lb.ax + lb.dx * s, y = lb.ay + lb.dy * s;
                lb.el.setAttribute('x', x.toFixed(1));
                lb.el.setAttribute('y', y.toFixed(1));
                var hs = lb.cur.map(function (l) { return lb.size * (l.k || 1) * s * 1.1; });
                var total = hs.reduce(function (a, b) { return a + b; }, 0), acc = -total / 2;
                Array.prototype.forEach.call(lb.el.querySelectorAll('tspan'), function (t, i) {
                    var k = (lb.cur[i] && lb.cur[i].k) || 1, cc = acc + hs[i] / 2;
                    acc += hs[i];
                    t.setAttribute('x', x.toFixed(1));
                    t.setAttribute('y', (y + (lb.cur.length > 1 || lb.kind === 'dep' ? cc : 0) + (lb.kind === 'dep' ? 0.36 * lb.size * k * s : 0)).toFixed(1));
                    if (k !== 1) t.setAttribute('font-size', (lb.size * k * s).toFixed(2));
                });
            });
        }
        function animateView(to) {
            if (animId) cancelAnimationFrame(animId);
            var from = { x: vb.x, y: vb.y, w: vb.w, h: vb.h }, t0 = performance.now(), dur = 450;
            function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
            function step(now) {
                var k = Math.min(1, (now - t0) / dur), e = ease(k);
                setView({ x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e,
                          w: from.w + (to.w - from.w) * e, h: from.h + (to.h - from.h) * e });
                if (k < 1 && root.isConnected) animId = requestAnimationFrame(step); else animId = null;
            }
            animId = requestAnimationFrame(step);
        }
        function zoomAt(k, ux, uy) {
            setView(clampView({ x: ux - (ux - vb.x) * k, y: uy - (uy - vb.y) * k, w: vb.w * k, h: vb.h * k }));
        }
        function toUser(cx, cy) {
            var r = svg.getBoundingClientRect();
            return [vb.x + (cx - r.left) / (r.width || 1) * vb.w, vb.y + (cy - r.top) / (r.height || 1) * vb.h];
        }
        function itemBox(it) {
            if (it.sea) return { x: it.center[0] - 60, y: it.center[1] - 60, w: 120, h: 120 };
            try {
                var b = it.main.getBBox();
                if (b.width || b.height) return { x: b.x, y: b.y, w: b.width, h: b.height };
            } catch (e) {}
            var c = it.center || [GF_W / 2, GF_H / 2];
            return { x: c[0] - 10, y: c[1] - 10, w: 20, h: 20 };
        }
        function itemCenter(it) {
            if (it.center) return it.center;
            var b = itemBox(it);
            return [b.x + b.w / 2, b.y + b.h / 2];
        }
        // Zoome automatiquement si l'élément est trop petit à l'écran
        function focusIfSmall(it) {
            var b = itemBox(it), upp = vb.w / (svg.clientWidth || 600);
            if (Math.max(b.w, b.h) / upp >= 26) return;
            var c = itemCenter(it), w = Math.max(140, Math.max(b.w, b.h) * 9);
            animateView(clampView({ x: c[0] - w / 2, y: c[1] - w * vb.h / vb.w / 2, w: w, h: w * vb.h / vb.w }));
        }

        // ── Gestes : toucher, glisser, pincer, molette ───────────────────
        var ptrs = {}, gesture = null, TAP_TOL = 8;
        function onDown(e) {
            if (e.button != null && e.button > 0) return;
            e.preventDefault(); e.stopPropagation();
            root.focus({ preventScroll: true });
            ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
            try { svg.setPointerCapture(e.pointerId); } catch (er) {}
            var ids = Object.keys(ptrs);
            if (ids.length === 1) {
                gesture = { type: 'tap', target: e.target, x0: e.clientX, y0: e.clientY, vb0: { x: vb.x, y: vb.y, w: vb.w, h: vb.h }, moved: false };
            } else if (ids.length === 2) {
                var a = ptrs[ids[0]], b = ptrs[ids[1]];
                var mid = [(a.x + b.x) / 2, (a.y + b.y) / 2];
                gesture = { type: 'pinch', d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, vb0: { x: vb.x, y: vb.y, w: vb.w, h: vb.h }, u0: toUser(mid[0], mid[1]) };
            }
        }
        function onMove(e) {
            if (!ptrs[e.pointerId] || !gesture) return;
            ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
            var r = svg.getBoundingClientRect();
            if (gesture.type === 'tap') {
                var dx = e.clientX - gesture.x0, dy = e.clientY - gesture.y0;
                if (!gesture.moved && Math.hypot(dx, dy) > TAP_TOL) gesture.moved = true;
                if (gesture.moved) {
                    if (animId) { cancelAnimationFrame(animId); animId = null; }
                    var k = gesture.vb0.w / (r.width || 1);
                    setView(clampView({ x: gesture.vb0.x - dx * k, y: gesture.vb0.y - dy * k, w: gesture.vb0.w, h: gesture.vb0.h }));
                }
            } else if (gesture.type === 'pinch') {
                var ids = Object.keys(ptrs); if (ids.length < 2) return;
                var a = ptrs[ids[0]], b = ptrs[ids[1]];
                var kz = gesture.d0 / (Math.hypot(a.x - b.x, a.y - b.y) || 1);
                var v0 = gesture.vb0, u = gesture.u0;
                setView(clampView({ x: u[0] - (u[0] - v0.x) * kz, y: u[1] - (u[1] - v0.y) * kz, w: v0.w * kz, h: v0.h * kz }));
            }
        }
        function onUp(e) {
            if (!ptrs[e.pointerId]) return;
            delete ptrs[e.pointerId];
            var g = gesture;
            if (!Object.keys(ptrs).length) gesture = null;
            else if (g && g.type === 'pinch') gesture = { type: 'none' };
            if (e.type === 'pointerup' && g && g.type === 'tap' && !g.moved) handleTap(g.target, e.clientX, e.clientY);
        }

        // ── Clic sur la carte ───────────────────────────────────────────
        function seaAt(u) {
            var best = null, bd = 1e9;
            Object.keys(items).forEach(function (id) {
                var it = items[id]; if (!it.sea) return;
                it.anchors.forEach(function (a) { var d = Math.hypot(a[0] - u[0], a[1] - u[1]); if (d < bd) { bd = d; best = it; } });
            });
            return bd < 330 ? best : null;
        }
        function itemTitle(it) {
            if (it.cat === 'departements') return it.code + ' ' + it.name;
            return it.name;
        }
        function handleTap(target, cx, cy) {
            if (!S.running || S.done || S.lock) return;
            var u = toUser(cx, cy);
            var hit = target && target.closest ? target.closest('[data-id]') : null;
            var it = hit ? items[hit.getAttribute('data-id')] : null;
            if (!it && target && target.classList && target.classList.contains('jgf-water')) it = seaAt(u);
            var cur = items[S.order[S.idx]];
            if (!cur) return;
            if (!S.t0) S.t0 = Date.now();
            if (it === cur) { correct(cur); return; }
            S.errors++; S.tries++;
            drawMiss(u[0], u[1]);
            mapWrap.classList.remove('shake'); void mapWrap.offsetWidth; mapWrap.classList.add('shake');
            if (it && it.main) {
                var cls = it.line ? 'jgf-badl' : 'jgf-bad';
                it.main.classList.remove(cls); void it.main.getBBox; it.main.classList.add(cls);
                setTimeout(function () { it.main.classList.remove(cls); }, 850);
            }
            if (prog.sound) beep(170, 0.14, 'square', 0.035);
            var left = MAX_TRIES - S.tries;
            var what = it ? 'Non, ici c\'est ' + (it.cat === 'departements' ? 'le ' : '') + itemTitle(it) + '.' : 'Pas ici !';
            if (left > 0) {
                setMsg('❌ ' + what + ' Encore ' + left + ' essai' + (left > 1 ? 's' : '') + '.');
                updateUI(); save();
            } else {
                reveal(cur, what);
            }
        }
        function drawMiss(x, y) {
            var upp = vb.w / (svg.clientWidth || 600), r = 11 * upp, a = 5 * upp;
            var m = svgEl('g', { 'class': 'jgf-miss' }, gFx);
            svgEl('circle', { cx: x, cy: y, r: r, fill: 'rgba(239,68,68,.25)', stroke: '#ef4444', 'stroke-width': 2.5 * upp }, m);
            svgEl('path', { d: 'M' + (x - a) + ' ' + (y - a) + 'L' + (x + a) + ' ' + (y + a) + 'M' + (x + a) + ' ' + (y - a) + 'L' + (x - a) + ' ' + (y + a),
                            stroke: '#ef4444', 'stroke-width': 3 * upp, 'stroke-linecap': 'round' }, m);
            setTimeout(function () { m.remove(); }, 950);
        }
        function pulse(it, ko) {
            var c = itemCenter(it), b = itemBox(it), upp = vb.w / (svg.clientWidth || 600);
            var r = Math.max(22 * upp, Math.min(Math.hypot(b.w, b.h) * 0.45, 200));
            var p = svgEl('circle', { 'class': 'jgf-pulse' + (ko ? ' ko' : ''), cx: c[0], cy: c[1], r: r, 'stroke-width': 4 * upp }, gFx);
            setTimeout(function () { p.remove(); }, ko ? 2300 : 1200);
        }
        function clearHint() {
            S.hintId = null;
            if (gFx) Array.prototype.forEach.call(gFx.querySelectorAll('.jgf-hintc'), function (h) { h.remove(); });
        }
        function correct(it) {
            S.status[it.id] = 'ok';
            if (S.tries === 0) S.first++;
            clearHint();
            refreshItem(it); setView(vb);
            pulse(it, false);
            if (prog.sound) { beep(660, 0.09, 'triangle', 0.07); beep(990, 0.12, 'triangle', 0.06, 0.08); }
            var bravo = S.tries === 0 ? ['Bravo !', 'Excellent !', 'Parfait !', 'Bien vu !', 'Super !'][Math.floor(Math.random() * 5)] : 'Trouvé !';
            setMsg('✅ ' + bravo + ' ' + (it.cat === 'departements' ? 'Le ' + it.code + ', c\'est ' + it.name + '.' : 'C\'est bien ' + it.name + '.'));
            nextQuestion();
        }
        function reveal(it, prefix) {
            S.status[it.id] = 'ko';
            clearHint();
            refreshItem(it); setView(vb);
            focusIfSmall(it);
            pulse(it, true);
            setMsg('🟠 ' + (prefix ? prefix + ' ' : '') + 'La bonne réponse est montrée en orange.');
            S.lock = true;
            updateUI(); save();
            setTimeout(function () { S.lock = false; if (root.isConnected) nextQuestion(); }, 1600);
        }
        function nextQuestion() {
            S.idx++; S.tries = 0;
            if (S.idx >= S.order.length) { updateUI(); win(); return; }
            showQuestion(true);
            updateUI(); save();
        }
        function showQuestion(anim) {
            var it = items[S.order[S.idx]];
            if (!it) return;
            var cat = CATS[it.cat], name = it.name, lbl = 'Clique sur la carte :', kind = cat.kind;
            if (it.cat === 'departements') {
                if (S.cfg.depMode === 'numero') { name = it.code; lbl = 'Où est le département n° :'; kind = 'Numéro de département'; }
                else lbl = 'Où est le département :';
            }
            $('.jgf-qlbl').textContent = lbl;
            $('.jgf-qname').textContent = name;
            var k = $('.jgf-qkind');
            k.textContent = cat.ico + ' ' + kind;
            k.style.background = cat.color;
            if (anim) { qBox.classList.remove('pop'); void qBox.offsetWidth; qBox.classList.add('pop'); }
            if (it.small && vb.w > 330) setMsg((($('.jgf-msg').textContent || '') + ' 🔍 Astuce : zoome sur l\'Île-de-France.').trim());
        }

        // ── Indice / passer ─────────────────────────────────────────────
        function hint() {
            if (!S.running || S.done || S.lock) return;
            var it = items[S.order[S.idx]]; if (!it) return;
            clearHint();
            S.hints++; S.hintId = it.id;
            if (!S.t0) S.t0 = Date.now();
            focusIfSmall(it);
            var c = itemCenter(it), b = itemBox(it);
            var R = Math.max(45, Math.min(260, Math.hypot(b.w, b.h) * 0.7 + 40)), a = Math.random() * Math.PI * 2, off = R * 0.35;
            svgEl('circle', { 'class': 'jgf-hintc', cx: (c[0] + Math.cos(a) * off).toFixed(1), cy: (c[1] + Math.sin(a) * off).toFixed(1), r: R.toFixed(1),
                              'vector-effect': 'non-scaling-stroke' }, gFx);
            setMsg('💡 Cherche dans le cercle jaune.');
            if (prog.sound) beep(880, 0.12, 'sine', 0.05);
            updateUI(); save();
        }
        function skip() {
            if (!S.running || S.done || S.lock) return;
            var it = items[S.order[S.idx]]; if (!it) return;
            if (!S.t0) S.t0 = Date.now();
            reveal(it, '⏭ Question passée.');
        }

        // ── Partie ──────────────────────────────────────────────────────
        function poolIds() {
            var c = S.cfg;
            return Object.keys(items).filter(function (id) {
                var it = items[id];
                if (c.map === 'physique') return !!c.cats[it.cat];
                return it.cat === (c.map === 'regions' ? 'regions' : 'departements');
            });
        }
        function startGame(saved) {
            buildMap();
            S.status = {}; S.idx = 0; S.tries = 0; S.errors = 0; S.hints = 0; S.first = 0;
            S.elapsed = 0; S.t0 = 0; S.done = false; S.lock = false; S.hintId = null;
            var pool = poolIds();
            if (saved && Array.isArray(saved.order) && saved.order.length) {
                S.order = saved.order.filter(function (id) { return items[id]; });
                S.idx = Math.max(0, Math.min(S.order.length, saved.idx | 0));
                Object.keys(saved.status || {}).forEach(function (id) { if (items[id]) S.status[id] = saved.status[id]; });
                S.errors = saved.errors | 0; S.hints = saved.hints | 0; S.first = saved.first | 0;
                S.elapsed = +saved.elapsed || 0;
            } else {
                S.order = shuffle(pool.slice());
                if (S.cfg.len !== 'all') S.order = S.order.slice(0, Math.min(S.order.length, +S.cfg.len));
            }
            S.running = S.order.length > 0;
            if (S.idx >= S.order.length) S.done = true;
            hideOv();
            refreshAll();
            if (S.done) { S.running = true; updateUI(); return; }
            if (S.elapsed) S.t0 = Date.now();
            showQuestion(true);
            setMsg(saved ? '' : MAPS[S.cfg.map].ico + ' ' + MAPS[S.cfg.map].name + ' : ' + S.order.length + ' question' + (S.order.length > 1 ? 's' : '') + '. À toi de jouer !');
            updateUI();
            requestAnimationFrame(function () { setView(clampView(vb)); });
        }

        function timeNow() { return S.elapsed + (S.t0 && !S.done ? Date.now() - S.t0 : 0); }
        function counts() {
            var ok = 0, ko = 0;
            S.order.forEach(function (id) { if (S.status[id] === 'ok') ok++; else if (S.status[id] === 'ko') ko++; });
            return { ok: ok, ko: ko, n: S.order.length };
        }
        function starsFor() {
            var c = counts();
            if (!c.n || c.ok === 0) return 0;
            if (c.ko === 0 && S.hints === 0 && S.errors <= Math.max(1, Math.floor(c.n * 0.1))) return 3;
            if (c.ok / c.n >= 0.8 && S.errors <= c.n * 0.5) return 2;
            return 1;
        }
        function starHTML(n) {
            var h = '';
            for (var i = 0; i < 3; i++) h += '<span class="' + (i < n ? 'on' : 'off') + '">★</span>';
            return h;
        }
        function updateUI() {
            var m = MAPS[S.cfg.map], pill = $('.jgf-pill');
            pill.className = 'jgf-pill ' + m.cls; pill.textContent = m.short;
            var sub = '';
            if (S.cfg.map === 'departements') sub = S.cfg.depMode === 'numero' ? 'par numéro' : 'par nom';
            else if (S.cfg.map === 'physique') sub = PHYS_CATS.filter(function (k) { return S.cfg.cats[k]; }).map(function (k) { return CATS[k].ico; }).join('');
            $('.jgf-lvltxt').innerHTML = '<span class="jgf-lvlword">' + esc(sub) + '</span>';
            var c = counts();
            $('.jgf-v-prog').textContent = (c.ok + c.ko) + ' / ' + c.n;
            $('.jgf-pbar .ok').style.width = (c.n ? c.ok / c.n * 100 : 0) + '%';
            $('.jgf-pbar .ko').style.width = (c.n ? c.ko / c.n * 100 : 0) + '%';
            $('.jgf-v-err').textContent = S.errors;
            $('.jgf-v-time').textContent = fmtTime(timeNow());
            var best = prog.best[cfgKey(S.cfg)];
            $('.jgf-v-best').textContent = best && best.time ? fmtTime(best.time) : '–';
            var tries = '';
            for (var i = 0; i < MAX_TRIES; i++) tries += '<span class="' + (i < MAX_TRIES - S.tries ? '' : 'off') + '">❤️</span>';
            $('.jgf-qtries').innerHTML = S.running && !S.done ? tries : '';
            var active = S.running && !S.done;
            $('.jgf-hint').disabled = !active; $('.jgf-skip').disabled = !active;
            if (S.done) {
                $('.jgf-qlbl').textContent = 'Série terminée';
                $('.jgf-qname').textContent = c.ok + ' / ' + c.n;
                var k = $('.jgf-qkind'); k.textContent = '⭐ ' + ['', '1 étoile', '2 étoiles', '3 étoiles'][starsFor()] ; k.style.background = '#0f5e4a';
                if (!starsFor()) k.textContent = 'Essaie encore !';
            } else if (!S.running) {
                $('.jgf-qlbl').textContent = 'Prêt ?';
                $('.jgf-qname').textContent = 'Choisis une carte';
                var k2 = $('.jgf-qkind'); k2.textContent = '🗺️ Géo France'; k2.style.background = '#0f5e4a';
            }
            var sb = $('.jgf-sound');
            sb.textContent = prog.sound ? '🔊' : '🔇';
            sb.title = prog.sound ? 'Couper le son' : 'Activer le son';
        }
        function setMsg(t) { $('.jgf-msg').textContent = t || ''; }
        function save() { if (typeof saveBoard === 'function') { try { saveBoard(); } catch (e) {} } }

        var tick = setInterval(function () {
            if (!root.isConnected) { clearInterval(tick); return; }
            if (S.t0 && !S.done) $('.jgf-v-time').textContent = fmtTime(timeNow());
        }, 500);

        function win() {
            if (S.done) return;
            S.done = true;
            if (S.t0) { S.elapsed += Date.now() - S.t0; S.t0 = 0; }
            clearHint();
            var stars = starsFor(), c = counts(), t = S.elapsed, key = cfgKey(S.cfg), record = false;
            var b = prog.best[key] || {};
            if (stars > (b.stars || 0)) b.stars = stars;
            if (c.ko === 0 && !S.hints && (!b.time || t < b.time)) { b.time = t; record = true; }
            prog.best[key] = b; saveProgress(prog);
            updateUI();
            if (prog.sound && stars) [523, 659, 784, 1047].forEach(function (f, j) { beep(f, 0.18, 'triangle', 0.07, 0.1 + j * 0.11); });
            setTimeout(function () {
                if (!root.isConnected) return;
                $('.jgf-win-title').textContent = stars === 3 ? 'Champion de géo ! 🏆' : (stars === 2 ? 'Bravo !' : (stars ? 'Bien joué !' : 'Courage !'));
                var st = $('.jgf-win-stars');
                st.innerHTML = starHTML(stars);
                Array.prototype.forEach.call(st.querySelectorAll('.on'), function (s, j) { s.style.animationDelay = (j * 0.18) + 's'; });
                $('.jgf-win-txt').innerHTML =
                    '<b>' + c.ok + ' / ' + c.n + '</b> trouvé' + (c.ok > 1 ? 's' : '') + ' (dont <b>' + S.first + '</b> du premier coup)' +
                    '<br>en <b>' + fmtTime(t) + '</b>, avec <b>' + S.errors + '</b> erreur' + (S.errors > 1 ? 's' : '') +
                    (S.hints ? ' et ' + S.hints + ' indice' + (S.hints > 1 ? 's' : '') : '') +
                    (c.ko ? '<br>🟠 ' + c.ko + ' réponse' + (c.ko > 1 ? 's' : '') + ' montrée' + (c.ko > 1 ? 's' : '') + ' en orange' : '') +
                    (record ? '<br>🏆 Nouveau record !' : '');
                showOv('.jgf-ov-win');
                if (stars >= 2) confetti();
            }, 700);
            save();
        }
        function confetti() {
            var cols = ['#ffd23f', '#e11d2e', '#22c55e', '#3b82f6', '#a855f7', '#f97316'];
            for (var i = 0; i < 40; i++) {
                var cf = el('div', 'jgf-confetti');
                cf.style.left = (Math.random() * 100) + '%';
                cf.style.background = cols[i % cols.length];
                cf.style.animationDuration = (1.6 + Math.random() * 1.6) + 's';
                cf.style.animationDelay = (Math.random() * 0.4) + 's';
                root.appendChild(cf);
                (function (cc) { setTimeout(function () { cc.remove(); }, 3800); })(cf);
            }
        }

        // ── Fenêtre « choisir une carte » ───────────────────────────────
        function cloneCfg(c) { return JSON.parse(JSON.stringify(c)); }
        function totalFor(c) {
            if (c.map === 'regions') return GF_REGIONS.length;
            if (c.map === 'departements') return GF_DEPS.length;
            var n = 0;
            if (c.cats.villes) n += GF_CITIES.length;
            if (c.cats.fleuves) n += GF_RIVERS.length;
            if (c.cats.massifs) n += GF_MASSIFS.length;
            if (c.cats.pays) n += GF_COUNTRIES.length;
            if (c.cats.mers) n += GF_SEAS.length;
            return n;
        }
        function renderSetup() {
            var c = S.setupCfg, h = '';
            Object.keys(MAPS).forEach(function (k, i) {
                var m = MAPS[k];
                h += '<button class="jgf-mapbtn' + (c.map === k ? ' cur' : '') + '" data-map="' + k + '"><span class="n">Carte ' + (i + 1) + '</span>' +
                     '<em>' + m.ico + '</em><b>' + m.name + '</b><small>' + m.desc + '</small></button>';
            });
            $('.jgf-maps').innerHTML = h;
            var o = '';
            if (c.map === 'physique') {
                o = '<div class="jgf-optrow"><span>À replacer :</span>' + PHYS_CATS.map(function (k) {
                    return '<button class="jgf-chip' + (c.cats[k] ? ' on' : '') + '" data-cat="' + k + '">' + CATS[k].ico + ' ' + CATS[k].label + '</button>';
                }).join('') + '</div>';
            } else if (c.map === 'departements') {
                o = '<div class="jgf-optrow"><span>On te donne :</span>' +
                    '<button class="jgf-chip' + (c.depMode === 'nom' ? ' on' : '') + '" data-dep="nom">🔤 Le nom</button>' +
                    '<button class="jgf-chip' + (c.depMode === 'numero' ? ' on' : '') + '" data-dep="numero">🔢 Le numéro</button></div>' +
                    '<div class="jgf-optrow"><span>Sur la carte :</span>' +
                    '<button class="jgf-chip' + (c.helpLabels ? ' on' : '') + '" data-help="1">' + (c.depMode === 'nom' ? '🔢 Afficher les numéros' : '🔤 Afficher les noms') + '</button>' +
                    '<button class="jgf-chip' + (!c.helpLabels ? ' on' : '') + '" data-help="0">🙈 Carte muette</button></div>';
            } else {
                o = '<div class="jgf-setup-note">Replace les 13 régions de France métropolitaine.</div>';
            }
            $('.jgf-opts').innerHTML = o;
            var tot = totalFor(c), lens = [];
            if (tot > 10) lens.push(10);
            if (tot > 20) lens.push(20);
            if (tot > 40) lens.push(40);
            if (c.len !== 'all' && lens.indexOf(+c.len) < 0) c.len = 'all';
            $('.jgf-lenrow').innerHTML = '<span>Questions :</span>' + lens.map(function (n) {
                return '<button class="jgf-chip' + (+c.len === n ? ' on' : '') + '" data-len="' + n + '">' + n + '</button>';
            }).join('') + '<button class="jgf-chip' + (c.len === 'all' ? ' on' : '') + '" data-len="all">Toutes (' + tot + ')</button>';
            var b = prog.best[cfgKey(c)];
            $('.jgf-best-note').innerHTML = b ? 'Ton meilleur résultat : ' + starHTML(b.stars || 0).replace(/class="on"/g, 'style="color:#f4b400"').replace(/class="off"/g, 'style="color:#ccd"') +
                (b.time ? ' — record : <b>' + fmtTime(b.time) + '</b>' : '') : '';
            $('.jgf-go').disabled = tot === 0;
        }
        function openSetup() {
            S.setupCfg = cloneCfg(S.cfg);
            renderSetup();
            showOv('.jgf-ov-setup');
            $('.jgf-ov-setup .jgf-x').style.display = S.running ? '' : 'none';
        }
        $('.jgf-ov-setup').addEventListener('click', function (e) {
            var c = S.setupCfg, t;
            if ((t = e.target.closest('[data-map]'))) { c.map = t.dataset.map; renderSetup(); return; }
            if ((t = e.target.closest('[data-cat]'))) {
                var k = t.dataset.cat;
                c.cats[k] = !c.cats[k];
                if (!PHYS_CATS.some(function (x) { return c.cats[x]; })) c.cats[k] = true;   // au moins une catégorie
                renderSetup(); return;
            }
            if ((t = e.target.closest('[data-dep]'))) { c.depMode = t.dataset.dep; renderSetup(); return; }
            if ((t = e.target.closest('[data-help]'))) { c.helpLabels = t.dataset.help === '1'; renderSetup(); return; }
            if ((t = e.target.closest('[data-len]'))) { c.len = t.dataset.len === 'all' ? 'all' : +t.dataset.len; renderSetup(); return; }
            if (e.target.closest('.jgf-go')) { S.cfg = cloneCfg(c); startGame(); save(); }
        });

        function showOv(sel) { hideOv(); $(sel).classList.add('show'); }
        function hideOv() { Array.prototype.forEach.call(root.querySelectorAll('.jgf-ov'), function (o) { o.classList.remove('show'); }); }
        root.addEventListener('click', function (e) {
            if (e.target.closest('.jgf-x')) { if (S.running || !$('.jgf-ov-setup').classList.contains('show')) hideOv(); return; }
            if (e.target.classList.contains('jgf-ov') && S.running && !$('.jgf-ov-win').classList.contains('show')) hideOv();
        });
        root.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && S.running) { hideOv(); e.stopPropagation(); }
        });

        $('.jgf-lvlbtn').addEventListener('click', openSetup);
        $('.jgf-choose').addEventListener('click', openSetup);
        $('.jgf-hint').addEventListener('click', hint);
        $('.jgf-skip').addEventListener('click', skip);
        $('.jgf-reset').addEventListener('click', function () { startGame(); save(); });
        $('.jgf-w-again').addEventListener('click', function () { startGame(); save(); });
        $('.jgf-w-maps').addEventListener('click', openSetup);
        $('.jgf-w-see').addEventListener('click', hideOv);
        $('.jgf-help').addEventListener('click', function () { showOv('.jgf-ov-help'); });
        $('.jgf-sound').addEventListener('click', function () { prog.sound = !prog.sound; saveProgress(prog); updateUI(); });
        $('.jgf-zin').addEventListener('click', function () { zoomAt(1 / 1.5, vb.x + vb.w / 2, vb.y + vb.h / 2); });
        $('.jgf-zout').addEventListener('click', function () { zoomAt(1.5, vb.x + vb.w / 2, vb.y + vb.h / 2); });
        $('.jgf-zall').addEventListener('click', function () { animateView(fullView()); });

        mapWrap.addEventListener('pointerdown', function (e) {
            if (e.target.closest('.jgf-zoom')) { e.stopPropagation(); return; }
            if (svg && svg.contains(e.target)) onDown(e);
        });
        mapWrap.addEventListener('pointermove', function (e) { if (svg) onMove(e); });
        mapWrap.addEventListener('pointerup', function (e) { if (svg) onUp(e); });
        mapWrap.addEventListener('pointercancel', function (e) { if (svg) onUp(e); });
        mapWrap.addEventListener('wheel', function (e) {
            if (!svg) return;
            e.preventDefault(); e.stopPropagation();
            if (animId) { cancelAnimationFrame(animId); animId = null; }
            var u = toUser(e.clientX, e.clientY);
            zoomAt(e.deltaY < 0 ? 1 / 1.2 : 1.2, u[0], u[1]);
        }, { passive: false });

        // ── Boutons fenêtre ─────────────────────────────────────────────
        $('.wf-btn-min').addEventListener('click', function (e) {
            e.stopPropagation();
            if (S.fullboard) $('.wf-btn-max').click();
            if (widget.classList.contains('phone-fs') && typeof window.exitPhoneFullscreen === 'function') window.exitPhoneFullscreen(widget);
            root.style.display = 'none';
            if (typeof window._wfMiniBarCollapse === 'function') {
                window._wfMiniBarCollapse(widget, '🗺️ Géo France', {
                    onExpand: function () { root.style.display = ''; applySize(); requestAnimationFrame(layout); }
                });
            } else root.style.display = '';
        });
        $('.wf-btn-max').addEventListener('click', function (e) {
            e.stopPropagation();
            S.fullboard = !S.fullboard;
            root.classList.toggle('jgf-fullboard', S.fullboard);
            setFullboardHost(S.fullboard);
            applySize();
            requestAnimationFrame(layout);
            save();
        });
        $('.wf-btn-close').addEventListener('click', function (e) {
            e.stopPropagation();
            if (typeof snapshotNow === 'function') { try { snapshotNow(); } catch (er) {} }
            if (widget.classList.contains('phone-fs') && typeof window.exitPhoneFullscreen === 'function') window.exitPhoneFullscreen(widget);
            clearInterval(tick);
            if (S.fullboard) { S.fullboard = false; root.classList.remove('jgf-fullboard'); setFullboardHost(false); }
            widget.remove();
            save();
        });

        // ── Plein écran : un « transform » sur le widget (rotation, déplacement)
        //    ferait de lui le repère du position:fixed → le jeu déborderait de
        //    l'écran et il faudrait faire défiler la page. On le neutralise
        //    le temps du plein écran, et on bloque le défilement de la page.
        function setFullboardHost(on) {
            if (on) {
                if (widget.dataset.jgfFs !== '1') {
                    widget.dataset.jgfFs = '1';
                    widget.dataset.jgfZ = widget.style.zIndex || '';
                    widget.dataset.jgfTr = widget.style.transform || '';
                }
                widget.style.zIndex = '9999';
                widget.style.transform = 'none';
                document.body.classList.add('jgf-noscroll');
                try { window.scrollTo(0, 0); } catch (e) {}
            } else {
                if (widget.dataset.jgfFs === '1') {
                    widget.style.zIndex = widget.dataset.jgfZ || '';
                    widget.style.transform = widget.dataset.jgfTr || '';
                }
                widget.dataset.jgfFs = '';
                if (!document.querySelector('.jgf-root.jgf-fullboard')) document.body.classList.remove('jgf-noscroll');
            }
        }

        // ── Mise en page ────────────────────────────────────────────────
        function applySize() {
            if (S.fullboard || widget.classList.contains('phone-fs')) { root.style.width = ''; root.style.height = ''; }
            else { root.style.width = S.w + 'px'; root.style.height = S.h + 'px'; }
        }
        var _lastAsp = 0, _lastFullW = 0;
        function layout() {
            var W = root.clientWidth, H = root.clientHeight;
            if (!W || !H) return;
            var ui = Math.max(0.75, Math.min(1.5, Math.min(W / DEF_W, H / DEF_H) * 1.05));
            root.style.setProperty('--ui', ui.toFixed(3));
            root.classList.toggle('jgf-narrow', W < 620);
            body.classList.toggle('col', W < 640 || W / H < 1.12);
            if (svg) {
                var a = aspect();
                if (Math.abs(a - _lastAsp) > 0.001) {
                    // la carte était-elle entière avant le changement de taille ?
                    var wasFull = !_lastAsp || vb.w >= _lastFullW - 1;
                    _lastAsp = a;
                    setView(wasFull ? fullView() : clampView({ x: vb.x, y: vb.y, w: vb.w, h: vb.w / a }));
                } else setView(vb);
                _lastFullW = fullView().w;
            }
        }

        var grip = $('.jgf-grip'), rs = null;
        grip.addEventListener('pointerdown', function (e) {
            e.preventDefault(); e.stopPropagation();
            rs = { x: e.clientX, y: e.clientY, w: root.offsetWidth, h: root.offsetHeight, id: e.pointerId,
                   k: root.getBoundingClientRect().width / root.offsetWidth || 1 };
            try { grip.setPointerCapture(e.pointerId); } catch (er) {}
        });
        grip.addEventListener('pointermove', function (e) {
            if (!rs || e.pointerId !== rs.id) return;
            S.w = Math.max(MIN_W, Math.round(rs.w + (e.clientX - rs.x) / rs.k));
            S.h = Math.max(MIN_H, Math.round(rs.h + (e.clientY - rs.y) / rs.k));
            applySize();
        });
        function endResize(e) { if (!rs || e.pointerId !== rs.id) return; rs = null; save(); }
        grip.addEventListener('pointerup', endResize);
        grip.addEventListener('pointercancel', endResize);

        if (window.ResizeObserver) {
            var ro = new ResizeObserver(function () { if (!root.isConnected) { ro.disconnect(); return; } layout(); });
            ro.observe(root); ro.observe(mapWrap);
        } else window.addEventListener('resize', layout);

        // ── Données pour la sauvegarde du tableau (save-load.js) ─────────
        widget._jgfGetData = function () {
            return {
                cfg: cloneCfg(S.cfg),
                started: S.running,
                order: S.order.slice(), idx: S.idx, status: JSON.parse(JSON.stringify(S.status)),
                errors: S.errors, hints: S.hints, first: S.first, elapsed: timeNow(),
                w: S.w, h: S.h, fullboard: S.fullboard
            };
        };

        // ── État initial ─────────────────────────────────────────────────
        var restored = !!(data && (data._restored || data.cfg));
        if (data.w) S.w = Math.max(MIN_W, +data.w || DEF_W);
        if (data.h) S.h = Math.max(MIN_H, +data.h || DEF_H);
        if (data.cfg && MAPS[data.cfg.map]) {
            var dc = defaultCfg();
            S.cfg = { map: data.cfg.map, cats: data.cfg.cats || dc.cats, depMode: data.cfg.depMode === 'numero' ? 'numero' : 'nom',
                      helpLabels: data.cfg.helpLabels !== false, len: data.cfg.len || 'all' };
        }
        if (data.fullboard) { S.fullboard = true; root.classList.add('jgf-fullboard'); setFullboardHost(true); }
        applySize();
        if (data.started && Array.isArray(data.order) && data.order.length) {
            startGame(data);
        } else {
            buildMap();
            updateUI();
            openSetup();
        }
        requestAnimationFrame(layout);
        setTimeout(layout, 120);

        // Sur téléphone, une partie lancée depuis le panneau s'ouvre en plein écran
        if (!restored && isPhone() && !S.fullboard) {
            requestAnimationFrame(function () { $('.wf-btn-max').click(); });
        }
        function isPhone() {
            if (typeof isMobileBoardMode === 'function') { try { return !!isMobileBoardMode(); } catch (e) {} }
            if (typeof window.isPhoneScreen === 'function') return !!window.isPhoneScreen();
            return !!(window.matchMedia && window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse)').matches);
        }
    }

    // =====================================================================
    // Création : depuis le panneau Jeux (createWidget) ou à la restauration
    // =====================================================================
    window.createJeuGeoFranceWidget = function (data) {
        var restored = !!data;
        var payload = data || null;
        window._jgfNextPendingData = payload;
        var w;
        try {
            w = restored ? createWidget(TYPE, '100px', '100px', false) : createWidget(TYPE);
        } finally {
            window._jgfNextPendingData = null;
        }
        if (w && !w._jgfInit) initGeoFranceGame(w, payload);
        return w;
    };

    function hookCreateWidget() {
        if (typeof window.createWidget !== 'function' || window.createWidget._jgfHooked) return;
        var orig = window.createWidget;
        var wrapped = function (type) {
            var w = orig.apply(this, arguments);
            if (type === TYPE && w && !w._jgfInit) initGeoFranceGame(w, window._jgfNextPendingData || null);
            return w;
        };
        for (var k in orig) if (Object.prototype.hasOwnProperty.call(orig, k)) wrapped[k] = orig[k];
        wrapped._jgfHooked = true;
        window.createWidget = wrapped;
    }
    hookCreateWidget();
    document.addEventListener('DOMContentLoaded', hookCreateWidget);
})();
