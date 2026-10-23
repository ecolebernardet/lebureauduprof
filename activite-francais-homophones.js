// =========================================================================
// ACTIVITÉ « LES HOMOPHONES » — Le Bureau du Prof
// Leçon (explications, test de remplacement, astuces) + entraînement
// collectif au tableau (phrases à trous, temps de réflexion, explications).
//
// Homophones : a/à/as · et/est/es/ai · ou/où · son/sont · on/ont · ce/se
//              mes/mais · c'est/s'est · peu/peux/peut · sa/ça · leur/leurs
// « as », « es » et « ai » peuvent être retirés (cases à décocher).
//
// Ouverture : createWidget('homophones')  →  createHomophonesWidget()
// Sauvegarde : w._homGetData()  /  createHomophonesWidget(données)
// =========================================================================

(function () {
    'use strict';

    const TYPE = 'homophones';

    function _isPhone() {
        if (typeof isMobileBoardMode === 'function') { try { return !!isMobileBoardMode(); } catch (e) {} }
        return !!(window.matchMedia && window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse)').matches);
    }

    // ── Boutons fenêtre (CSS partagé) ─────────────────────────────────────
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
    .wf-btns:hover .wf-btn-close::after { content:'×'; font-size:10px; }`;
        document.head.appendChild(ws);
    }

    // ── CSS (préfixe hm-) ─────────────────────────────────────────────────
    if (!document.getElementById('hm-style')) {
        const s = document.createElement('style');
        s.id = 'hm-style';
        s.textContent = `
.widget[data-type="homophones"] { min-width:unset; background:transparent !important; border:none !important; box-shadow:none !important; }
.hm-container {
    --encre:#2A1F4A; --or:#FFC933; --vert:#2FBF71; --rouge:#FF4F5E; --violet:#6C4FD8; --creme:#FFF8EC;
    position:relative; width:1000px; height:680px; min-width:480px; min-height:400px; box-sizing:border-box;
    display:flex; flex-direction:column; overflow:hidden; user-select:none;
    background:var(--creme); border-radius:22px; border:3px solid var(--encre);
    box-shadow:0 7px 0 #16102B, 0 14px 34px rgba(20,10,50,.3);
    font-family:'Nunito','Segoe UI',system-ui,sans-serif; color:var(--encre);
}
.hm-container.wf-fullboard { position:fixed !important; inset:0 !important; width:100% !important; height:100% !important;
    z-index:9999 !important; border-radius:0 !important; border:none !important; padding-left:60px !important; }
@media (max-width:768px), (max-height:500px) and (pointer:coarse) {
    .hm-container.wf-fullboard { left:40px !important; width:calc(100vw - 40px) !important; height:100dvh !important; min-width:0 !important; padding-left:0 !important; }
    .hm-tab-lbl { display:none; }
    .hm-lesson { flex-direction:column; }
    .hm-side { flex-direction:row !important; flex-wrap:wrap; width:auto !important; max-height:none !important; }
}
.hm-header { display:flex; align-items:center; gap:10px; padding:10px 14px 8px; background:var(--encre); cursor:move; flex-shrink:0; flex-wrap:wrap; }
.hm-title { font-size:22px; font-weight:900; color:var(--or); text-shadow:0 2px 0 #B3470F; white-space:nowrap; pointer-events:none; letter-spacing:.3px; }
.hm-tabs { display:flex; gap:6px; margin-left:12px; }
.hm-tab { border:2px solid rgba(255,255,255,.25); background:transparent; color:#fff; border-radius:999px; padding:5px 14px;
    font:inherit; font-weight:900; font-size:14px; cursor:pointer; touch-action:manipulation; display:flex; gap:6px; align-items:center; }
.hm-tab:hover { background:rgba(255,255,255,.1); }
.hm-tab.active { background:var(--or); border-color:var(--or); color:var(--encre); }
.hm-icon-btn { width:26px; height:26px; border-radius:50%; border:none; cursor:pointer; padding:0; background:rgba(255,255,255,.14);
    color:#fff; font-size:13px; font-weight:900; display:flex; align-items:center; justify-content:center; }
.hm-icon-btn:hover { background:rgba(255,255,255,.28); }
.hm-body { flex:1; min-height:0; overflow:auto; position:relative; }
/* ── Leçon ── */
.hm-lesson { display:flex; gap:14px; padding:14px; min-height:100%; box-sizing:border-box; }
.hm-side { width:170px; flex-shrink:0; display:flex; flex-direction:column; gap:6px; }
.hm-gbtn { border:2px solid #e3d8c3; background:#fff; border-radius:12px; padding:8px 10px; font:inherit; font-weight:900; font-size:15px;
    color:var(--encre); cursor:pointer; text-align:left; touch-action:manipulation; transition:transform .1s, border-color .15s; }
.hm-gbtn:hover { border-color:var(--violet); transform:translateX(2px); }
.hm-gbtn.active { background:var(--violet); border-color:var(--violet); color:#fff; box-shadow:0 3px 0 #4a34a3; }
.hm-main { flex:1; min-width:0; display:flex; flex-direction:column; gap:12px; }
.hm-ltitle { display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
.hm-ltitle h2 { margin:0; font-size:34px; font-weight:900; }
.hm-toggle { display:inline-flex; align-items:center; gap:6px; border:2px solid #d9cdb6; background:#fff; border-radius:999px; padding:4px 12px 4px 6px;
    font:inherit; font-weight:800; font-size:13px; cursor:pointer; color:var(--encre); touch-action:manipulation; }
.hm-toggle .box { width:18px; height:18px; border-radius:5px; border:2px solid #9a8f7a; display:flex; align-items:center; justify-content:center; font-size:12px; }
.hm-toggle.on { border-color:var(--vert); } .hm-toggle.on .box { background:var(--vert); border-color:var(--vert); color:#fff; }
.hm-cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:12px; }
.hm-card { background:#fff; border-radius:16px; border:3px solid; padding:10px 12px 12px; display:flex; flex-direction:column; gap:6px; box-shadow:0 4px 0 rgba(0,0,0,.06); }
.hm-word { font-size:44px; font-weight:900; line-height:1; text-align:center; font-family:'Andika','Nunito',sans-serif; }
.hm-nature { font-size:13.5px; line-height:1.4; text-align:center; color:#5a5470; min-height:38px; }
.hm-trick { font-size:14px; line-height:1.4; background:#f6f2ff; border-radius:10px; padding:6px 8px; }
.hm-ex { font-size:14px; line-height:1.45; border-top:2px dashed #eee6d6; padding-top:6px; font-family:'Andika','Nunito',sans-serif; }
.hm-ex u { text-decoration-thickness:3px; text-underline-offset:3px; font-weight:800; }
.hm-ex i { color:#1f8a52; font-weight:800; font-style:normal; }
.hm-ex s { color:#d12f3d; font-weight:800; }
.hm-box { border-radius:14px; padding:10px 14px; font-size:15px; line-height:1.5; }
.hm-box b.t { display:block; font-size:15px; margin-bottom:2px; }
.hm-memo { background:#fff6d6; border:2px solid #f3d36b; }
.hm-trap { background:#ffecee; border:2px solid #f6a7b0; }
.hm-magic { background:#e9f8f0; border:2px solid #8fd8b0; }
.hm-btn { border:none; border-radius:14px; padding:10px 18px; font:inherit; font-weight:900; font-size:16px; cursor:pointer;
    touch-action:manipulation; background:var(--violet); color:#fff; box-shadow:0 4px 0 #4a34a3; transition:transform .08s; }
.hm-btn:active { transform:translateY(3px); box-shadow:0 1px 0 #4a34a3; }
.hm-btn.go { background:var(--vert); box-shadow:0 4px 0 #1e8a50; }
.hm-btn.alt { background:#fff; color:var(--encre); border:2px solid #d9cdb6; box-shadow:0 4px 0 #e3d8c3; }
.hm-btn.small { font-size:13px; padding:6px 12px; border-radius:11px; }
.hm-btn[disabled] { opacity:.45; cursor:default; }
/* ── Entraînement ── */
.hm-train { padding:12px 16px 16px; display:flex; flex-direction:column; gap:12px; align-items:center; }
.hm-settings { width:100%; box-sizing:border-box; background:#fff; border:2px solid #e3d8c3; border-radius:16px; padding:10px 12px; display:flex; flex-direction:column; gap:8px; }
.hm-srow { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
.hm-srow > .l { font-weight:900; font-size:13px; margin-right:4px; min-width:120px; }
.hm-chip { border:2px solid #d9cdb6; background:#fff; border-radius:999px; padding:4px 11px; font:inherit; font-weight:800; font-size:13.5px;
    cursor:pointer; color:var(--encre); touch-action:manipulation; }
.hm-chip.on { background:var(--encre); border-color:var(--encre); color:var(--or); }
.hm-topbar { width:100%; display:flex; align-items:center; gap:10px; flex-wrap:wrap; justify-content:center; }
.hm-pill { background:var(--encre); color:#fff; border-radius:999px; padding:4px 12px; font-weight:900; font-size:14px; white-space:nowrap; }
.hm-dots { display:flex; gap:4px; flex-wrap:wrap; }
.hm-dot { width:13px; height:13px; border-radius:50%; background:#e3d8c3; }
.hm-dot.good { background:var(--vert); } .hm-dot.meh { background:#FFB020; } .hm-dot.ko { background:var(--rouge); }
.hm-dot.cur { background:var(--violet); box-shadow:0 0 0 3px #cfc3f7; }
.hm-tag { font-weight:900; font-size:13px; color:var(--violet); background:#efeaff; border-radius:999px; padding:3px 12px; }
.hm-sentence { width:100%; box-sizing:border-box; background:#fff; border:3px solid var(--encre); border-radius:20px; padding:22px 20px;
    text-align:center; line-height:1.6; font-family:'Andika','Nunito',sans-serif; font-weight:700; box-shadow:0 5px 0 rgba(42,31,74,.15); }
.hm-gap { display:inline-block; min-width:2.6em; border-bottom:5px solid var(--violet); background:#f2eeff; border-radius:8px 8px 0 0;
    padding:0 .2em; color:var(--violet); font-weight:900; line-height:1.25; vertical-align:baseline; }
.hm-gap.ok { background:#e2f7ec; border-color:var(--vert); color:#178a4b; animation:hm-pop .35s ease; }
.hm-gap.bad { background:#ffe6e8; border-color:var(--rouge); color:var(--rouge); text-decoration:line-through; }
.hm-gap.rev { background:#fff3d1; border-color:#e0a500; color:#a46f00; }
@keyframes hm-pop { 0% { transform:scale(.8); } 60% { transform:scale(1.15); } 100% { transform:scale(1); } }
.hm-answers { display:flex; gap:14px; justify-content:center; flex-wrap:wrap; }
.hm-ans { min-width:120px; border:none; border-radius:18px; padding:12px 22px; font-family:'Andika','Nunito',sans-serif; font-weight:900;
    font-size:34px; cursor:pointer; color:var(--encre); touch-action:manipulation; box-shadow:0 6px 0 rgba(0,0,0,.18); transition:transform .08s; }
.hm-ans:active { transform:translateY(4px); box-shadow:0 2px 0 rgba(0,0,0,.18); }
.hm-ans.wrong { opacity:.4; text-decoration:line-through; }
.hm-ans.right { outline:5px solid var(--vert); }
.hm-ans[disabled] { cursor:default; }
.hm-count { display:flex; align-items:center; gap:12px; font-size:22px; font-weight:900; color:var(--violet); }
.hm-count .n { width:58px; height:58px; border-radius:50%; background:var(--violet); color:#fff; display:flex; align-items:center; justify-content:center; font-size:30px; animation:hm-tick 1s ease infinite; }
@keyframes hm-tick { 0% { transform:scale(1); } 15% { transform:scale(1.15); } 100% { transform:scale(1); } }
.hm-feedback { width:100%; box-sizing:border-box; border-radius:16px; padding:10px 16px; font-size:16px; line-height:1.55; }
.hm-feedback.ok { background:#e2f7ec; border:2px solid #8fd8b0; }
.hm-feedback.ko { background:#ffe9eb; border:2px solid #f6a7b0; }
.hm-feedback.info { background:#fff6d6; border:2px solid #f3d36b; }
.hm-feedback .test { font-family:'Andika','Nunito',sans-serif; background:rgba(255,255,255,.7); border-radius:8px; padding:1px 6px; }
.hm-feedback .test b { color:var(--violet); }
.hm-actions { display:flex; gap:10px; flex-wrap:wrap; justify-content:center; }
.hm-end { text-align:center; display:flex; flex-direction:column; gap:10px; align-items:center; }
.hm-end .stars { font-size:56px; letter-spacing:6px; }
.hm-review { width:100%; max-width:760px; text-align:left; background:#fff; border:2px solid #e3d8c3; border-radius:14px; padding:8px 14px; font-size:15px; line-height:1.6; font-family:'Andika','Nunito',sans-serif; }
.hm-review b { color:#178a4b; }
.hm-confetti { position:absolute; top:-10px; width:9px; height:14px; border-radius:2px; pointer-events:none; z-index:30; animation:hm-fall 1.6s ease-in forwards; }
@keyframes hm-fall { 0% { transform:translateY(0) rotate(0); opacity:1; } 100% { transform:translateY(560px) rotate(540deg); opacity:0; } }
.hm-help { display:none; position:absolute; top:50px; right:12px; z-index:40; width:380px; max-width:calc(100% - 24px); background:#fff; color:#3d3654;
    border:2px solid var(--encre); border-radius:14px; box-shadow:0 10px 26px rgba(0,0,0,.25); padding:12px 14px; font-size:13px; line-height:1.55; }
.hm-help.show { display:block; }
.hm-help h4 { margin:0 0 6px; font-size:15px; }
.hm-help p { margin:0 0 6px; }
.hm-resize { position:absolute; right:0; bottom:0; width:18px; height:18px; cursor:se-resize; z-index:35; opacity:0; transition:opacity .2s;
    background:linear-gradient(135deg,transparent 50%,#9a8f7a 50%); border-radius:0 0 18px 0; }
.hm-container:hover .hm-resize { opacity:1; }
.hm-container.wf-fullboard .hm-resize { display:none; }
/* Curseur : la flèche partout, la main sur la barre du haut (déplacement) */
.widget[data-type="homophones"], .hm-container, .hm-container * { cursor:default !important; }
.hm-container .hm-header { cursor:grab !important; }
.hm-container .hm-header:active { cursor:grabbing !important; }
/* Le doigt qui clique sur tout ce qui est cliquable */
.hm-container button, .hm-container [data-act],
.hm-container .hm-header button { cursor:pointer !important; }
.hm-container button:disabled, .hm-container button[disabled] { cursor:default !important; }
.hm-container input, .hm-container textarea { cursor:text !important; }
.hm-container .hm-resize { cursor:se-resize !important; }
`;
        document.head.appendChild(s);
    }

    // =====================================================================
    // DONNÉES : LEÇONS
    // Chaque mot : couleur, nature, astuce, exemple. opt = mot désactivable.
    // =====================================================================
    const COLORS = ['#3BA7FF', '#FF7A45', '#2FBF71', '#B05CE6'];
    const GROUPS = [
        {
            id: 'a', label: 'a / à / as',
            words: [
                { w: 'a', nature: 'Verbe <b>avoir</b> conjugué avec il, elle, on (ou un nom).', trick: '🪄 Je peux le remplacer par <b>avait</b>.', ex: 'Léa <u>a</u> un vélo.<br>→ Léa <i>avait</i> un vélo. ✅' },
                { w: 'à', nature: 'Petit mot invariable (préposition) : il indique un lieu, un moment, un moyen…', trick: '🪄 Impossible de le remplacer par <b>avait</b>.', ex: 'Je vais <u>à</u> la piscine.<br>→ Je vais <s>avait</s> la piscine. ❌' },
                { w: 'as', opt: 'as', nature: 'Verbe <b>avoir</b> conjugué avec <b>tu</b>.', trick: '🪄 Il suit toujours <b>tu</b> : je peux dire <b>avais</b>.', ex: 'Tu <u>as</u> un chat.<br>→ Tu <i>avais</i> un chat. ✅' }
            ],
            memo: 'L\'accent de <b>à</b> ressemble à une petite flèche qui montre une direction : à la plage, à Paris, à midi !',
            trap: 'Dans « il y a », c\'est le verbe avoir : il y <b>avait</b> → donc <b>a</b>, sans accent.',
            subs: { a: 'avait', as: 'avais' },
            why: { as: 'Le sujet est <b>tu</b> : tu <b>as</b> (avec un s).', 'à': '<b>à</b> est une préposition : il introduit un lieu, un moment ou une manière.' },
            items: [
                ['Léa _ un joli vélo rouge.', 'a'], ['Mon frère _ perdu sa casquette.', 'a'], ['Le chien _ très faim ce soir.', 'a'],
                ['Papa _ réparé la vieille voiture.', 'a'], ['Cette tarte _ un goût de fraise.', 'a'], ['Il y _ du soleil aujourd\'hui.', 'a'],
                ['Nous allons _ la piscine demain.', 'à'], ['Il habite _ Paris depuis trois ans.', 'à'], ['Je donne une pomme _ la maîtresse.', 'à'],
                ['Tu joues _ cache-cache avec nous ?', 'à'], ['Le train part _ huit heures.', 'à'], ['J\'ai mal _ la tête.', 'à'],
                ['Tu _ un très beau dessin.', 'as'], ['Est-ce que tu _ fini tes devoirs ?', 'as'], ['Tu _ oublié ton écharpe.', 'as'], ['Combien de billes _-tu ?', 'as']
            ]
        },
        {
            id: 'et', label: 'et / est / es / ai',
            words: [
                { w: 'et', nature: 'Mot de liaison (conjonction) : il <b>relie</b> deux mots ou deux idées.', trick: '🪄 Je peux le remplacer par <b>et puis</b>.', ex: 'Tom <u>et</u> Léa jouent.<br>→ Tom <i>et puis</i> Léa jouent. ✅' },
                { w: 'est', nature: 'Verbe <b>être</b> conjugué avec il, elle, on (ou un nom).', trick: '🪄 Je peux le remplacer par <b>était</b>.', ex: 'Le ciel <u>est</u> bleu.<br>→ Le ciel <i>était</i> bleu. ✅' },
                { w: 'es', opt: 'es', nature: 'Verbe <b>être</b> conjugué avec <b>tu</b>.', trick: '🪄 Il suit <b>tu</b> : je peux dire <b>étais</b>.', ex: 'Tu <u>es</u> gentil.<br>→ Tu <i>étais</i> gentil. ✅' },
                { w: 'ai', opt: 'ai', nature: 'Verbe <b>avoir</b> conjugué avec <b>je</b> (j\'ai).', trick: '🪄 Il suit <b>j\'</b> : je peux dire <b>avais</b>.', ex: 'J\'<u>ai</u> faim.<br>→ J\'<i>avais</i> faim. ✅' }
            ],
            memo: 'Récite le verbe être : je suis, tu <b>es</b>, il <b>est</b>… Le petit <b>et</b>, lui, ne change jamais : il sert juste à ajouter quelque chose.',
            trap: '<b>et</b> ne prend jamais de s ni de t. Tu <b>es</b> (avec s), il <b>est</b> (avec s et t), j\'<b>ai</b> (verbe avoir !).',
            subs: { est: 'était', es: 'étais', ai: 'avais', et: 'et puis' },
            why: { es: 'Le sujet est <b>tu</b> : tu <b>es</b>.', ai: 'Le sujet est <b>je</b> (j\') : j\'<b>ai</b>, verbe avoir.', est: 'C\'est le verbe <b>être</b> au présent.' },
            items: [
                ['Le ciel _ tout bleu aujourd\'hui.', 'est'], ['Mon chat _ caché sous le lit.', 'est'], ['La soupe _ trop chaude.', 'est'],
                ['Ce livre _ passionnant.', 'est'], ['Le magasin _ fermé le dimanche.', 'est'],
                ['J\'aime les pommes _ les poires.', 'et'], ['Tom _ Lina jouent au ballon.', 'et'], ['Il prend son sac _ il part à l\'école.', 'et'],
                ['Elle chante _ elle danse.', 'et'], ['Du pain _ du fromage, s\'il te plaît !', 'et'],
                ['Tu _ très gentil avec ton frère.', 'es'], ['Où _-tu caché ?', 'es'], ['Tu _ en retard ce matin !', 'es'], ['Tu _ le meilleur gardien de but.', 'es'],
                ['J\'_ un chat noir.', 'ai'], ['Ce matin, j\'_ mangé des céréales.', 'ai'], ['J\'_ très froid aux mains.', 'ai'], ['Hier, j\'_ perdu mon stylo.', 'ai']
            ]
        },
        {
            id: 'ou', label: 'ou / où',
            words: [
                { w: 'ou', nature: 'Mot de liaison : il propose un <b>choix</b>.', trick: '🪄 Je peux le remplacer par <b>ou bien</b>.', ex: 'Pomme <u>ou</u> poire ?<br>→ Pomme <i>ou bien</i> poire ? ✅' },
                { w: 'où', nature: 'Il indique un <b>lieu</b> ou un <b>moment</b> (il répond à la question « où ? »).', trick: '🪄 Impossible de dire <b>ou bien</b>.', ex: 'La ville <u>où</u> je vis.<br>→ La ville <s>ou bien</s> je vis. ❌' }
            ],
            memo: 'L\'accent de <b>où</b> est comme une punaise plantée sur une carte 📍 : il montre un endroit.',
            trap: 'Une question qui demande un lieu s\'écrit avec <b>où</b> : Où vas-tu ? Sais-tu où il est ?',
            subs: { ou: 'ou bien' },
            why: { 'où': '<b>où</b> indique ici un lieu ou un moment.' },
            items: [
                ['Tu veux du jus _ du lait ?', 'ou'], ['Rouge _ bleu, choisis ta couleur !', 'ou'], ['On part lundi _ mardi ?', 'ou'],
                ['Tu dessines _ tu lis ?', 'ou'], ['Je prendrai le bus _ le vélo.', 'ou'], ['Veux-tu une glace à la vanille _ au chocolat ?', 'ou'],
                ['Dis-moi _ tu habites.', 'où'], ['Je connais la ville _ tu es né.', 'où'], ['C\'est le jour _ il a neigé.', 'où'],
                ['Voici la maison _ j\'ai grandi.', 'où'], ['Sais-tu _ est la gare ?', 'où'], ['Le parc _ nous jouons est très grand.', 'où']
            ]
        },
        {
            id: 'son', label: 'son / sont',
            words: [
                { w: 'son', nature: 'Déterminant possessif : « le sien » (à lui, à elle). Il est suivi d\'un nom.', trick: '🪄 Je peux le remplacer par <b>mon</b>.', ex: 'Il prend <u>son</u> sac.<br>→ Il prend <i>mon</i> sac. ✅' },
                { w: 'sont', nature: 'Verbe <b>être</b> conjugué avec ils, elles (ou un nom pluriel).', trick: '🪄 Je peux le remplacer par <b>étaient</b>.', ex: 'Ils <u>sont</u> partis.<br>→ Ils <i>étaient</i> partis. ✅' }
            ],
            memo: '<b>sont</b> se termine par un <b>t</b>, comme « étaien<b>t</b> » : les deux vont ensemble !',
            trap: '<b>son</b> est toujours suivi d\'un nom (son chien, son vélo). <b>sont</b> a un sujet au pluriel.',
            subs: { son: 'mon', sont: 'étaient' }, why: {},
            items: [
                ['Les fleurs _ très jolies.', 'sont'], ['Mes amis _ en vacances.', 'sont'], ['Les gâteaux _ dans le four.', 'sont'],
                ['Les rues _ pleines de neige.', 'sont'], ['Ces bonbons _ délicieux.', 'sont'], ['Où _ mes lunettes ?', 'sont'],
                ['Lucas a oublié _ cartable.', 'son'], ['Elle promène _ chien au parc.', 'son'], ['Le bébé serre _ doudou.', 'son'],
                ['Julie range _ bureau.', 'son'], ['Le pirate cache _ trésor.', 'son'], ['Mon voisin lave _ vélo.', 'son']
            ]
        },
        {
            id: 'on', label: 'on / ont',
            words: [
                { w: 'on', nature: 'Pronom personnel sujet : quelqu\'un, nous, les gens. Il est suivi d\'un verbe.', trick: '🪄 Je peux le remplacer par <b>il</b>.', ex: '<u>On</u> joue dehors.<br>→ <i>Il</i> joue dehors. ✅' },
                { w: 'ont', nature: 'Verbe <b>avoir</b> conjugué avec ils, elles (ou un nom pluriel).', trick: '🪄 Je peux le remplacer par <b>avaient</b>.', ex: 'Ils <u>ont</u> faim.<br>→ Ils <i>avaient</i> faim. ✅' }
            ],
            memo: 'Comme pour sont / étaient : <b>ont</b> et « avaien<b>t</b> » finissent tous les deux par un <b>t</b>.',
            trap: '<b>on</b> est le sujet : un verbe le suit (on mange). Devant <b>ont</b>, il y a souvent un sujet au pluriel (les enfants ont).',
            subs: { on: 'il', ont: 'avaient' }, why: {},
            items: [
                ['Les enfants _ construit une cabane.', 'ont'], ['Mes cousins _ une grande maison.', 'ont'], ['Les oiseaux _ fait leur nid.', 'ont'],
                ['Mes parents _ acheté un chiot.', 'ont'], ['Les élèves _ fini leurs exercices.', 'ont'], ['Les chats _ peur de l\'aspirateur.', 'ont'],
                ['Ce soir, _ va au cinéma.', 'on'], ['Quand il pleut, _ reste à la maison.', 'on'], ['À la récré, _ joue à chat.', 'on'],
                ['Demain, _ partira en vacances.', 'on'], ['Chez nous, _ mange à midi.', 'on'], ['Ici, _ parle français.', 'on']
            ]
        },
        {
            id: 'ce', label: 'ce / se',
            words: [
                { w: 'ce', nature: 'Déterminant démonstratif devant un <b>nom</b> (ce chat), ou pronom (ce que, ce qui).', trick: '🪄 Devant un nom, je peux dire <b>ce … -là</b>.', ex: '<u>Ce</u> chat est noir.<br>→ Ce chat<i>-là</i> est noir. ✅' },
                { w: 'se', nature: 'Pronom placé devant un <b>verbe</b> (se laver, se cacher, se lever…).', trick: '🪄 Je peux conjuguer avec <b>je me</b>.', ex: 'Il <u>se</u> lave.<br>→ Je <i>me</i> lave. ✅' }
            ],
            memo: '<b>se</b> comme <b>s</b>oi-même : « il se lave » = il lave lui-même.',
            trap: 'Regarde le mot qui suit : un <b>nom</b> → ce ; un <b>verbe</b> → se.',
            subs: {},
            why: { ce: '<b>ce</b> est devant un nom (on peut dire « ce … -là ») ou fait partie de « ce que / ce qui ».', se: '<b>se</b> est devant un verbe : on peut dire « je <b>me</b> … » (il se lave → je me lave).' },
            items: [
                ['Le chat _ lave les pattes.', 'se'], ['Les enfants _ cachent derrière l\'arbre.', 'se'], ['Elle _ brosse les dents.', 'se'],
                ['Mon frère _ lève tôt.', 'se'], ['Le soleil _ couche derrière la montagne.', 'se'], ['Ils _ disputent souvent.', 'se'],
                ['J\'aime beaucoup _ film.', 'ce'], ['Qui a pris _ crayon ?', 'ce'], ['Il fait froid _ matin.', 'ce'],
                ['Tu connais _ garçon ?', 'ce'], ['Regarde _ grand bateau !', 'ce'], ['Je ne sais pas _ qu\'il veut.', 'ce']
            ]
        },
        {
            id: 'mes', label: 'mes / mais',
            words: [
                { w: 'mes', nature: 'Déterminant possessif pluriel : « les miens ». Il est suivi d\'un nom au pluriel.', trick: '🪄 Je peux le remplacer par <b>tes</b>.', ex: 'J\'ai perdu <u>mes</u> clés.<br>→ J\'ai perdu <i>tes</i> clés. ✅' },
                { w: 'mais', nature: 'Mot de liaison qui marque une <b>opposition</b>.', trick: '🪄 Je peux le remplacer par <b>pourtant</b>.', ex: 'Il pleut, <u>mais</u> je sors.<br>→ Il pleut, <i>pourtant</i> je sors. ✅' }
            ],
            memo: '<b>mes</b>, <b>tes</b>, <b>ses</b> : la même famille, toujours devant un nom. <b>mais</b> arrive souvent juste après une virgule.',
            trap: 'Si tu peux dire « pourtant », c\'est <b>mais</b>.',
            subs: { mes: 'tes', mais: 'pourtant' }, why: {},
            items: [
                ['J\'ai perdu _ clés.', 'mes'], ['Je range _ livres.', 'mes'], ['Où sont _ chaussettes ?', 'mes'],
                ['J\'invite _ cousins.', 'mes'], ['Je lave _ mains avant de manger.', 'mes'], ['Je prête _ feutres à Paul.', 'mes'],
                ['Il pleut, _ je sors quand même.', 'mais'], ['Il est petit _ très rapide.', 'mais'], ['Je voulais venir, _ j\'étais malade.', 'mais'],
                ['C\'est bon, _ c\'est trop sucré.', 'mais'], ['Le chemin est long, _ il est joli.', 'mais'], ['J\'ai couru, _ j\'ai raté le bus.', 'mais']
            ]
        },
        {
            id: 'cest', label: 'c\'est / s\'est',
            words: [
                { w: 'c\'est', nature: '<b>c\'</b> (= cela) + verbe <b>être</b>.', trick: '🪄 Je peux le remplacer par <b>cela est</b>.', ex: '<u>C\'est</u> beau.<br>→ <i>Cela est</i> beau. ✅' },
                { w: 's\'est', nature: '<b>s\'</b> (= se) + verbe <b>être</b> : verbe pronominal au passé composé.', trick: '🪄 Je peux conjuguer avec <b>je me suis</b>.', ex: 'Il <u>s\'est</u> coupé.<br>→ Je <i>me suis</i> coupé. ✅' }
            ],
            memo: '<b>s\'est</b> est toujours suivi d\'un participe passé : coupé, caché, endormi, trompé…',
            trap: 'Si on peut dire « cela », c\'est <b>c\'</b> : c\'est = cela est.',
            subs: { 'c\'est': 'cela est' },
            why: { 's\'est': '<b>s\'est</b> est suivi d\'un participe passé (verbe pronominal) : on peut dire « je <b>me suis</b> … ».' },
            items: [
                ['Mon frère _ coupé le doigt.', 's\'est'], ['Le chien _ caché sous la table.', 's\'est'], ['Julie _ endormie très tard.', 's\'est'],
                ['Pierre _ trompé de route.', 's\'est'], ['Le vase _ cassé en tombant.', 's\'est'], ['La chatte _ couchée au soleil.', 's\'est'],
                ['Regarde, _ mon meilleur ami !', 'c\'est'], ['Dépêche-toi, _ l\'heure !', 'c\'est'], ['Je crois que _ fini.', 'c\'est'],
                ['Tu sais, _ très facile !', 'c\'est'], ['Demain, _ mon anniversaire.', 'c\'est'], ['Ce gâteau, _ moi qui l\'ai fait.', 'c\'est']
            ]
        },
        {
            id: 'peu', label: 'peu / peux / peut',
            words: [
                { w: 'peu', nature: 'Adverbe de quantité : le <b>contraire de beaucoup</b>. Il ne change jamais.', trick: '🪄 Je peux dire le contraire : <b>beaucoup</b>.', ex: 'J\'ai <u>peu</u> de temps.<br>→ J\'ai <i>beaucoup</i> de temps. ✅ (contraire)' },
                { w: 'peux', nature: 'Verbe <b>pouvoir</b> conjugué avec <b>je</b> ou <b>tu</b>.', trick: '🪄 Je peux dire <b>pouvais</b>.', ex: 'Tu <u>peux</u> venir.<br>→ Tu <i>pouvais</i> venir. ✅' },
                { w: 'peut', nature: 'Verbe <b>pouvoir</b> conjugué avec il, elle, on (ou un nom).', trick: '🪄 Je peux dire <b>pouvait</b>.', ex: 'Elle <u>peut</u> courir.<br>→ Elle <i>pouvait</i> courir. ✅' }
            ],
            memo: 'Comme beaucoup de verbes : avec je, tu → <b>x</b> (je peux, je veux) ; avec il, elle → <b>t</b> (il peut, il veut).',
            trap: '« Je peut » n\'existe pas : avec je, c\'est toujours <b>peux</b>.',
            subs: { peux: 'pouvais', peut: 'pouvait' },
            why: { peu: '<b>peu</b> veut dire « pas beaucoup » : ce n\'est pas le verbe pouvoir.', peux: 'Le sujet est <b>je</b> ou <b>tu</b> : <b>peux</b> avec un x.', peut: 'Le sujet est <b>il, elle, on</b> (ou un nom) : <b>peut</b> avec un t.' },
            items: [
                ['Il _ venir avec nous.', 'peut'], ['Elle _ nager très longtemps.', 'peut'], ['On _ partir maintenant.', 'peut'], ['Le chat _ sauter très haut.', 'peut'],
                ['Je _ t\'aider si tu veux.', 'peux'], ['Est-ce que tu _ fermer la porte ?', 'peux'], ['Tu _ jouer dehors.', 'peux'], ['Je ne _ pas venir ce soir.', 'peux'],
                ['J\'ai un _ froid.', 'peu'], ['Il reste _ de gâteau.', 'peu'], ['Mon chat mange très _.', 'peu'], ['Attends un _, j\'arrive !', 'peu']
            ]
        },
        {
            id: 'sa', label: 'sa / ça',
            words: [
                { w: 'sa', nature: 'Déterminant possessif : « la sienne ». Il est suivi d\'un nom.', trick: '🪄 Je peux le remplacer par <b>ma</b>.', ex: 'Elle prend <u>sa</u> veste.<br>→ Elle prend <i>ma</i> veste. ✅' },
                { w: 'ça', nature: 'Pronom démonstratif : c\'est la forme courte de <b>cela</b>.', trick: '🪄 Je peux le remplacer par <b>cela</b>.', ex: '<u>Ça</u> me plaît.<br>→ <i>Cela</i> me plaît. ✅' }
            ],
            memo: '<b>sa</b> accompagne un nom (sa trousse). <b>ça</b> est tout seul : il remplace une chose, comme « cela ».',
            trap: 'N\'oublie pas la cédille : sans elle, <b>ça</b> se lirait « ka » !',
            subs: { sa: 'ma', 'ça': 'cela' }, why: {},
            items: [
                ['Léo cherche _ trousse.', 'sa'], ['Elle a cassé _ montre.', 'sa'], ['Mon oncle lave _ voiture.', 'sa'],
                ['Le lapin mange _ carotte.', 'sa'], ['Emma fête _ victoire.', 'sa'], ['Le roi porte _ couronne.', 'sa'],
                ['Franchement, _ ne me plaît pas.', 'ça'], ['Tu as vu _ ?', 'ça'], ['Comment _ va ?', 'ça'],
                ['Arrête de faire _ !', 'ça'], ['J\'adore _ !', 'ça'], ['Donne-moi _, s\'il te plaît.', 'ça']
            ]
        },
        {
            id: 'leur', label: 'leur / leurs',
            words: [
                { w: 'leur', nature: 'Devant un <b>verbe</b> : pronom qui veut dire « à eux, à elles » (jamais de s).<br>Devant un <b>nom singulier</b> : déterminant (leur chien).', trick: '🪄 Devant un verbe, je peux dire <b>lui</b>.', ex: 'Je <u>leur</u> parle.<br>→ Je <i>lui</i> parle. ✅' },
                { w: 'leurs', nature: 'Déterminant devant un <b>nom au pluriel</b>.', trick: '🪄 Je regarde le nom qui suit : s\'il est au pluriel, <b>leurs</b> prend un s.', ex: 'Ils rangent <u>leurs</u> jouets.<br>→ <i>des</i> jouets : pluriel ✅' }
            ],
            memo: 'Devant un verbe, <b>leur</b> = <b>lui</b> au pluriel : il ne prend JAMAIS de s.',
            trap: 'Ils promènent leur chien (<b>un</b> chien) mais ils promènent leurs chiens (<b>des</b> chiens).',
            subs: {}, why: {},
            items: [
                ['Les enfants rangent _ jouets.', 'leurs', 'Le nom « jouets » est au pluriel (des jouets) : <b>leurs</b> avec un s.'],
                ['Les oiseaux nourrissent _ petits.', 'leurs', 'Le nom « petits » est au pluriel : <b>leurs</b> avec un s.'],
                ['Elles ont mis _ bottes.', 'leurs', 'Le nom « bottes » est au pluriel (des bottes) : <b>leurs</b> avec un s.'],
                ['Mes voisins promènent _ chiens.', 'leurs', 'Le nom « chiens » est au pluriel : <b>leurs</b> avec un s.'],
                ['Je _ donne un bonbon.', 'leur', 'Devant le verbe « donne », on peut dire « je <b>lui</b> donne » : <b>leur</b> sans s.'],
                ['La maîtresse _ explique la leçon.', 'leur', 'Devant le verbe « explique », on peut dire « elle <b>lui</b> explique » : <b>leur</b> sans s.'],
                ['Nous _ avons écrit une lettre.', 'leur', 'Devant le verbe « avons écrit », on peut dire « nous <b>lui</b> avons écrit » : <b>leur</b> sans s.'],
                ['Ils promènent _ chien.', 'leur', 'Le nom « chien » est au singulier (un chien) : <b>leur</b> sans s.'],
                ['Mes voisins ont vendu _ maison.', 'leur', 'Le nom « maison » est au singulier (une maison) : <b>leur</b> sans s.'],
                ['Les élèves saluent _ maîtresse.', 'leur', 'Le nom « maîtresse » est au singulier : <b>leur</b> sans s.']
            ]
        }
    ];
    const G = {}; GROUPS.forEach(g => { G[g.id] = g; });

    // ── Utilitaires ───────────────────────────────────────────────────────
    const pick = a => a[Math.floor(Math.random() * a.length)];
    function shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
    function esc(t) { return String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
    const wordColor = (g, w) => COLORS[Math.max(0, g.words.findIndex(x => x.w === w)) % COLORS.length];

    // Sons courts (Web Audio, sans fichier)
    let _ctx = null;
    function tone(f, st, d, type, vol) {
        try {
            if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
            const t0 = _ctx.currentTime + st, o = _ctx.createOscillator(), g = _ctx.createGain();
            o.type = type || 'triangle'; o.frequency.setValueAtTime(f, t0);
            g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol || 0.1, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
            o.connect(g); g.connect(_ctx.destination); o.start(t0); o.stop(t0 + d + 0.05);
        } catch (e) {}
    }
    const SFX = {
        good: () => { tone(1046, 0, 0.12); tone(1568, 0.09, 0.22); },
        bad:  () => { tone(220, 0, 0.18, 'square', 0.05); tone(170, 0.16, 0.25, 'square', 0.05); },
        tick: () => tone(880, 0, 0.06, 'sine', 0.05),
        go:   () => { tone(660, 0, 0.1); tone(990, 0.1, 0.18); },
        win:  () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12 * i, 0.22))
    };

    function defaultState() {
        return {
            tab: 'lecon', lesson: 'a',
            sel: GROUPS.map(g => g.id),
            opt: { as: true, es: true, ai: true },
            n: 10, think: 0, font: 34, sound: true, settingsOpen: true,
            run: null
        };
    }

    // =====================================================================
    // CRÉATION DU WIDGET
    // =====================================================================
    window.createHomophonesWidget = function (saved) {
        const restored = !!saved;
        if (!restored && typeof snapshotNow === 'function') snapshotNow();
        const pos = (typeof findFreePosition === 'function') ? findFreePosition() : { x: 100, y: 80 };

        const widget = document.createElement('div');
        widget.className = 'widget';
        widget.dataset.type = TYPE;
        widget.dataset.transparent = 'true';
        widget.style.cssText = `left:${pos.x}px; top:${pos.y}px; overflow:visible; flex-direction:row;`;
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
            <div class="widget-ctx-menu"></div>`;

        const container = document.createElement('div');
        container.className = 'hm-container';
        container.innerHTML = `
            <div class="hm-header">
                <span class="hm-title">📝 Les homophones</span>
                <div class="hm-tabs">
                    <button class="hm-tab" data-act="tab" data-tab="lecon"><span>📖</span><span class="hm-tab-lbl">Leçon</span></button>
                    <button class="hm-tab" data-act="tab" data-tab="train"><span>✏️</span><span class="hm-tab-lbl">Entraînement collectif</span></button>
                </div>
                <div class="wf-btns" style="margin-left:auto">
                    <button class="hm-icon-btn" data-act="sound" title="Son"></button>
                    <button class="hm-icon-btn" data-act="help" title="Aide">?</button>
                    <button class="wf-btn wf-btn-min"   data-act="min"   title="Réduire"></button>
                    <button class="wf-btn wf-btn-max"   data-act="max"   title="Plein écran"></button>
                    <button class="wf-btn wf-btn-close" data-act="close" title="Fermer"></button>
                </div>
            </div>
            <div class="hm-body"></div>
            <div class="hm-help">
                <h4>💡 Comment utiliser cette activité ?</h4>
                <p><b>📖 Leçon</b> — Choisis un homophone à gauche. Chaque mot a sa carte : ce qu'il est, le <b>test de remplacement</b> 🪄 et un exemple. En bas : un moyen de s'en souvenir et le piège à éviter.</p>
                <p><b>✏️ Entraînement collectif</b> — Une phrase à trous s'affiche en grand. La classe réfléchit (temps réglable), puis on clique sur la réponse proposée par les élèves. Chaque réponse est expliquée avec le test de remplacement.</p>
                <p><b>Réglages</b> — Choisis les homophones travaillés, retire « as », « es » ou « ai » s'ils ne sont pas encore étudiés, le nombre de phrases, le temps de réflexion et la taille du texte.</p>
                <p>« 👁 Révéler » montre la réponse sans la compter comme réussie (pratique avec les ardoises).</p>
            </div>
            <div class="hm-resize" title="Redimensionner"></div>`;
        widget.appendChild(container);

        const body = container.querySelector('.hm-body');
        const help = container.querySelector('.hm-help');
        const resizeHandle = container.querySelector('.hm-resize');

        // ── État ──
        const S = defaultState();
        if (saved && saved.state) {
            Object.keys(S).forEach(k => {
                if (saved.state[k] === undefined) return;
                if (S[k] && typeof S[k] === 'object' && !Array.isArray(S[k])) S[k] = Object.assign(S[k], saved.state[k]);
                else S[k] = saved.state[k];
            });
        }
        let countdown = 0, cdTimer = null;
        const save = () => { if (typeof saveBoard === 'function') saveBoard(); };
        const sfx = k => { if (S.sound && SFX[k]) SFX[k](); };

        // Mots proposés pour un groupe (selon les cases « as », « es », « ai »)
        const wordsOf = g => g.words.filter(w => !w.opt || S.opt[w.opt]);
        const allowed = (g, ans) => wordsOf(g).some(w => w.w === ans);

        // ── Construction d'une série ──
        function buildRun() {
            const pools = S.sel.filter(id => G[id]).map(id => shuffle(G[id].items.map((it, i) => [id, i]).filter(([gid, i]) => allowed(G[gid], G[gid].items[i][1]))))
                .filter(p => p.length);
            const queue = [];
            // Tirage équilibré : un groupe après l'autre, dans un ordre mélangé
            let k = 0, order = shuffle(pools.map((_, i) => i));
            while (queue.length < S.n && pools.some(p => p.length)) {
                const p = pools[order[k % order.length]]; k++;
                if (p.length) queue.push(p.pop());
                if (k % order.length === 0) order = shuffle(order);
            }
            S.run = { queue: shuffle(queue), idx: 0, res: [], tries: 0, wrong: [], answered: false, revealed: false, hint: false, done: false };
            startCountdown();
        }

        function startCountdown() {
            clearInterval(cdTimer);
            countdown = (S.run && !S.run.done && !S.run.answered) ? S.think : 0;
            if (countdown > 0) {
                cdTimer = setInterval(() => {
                    if (!widget.isConnected) { clearInterval(cdTimer); return; }
                    countdown--;
                    if (countdown <= 0) { clearInterval(cdTimer); sfx('go'); render(); }
                    else { sfx('tick'); const n = body.querySelector('.hm-count .n'); if (n) n.textContent = countdown; }
                }, 1000);
            }
        }

        // ── Phrase avec un mot à la place du trou ──
        function fill(text, word, cls) {
            const [b, a] = text.split('_');
            return `${esc(b)}<span class="hm-gap ${cls || ''}">${word ? esc(word) : '&nbsp;'}</span>${esc(a)}`;
        }
        function withSub(text, sub) {
            const [b, a] = text.split('_');
            return `« ${esc(b)}<b>${esc(sub)}</b>${esc(a)} »`;
        }
        // Explication de la bonne réponse : test de remplacement + règle
        function explainAnswer(g, item) {
            const [text, ans, custom] = item;
            const words = wordsOf(g).map(w => w.w);
            let out = '';
            if (g.subs[ans]) out += `🪄 Test : <span class="test">${withSub(text, g.subs[ans])}</span> ✅ ça marche, donc <b>${esc(ans)}</b>. `;
            else {
                const other = words.find(w => w !== ans && g.subs[w]);
                if (other) out += `🪄 Test : <span class="test">${withSub(text, g.subs[other])}</span> ❌ ça ne marche pas, donc ce n'est pas « ${esc(other)} ». `;
            }
            const why = custom || g.why[ans];
            if (why) out += why;
            return out;
        }
        function explainWrong(g, item, w) {
            const sub = g.subs[w];
            return sub ? `🪄 Essaie : <span class="test">${withSub(item[0], sub)}</span> ❌ ça ne marche pas !` : (g.why[w] ? `Rappel : ${g.why[w]}` : '');
        }

        // =================================================================
        // RENDU : LEÇON
        // =================================================================
        function toggleBtn(k, label) {
            return `<button class="hm-toggle ${S.opt[k] ? 'on' : ''}" data-act="opt" data-k="${k}"><span class="box">${S.opt[k] ? '✓' : ''}</span>${label}</button>`;
        }
        function renderLesson() {
            const g = G[S.lesson] || GROUPS[0];
            const side = GROUPS.map(x => `<button class="hm-gbtn ${x.id === g.id ? 'active' : ''}" data-act="lesson" data-g="${x.id}">${esc(x.label)}</button>`).join('');
            const words = wordsOf(g);
            let toggles = '';
            if (g.id === 'a') toggles = toggleBtn('as', 'étudier aussi « as »');
            if (g.id === 'et') toggles = toggleBtn('es', 'étudier « es »') + toggleBtn('ai', 'étudier « ai »');
            const cards = words.map(w => {
                const c = wordColor(g, w.w);
                return `<div class="hm-card" style="border-color:${c}">
                    <div class="hm-word" style="color:${c}">${esc(w.w)}</div>
                    <div class="hm-nature">${w.nature}</div>
                    <div class="hm-trick">${w.trick}</div>
                    <div class="hm-ex">${w.ex}</div></div>`;
            }).join('');
            return `<div class="hm-lesson">
                <div class="hm-side">${side}</div>
                <div class="hm-main">
                    <div class="hm-ltitle"><h2>${words.map(w => `<span style="color:${wordColor(g, w.w)}">${esc(w.w)}</span>`).join(' <span style="color:#c9bfa9">/</span> ')}</h2>${toggles}</div>
                    <div class="hm-box hm-magic"><b class="t">🪄 Le test magique</b>Ces mots se prononcent pareil mais ne s'écrivent pas pareil. Pour choisir, je <b>remplace</b> le mot dans la phrase : si la phrase veut encore dire quelque chose, j'ai trouvé !</div>
                    <div class="hm-cards">${cards}</div>
                    <div class="hm-box hm-memo"><b class="t">🧠 Pour retenir</b>${g.memo}</div>
                    <div class="hm-box hm-trap"><b class="t">⚠️ Attention au piège</b>${g.trap}</div>
                    <div><button class="hm-btn go" data-act="practice" data-g="${g.id}">✏️ S'entraîner sur « ${esc(words.map(w => w.w).join(' / '))} »</button></div>
                </div></div>`;
        }

        // =================================================================
        // RENDU : ENTRAÎNEMENT
        // =================================================================
        function renderSettings() {
            if (!S.settingsOpen) return `<div style="width:100%;display:flex;justify-content:flex-end"><button class="hm-btn alt small" data-act="settings">⚙ Réglages</button></div>`;
            const chips = GROUPS.map(g => `<button class="hm-chip ${S.sel.includes(g.id) ? 'on' : ''}" data-act="sel" data-g="${g.id}">${esc(g.label)}</button>`).join('');
            const ch = (act, v, cur, lbl) => `<button class="hm-chip ${cur === v ? 'on' : ''}" data-act="${act}" data-v="${v}">${lbl}</button>`;
            return `<div class="hm-settings">
                <div class="hm-srow"><span class="l">Homophones</span>${chips}
                    <button class="hm-btn alt small" data-act="selall">Tout</button><button class="hm-btn alt small" data-act="selnone">Rien</button></div>
                <div class="hm-srow"><span class="l">Mots proposés</span>${toggleBtn('as', '« as »')}${toggleBtn('es', '« es »')}${toggleBtn('ai', '« ai »')}</div>
                <div class="hm-srow"><span class="l">Phrases par série</span>${[5, 10, 15, 20].map(v => ch('n', v, S.n, v)).join('')}
                    <span class="l" style="margin-left:14px;min-width:0">Temps de réflexion</span>${[0, 5, 10, 15].map(v => ch('think', v, S.think, v ? v + ' s' : 'aucun')).join('')}</div>
                <div class="hm-srow"><span class="l">Taille du texte</span><button class="hm-btn alt small" data-act="font" data-d="-4">A−</button><button class="hm-btn alt small" data-act="font" data-d="4">A+</button>
                    <span style="flex:1"></span><button class="hm-btn alt small" data-act="settings">Masquer les réglages</button>
                    <button class="hm-btn go small" data-act="start">▶ Lancer une nouvelle série</button></div>
            </div>`;
        }
        function renderTrain() {
            if (!S.run) buildRun();
            const R = S.run;
            let html = `<div class="hm-train">${renderSettings()}`;
            if (!R.queue.length) return html + `<div class="hm-feedback info">Choisis au moins un homophone dans les réglages, puis lance une série.</div></div>`;
            if (R.done) {
                const good = R.res.filter(r => r === 'good').length, N = R.queue.length;
                const st = good >= N * 0.9 ? 3 : good >= N * 0.65 ? 2 : good >= N * 0.4 ? 1 : 0;
                const missed = R.queue.map((q, i) => ({ q, r: R.res[i] })).filter(x => x.r !== 'good');
                const review = missed.length ? `<div class="hm-review"><b style="color:var(--encre)">À revoir ensemble :</b><br>${missed.map(x => { const it = G[x.q[0]].items[x.q[1]]; return '• ' + fill(it[0], it[1], 'ok'); }).join('<br>')}</div>` : '';
                return html + `<div class="hm-end">
                    <div style="font-size:30px;font-weight:900">${st === 3 ? '🏆 Classe championne !' : st === 2 ? '🎉 Très belle série !' : st === 1 ? '👍 Bon travail !' : '💪 On continue à s\'entraîner !'}</div>
                    <div class="stars">${'⭐'.repeat(st)}${'☆'.repeat(3 - st)}</div>
                    <div style="font-size:20px;font-weight:800">${good} phrase${good > 1 ? 's' : ''} sur ${N} réussie${good > 1 ? 's' : ''} du premier coup</div>
                    <div class="hm-dots">${R.res.map(r => `<span class="hm-dot ${r}"></span>`).join('')}</div>
                    ${review}
                    <button class="hm-btn go" data-act="start">🔄 Nouvelle série</button></div></div>`;
            }
            const [gid, ii] = R.queue[R.idx], g = G[gid], item = g.items[ii], ans = item[1];
            const words = wordsOf(g).map(w => w.w);
            const dots = R.queue.map((_, i) => `<span class="hm-dot ${i < R.res.length ? R.res[i] : (i === R.idx ? 'cur' : '')}"></span>`).join('');
            const good = R.res.filter(r => r === 'good').length;
            let gap;
            if (R.answered) gap = fill(item[0], ans, R.revealed ? 'rev' : 'ok');
            else if (R.wrong.length) gap = fill(item[0], R.wrong[R.wrong.length - 1], 'bad');
            else gap = fill(item[0], '', '');
            const locked = countdown > 0 && !R.answered;
            const btns = words.map(w => {
                const c = wordColor(g, w), isWrong = R.wrong.includes(w), isRight = R.answered && w === ans;
                return `<button class="hm-ans ${isWrong ? 'wrong' : ''} ${isRight ? 'right' : ''}" style="background:${c}22;border:3px solid ${c}" data-act="ans" data-w="${esc(w)}" ${R.answered || isWrong || locked ? 'disabled' : ''}>${esc(w)}</button>`;
            }).join('');
            let fb = '';
            if (R.answered) {
                fb = R.revealed
                    ? `<div class="hm-feedback info">👁 La réponse est <b>${esc(ans)}</b>. ${explainAnswer(g, item)}</div>`
                    : `<div class="hm-feedback ok">${R.tries === 0 ? pick(['🎉 Bravo la classe !', '✅ Exactement !', '🌟 Parfait !', '👏 Bien joué !']) : '✅ Cette fois, c\'est la bonne !'} On écrit <b>${esc(ans)}</b>. ${explainAnswer(g, item)}</div>`;
            } else if (R.wrong.length) {
                const w = R.wrong[R.wrong.length - 1];
                fb = `<div class="hm-feedback ko">🙈 Non, ici ce n'est pas <b>${esc(w)}</b>. ${explainWrong(g, item, w)} Réessayez !</div>`;
            } else if (R.hint) {
                fb = `<div class="hm-feedback info">💡 ${wordsOf(g).map(w => `<b>${esc(w.w)}</b> : ${w.trick.replace('🪄 ', '')}`).join('<br>')}</div>`;
            }
            const count = locked ? `<div class="hm-count">🤔 Réfléchissez… <span class="n">${countdown}</span></div>` : '';
            const isLast = R.idx >= R.queue.length - 1;
            return html + `
                <div class="hm-topbar"><span class="hm-pill">Phrase ${R.idx + 1} / ${R.queue.length}</span><div class="hm-dots">${dots}</div>
                    <span class="hm-pill">⭐ ${good}</span><span class="hm-tag">${esc(g.label)}</span></div>
                <div class="hm-sentence" style="font-size:${S.font}px">${gap}</div>
                ${count}
                <div class="hm-answers">${btns}</div>
                ${fb}
                <div class="hm-actions">
                    ${R.answered ? `<button class="hm-btn go" data-act="next">${isLast ? '🏁 Voir le bilan' : 'Phrase suivante ➜'}</button>`
                                 : `<button class="hm-btn alt" data-act="hint" ${R.hint ? 'disabled' : ''}>💡 Astuce</button><button class="hm-btn alt" data-act="reveal">👁 Révéler</button>`}
                </div></div>`;
        }

        function render() {
            container.querySelectorAll('.hm-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === S.tab));
            const sb = container.querySelector('[data-act="sound"]');
            sb.textContent = S.sound ? '🔊' : '🔇'; sb.title = S.sound ? 'Couper le son' : 'Activer le son';
            const top = body.scrollTop;
            body.innerHTML = S.tab === 'train' ? renderTrain() : renderLesson();
            body.scrollTop = top;
        }

        function party() {
            if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            const cols = ['#FF4F5E', '#FFC933', '#2FBF71', '#3BA7FF', '#9B6BFF', '#FF7AC6'];
            for (let i = 0; i < 30; i++) {
                const c = document.createElement('i');
                c.className = 'hm-confetti';
                c.style.left = (Math.random() * 100) + '%';
                c.style.background = pick(cols);
                c.style.animationDelay = (Math.random() * 0.4) + 's';
                container.appendChild(c);
                setTimeout(() => c.remove(), 2200);
            }
        }

        // ── Actions ──
        function act(a, el) {
            const R = S.run;
            switch (a) {
                case 'help': help.classList.toggle('show'); return;
                case 'sound': S.sound = !S.sound; break;
                case 'min':
                    container.classList.remove('wf-fullboard');
                    if (typeof window._wfMiniBarCollapse === 'function') window._wfMiniBarCollapse(widget, '📝 Les homophones');
                    return;
                case 'max': container.classList.toggle('wf-fullboard'); save(); return;
                case 'close':
                    clearInterval(cdTimer);
                    if (typeof snapshotNow === 'function') snapshotNow();
                    widget.remove(); save(); return;
                case 'tab': S.tab = el.dataset.tab; body.scrollTop = 0; if (S.tab === 'train') startCountdown(); break;
                case 'lesson': S.lesson = el.dataset.g; body.scrollTop = 0; break;
                case 'opt': S.opt[el.dataset.k] = !S.opt[el.dataset.k]; buildRun(); break;
                case 'practice': S.sel = [el.dataset.g]; S.tab = 'train'; S.settingsOpen = false; body.scrollTop = 0; buildRun(); break;
                case 'settings': S.settingsOpen = !S.settingsOpen; break;
                case 'sel': {
                    const id = el.dataset.g, i = S.sel.indexOf(id);
                    if (i === -1) S.sel.push(id); else S.sel.splice(i, 1);
                    buildRun(); break;
                }
                case 'selall': S.sel = GROUPS.map(g => g.id); buildRun(); break;
                case 'selnone': S.sel = []; buildRun(); break;
                case 'n': S.n = +el.dataset.v; buildRun(); break;
                case 'think': S.think = +el.dataset.v; startCountdown(); break;
                case 'font': S.font = Math.max(20, Math.min(64, S.font + (+el.dataset.d))); break;
                case 'start': buildRun(); S.settingsOpen = false; body.scrollTop = 0; break;
                case 'hint': if (R) R.hint = true; break;
                case 'reveal':
                    if (!R || R.answered) return;
                    R.answered = true; R.revealed = true; R.res[R.idx] = 'ko'; clearInterval(cdTimer); countdown = 0;
                    break;
                case 'ans': {
                    if (!R || R.answered || countdown > 0) return;
                    const w = el.dataset.w, [gid, ii] = R.queue[R.idx], ans = G[gid].items[ii][1];
                    if (w === ans) {
                        R.answered = true;
                        R.res[R.idx] = R.tries === 0 ? 'good' : 'meh';
                        render(); save(); sfx('good'); if (R.tries === 0) party();
                        return;
                    }
                    R.tries++; if (!R.wrong.includes(w)) R.wrong.push(w);
                    sfx('bad');
                    break;
                }
                case 'next':
                    if (!R) return;
                    if (R.idx >= R.queue.length - 1) { R.done = true; render(); save(); sfx('win'); party(); return; }
                    R.idx++; R.tries = 0; R.wrong = []; R.answered = false; R.revealed = false; R.hint = false;
                    body.scrollTop = 0; startCountdown();
                    break;
                default: return;
            }
            render(); save();
        }

        // ── Événements : souris, stylet et tactile (dédoublonnés) ──
        let lastTap = 0;
        function onTap(e) {
            const el = e.target.closest && e.target.closest('[data-act]');
            if (!el || !container.contains(el) || el.disabled) return;
            if (e.type === 'pointerup' && e.button > 0) return;
            e.stopPropagation(); e.preventDefault();
            const now = Date.now();
            if (now - lastTap < 300) return;
            lastTap = now;
            act(el.dataset.act, el);
        }
        container.addEventListener('pointerup', onTap);
        container.addEventListener('click', onTap);
        function onDown(e) {
            if (typeof bringToFront === 'function') bringToFront(widget);
            // Seule la barre de titre (hors boutons) sert à déplacer le widget
            if (e.target.closest('.hm-header') && !e.target.closest('button')) {
                widget.focus({ preventScroll: true });
                if (typeof positionActionBar === 'function') positionActionBar(widget);
                return;
            }
            e.stopPropagation();
        }
        container.addEventListener('pointerdown', onDown);
        container.addEventListener('mousedown', onDown);
        container.addEventListener('touchstart', e => { if (!(e.target.closest('.hm-header') && !e.target.closest('button'))) e.stopPropagation(); }, { passive: true });
        document.addEventListener('pointerdown', function closeHelp(e) {
            if (!widget.isConnected) { document.removeEventListener('pointerdown', closeHelp, true); return; }
            if (help.classList.contains('show') && !help.contains(e.target) && !e.target.closest('[data-act="help"]')) help.classList.remove('show');
        }, true);

        // ── Redimensionnement ──
        resizeHandle.addEventListener('pointerdown', e => {
            e.stopPropagation(); e.preventDefault();
            resizeHandle.setPointerCapture(e.pointerId);
            const sx = e.clientX, sy = e.clientY, sw = container.offsetWidth, sh = container.offsetHeight;
            const mv = ev => {
                container.style.width = Math.max(480, sw + ev.clientX - sx) + 'px';
                container.style.height = Math.max(400, sh + ev.clientY - sy) + 'px';
            };
            const up = () => { resizeHandle.removeEventListener('pointermove', mv); resizeHandle.removeEventListener('pointerup', up); save(); };
            resizeHandle.addEventListener('pointermove', mv);
            resizeHandle.addEventListener('pointerup', up);
        });

        // ── Sauvegarde (taille hors plein écran mémorisée) ──
        const vh = () => typeof virtualH === 'function' ? virtualH(window.innerWidth) : window.innerHeight;
        let savedW = 0, savedH = 0;
        function memoSize() {
            if (container.classList.contains('wf-fullboard')) return;
            savedW = (container.offsetWidth / window.innerWidth) * 100;
            savedH = (container.offsetHeight / vh()) * 100;
        }
        new MutationObserver(memoSize).observe(container, { attributes: true, attributeFilter: ['style', 'class'] });
        widget._homGetData = function () {
            memoSize();
            return { state: JSON.parse(JSON.stringify(S)), wPct: savedW, hPct: savedH, fullboard: container.classList.contains('wf-fullboard') };
        };

        // ── Mise en place ──
        const board = document.getElementById('board') || document.body;
        board.appendChild(widget);
        if (typeof clampWidgetToBoardRight === 'function' && !restored) clampWidgetToBoardRight(widget);
        if (typeof bringToFront === 'function') bringToFront(widget);
        if (typeof makeDraggable === 'function') makeDraggable(widget);
        if (typeof makeDraggableRotate === 'function') makeDraggableRotate(widget);

        if (restored && saved.wPct > 0) container.style.width = (saved.wPct / 100) * window.innerWidth + 'px';
        if (restored && saved.hPct > 0) container.style.height = (saved.hPct / 100) * vh() + 'px';
        render();
        if (S.tab === 'train') startCountdown();

        requestAnimationFrame(() => requestAnimationFrame(() => {
            memoSize();
            if (restored) {
                if (saved.fullboard) container.classList.add('wf-fullboard');
            } else if (_isPhone()) {
                container.classList.add('wf-fullboard');
            } else {
                widget.style.left = '100px';
                widget.dataset.leftPercent = (100 / window.innerWidth) * 100;
            }
            save();
        }));
        return widget;
    };

    // =====================================================================
    // HOOK dans createWidget
    // =====================================================================
    function install(orig) {
        window.createWidget = function (type) {
            if (type === TYPE) return window.createHomophonesWidget();
            return orig.apply(this, arguments);
        };
    }
    if (typeof window.createWidget === 'function') install(window.createWidget);
    else document.addEventListener('DOMContentLoaded', () => { if (typeof window.createWidget === 'function') install(window.createWidget); });

})();
