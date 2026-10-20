// =========================================================================
// ACTIVITÉ « COMPRENDRE LES FRACTIONS » — Le Bureau du Prof
// Fichier autonome : injecte son CSS et son <template>, puis initialise
// les widgets de type 'fractions2'.
//
// Public : fin de cycle 3 (CM1 – CM2). Six onglets :
//   🍕 Découvrir        numérateur, dénominateur, lecture d'une fraction
//   ⚖️ Parts égales     une fraction n'existe qu'avec des parts ÉGALES
//   🦘 Droite graduée   placer une fraction, fractions plus grandes que 1
//   🟰 Fractions égales  multiplier en haut ET en bas par le même nombre
//   🆚 Comparer         même dénominateur, même numérateur, cas général
//   🏆 Défi             10 questions variées, score et étoiles
//
// 📌 Intégration :
//   index.html  : <script src="activites-maths-fractions2.js"></script>
//                 + carte createWidget('fractions2') dans le panneau Activités
//   save-load.js : frac2Data (w._fr2GetData / window._fr2NextPendingData)
// =========================================================================

(function () {
    'use strict';

    const TYPE = 'fractions2';
    const C_NUM = '#3b7ddd';     // couleur du numérateur
    const C_DEN = '#e06c4a';     // couleur du dénominateur
    const C_FILL = '#f2994a';    // parts coloriées (figures neutres)
    const C_A = '#3b7ddd', C_B = '#9b59b6';

    // ── Boutons ronds (communs aux widgets) ───────────────────────────────
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

    // ── CSS ───────────────────────────────────────────────────────────────
    if (!document.getElementById('fr2-style')) {
        const s = document.createElement('style');
        s.id = 'fr2-style';
        s.textContent = `
@font-face { font-family:'MarelleBaton'; src:url('polices/MarelleBaton-Regular.ttf') format('truetype'); }
.widget[data-type="fractions2"] { min-width:unset; background:transparent !important; border:none !important; box-shadow:none !important; }
.fr2-container {
    position:relative; width:960px; height:660px; min-width:420px; min-height:360px;
    background:#fffdf8; border:1.5px solid #e8dcc8; border-radius:18px;
    box-shadow:0 6px 22px rgba(0,0,0,.14); box-sizing:border-box;
    display:flex; flex-direction:column; overflow:hidden; user-select:none;
    font-family:'Nunito','Segoe UI',system-ui,sans-serif; color:#2d3748;
}
.fr2-container.fr2-fullboard { position:fixed !important; inset:0 !important; width:100% !important; height:100% !important;
    z-index:9999 !important; border-radius:0 !important; padding-left:60px !important; }
@media (max-width:768px), (max-height:500px) and (pointer:coarse) {
    .fr2-container.fr2-fullboard { left:40px !important; width:calc(100vw - 40px) !important; height:100dvh !important; min-width:0 !important; padding-left:0 !important; }
    .fr2-tab .fr2-tab-lbl { display:none; }
}
.fr2-header { display:flex; align-items:center; gap:10px; padding:10px 14px 6px; cursor:move; flex-shrink:0; }
.fr2-title { font-size:15px; font-weight:900; color:#7a4b1e; white-space:nowrap; pointer-events:none; }
.fr2-title small { font-weight:700; color:#b08a62; font-size:11px; margin-left:6px; }
.fr2-help-btn { width:22px; height:22px; border-radius:50%; border:1px solid #d6c4a8; background:#fff7ea; color:#7a4b1e;
    font-weight:900; font-size:12px; cursor:pointer; display:flex; align-items:center; justify-content:center; padding:0; }
.fr2-tabs { display:flex; gap:6px; padding:0 12px 8px; flex-shrink:0; overflow-x:auto; scrollbar-width:thin; }
.fr2-tab { flex:1 1 0; min-width:44px; display:flex; align-items:center; justify-content:center; gap:6px;
    padding:7px 8px; border-radius:12px; border:2px solid #eadfcd; background:#fff; cursor:pointer;
    font-size:13px; font-weight:800; color:#7b6a55; white-space:nowrap; touch-action:manipulation; transition:all .15s; }
.fr2-tab:hover { border-color:#f2b56b; }
.fr2-tab.active { background:linear-gradient(180deg,#ffb35c,#f2994a); border-color:#e07f2a; color:#fff; box-shadow:0 3px 8px rgba(242,153,74,.35); }
.fr2-tab-ico { font-size:17px; }
.fr2-body { flex:1; min-height:0; overflow:auto; padding:4px 16px 14px; position:relative; }
.fr2-cols { display:flex; gap:18px; flex-wrap:wrap; align-items:flex-start; }
.fr2-left { flex:1 1 360px; min-width:280px; display:flex; flex-direction:column; align-items:center; gap:8px; }
.fr2-right { flex:1 1 340px; min-width:260px; display:flex; flex-direction:column; gap:10px; }
.fr2-full { width:100%; display:flex; flex-direction:column; gap:10px; align-items:center; }
.fr2-svg { width:100%; height:auto; display:block; overflow:visible; }
.fr2-visual { width:100%; max-width:340px; }
.fr2-visual.wide { max-width:860px; }
.fr2-click { cursor:pointer; transition:opacity .12s; }
.fr2-click:hover { opacity:.82; }
.fr2-hint { font-size:12px; color:#9a8770; font-style:italic; text-align:center; }
.fr2-seg { display:inline-flex; background:#f4ebdd; border-radius:12px; padding:3px; gap:3px; flex-wrap:wrap; justify-content:center; }
.fr2-seg button { border:none; background:transparent; padding:6px 12px; border-radius:9px; font-weight:800; font-size:13px;
    color:#7b6a55; cursor:pointer; touch-action:manipulation; }
.fr2-seg button.on { background:#fff; color:#d35400; box-shadow:0 1px 4px rgba(0,0,0,.12); }
/* Fraction écrite */
.fr2-f { display:inline-flex; flex-direction:column; align-items:center; vertical-align:middle; line-height:1.05;
    font-family:'MarelleBaton','Nunito',sans-serif; font-weight:700; margin:0 3px; font-size:1.15em; }
.fr2-fn { color:${C_NUM}; } .fr2-fd { color:${C_DEN}; }
.fr2-fb { align-self:stretch; min-width:.9em; height:2px; background:#2d3748; border-radius:1px; margin:1px 0; }
.fr2-f.plain .fr2-fn, .fr2-f.plain .fr2-fd { color:inherit; }
/* Grande fraction avec steppers */
.fr2-big { display:grid; grid-template-columns:auto 1fr; column-gap:14px; row-gap:4px; align-items:center;
    background:#fff; border:2px solid #f0e3cf; border-radius:16px; padding:12px 14px; }
.fr2-stp { display:flex; align-items:center; gap:6px; justify-self:center; }
.fr2-stp button, .fr2-mini button { width:34px; height:34px; border-radius:10px; border:2px solid #e2d5c2; background:#fff;
    font-size:20px; font-weight:900; color:#5a4a36; cursor:pointer; display:flex; align-items:center; justify-content:center;
    padding:0; line-height:1; touch-action:manipulation; transition:transform .08s, background .12s; }
.fr2-stp button:hover, .fr2-mini button:hover { background:#fff3e2; }
.fr2-stp button:active, .fr2-mini button:active { transform:scale(.9); }
.fr2-bignum { min-width:52px; text-align:center; font-size:44px; line-height:1; font-family:'MarelleBaton','Nunito',sans-serif; }
.fr2-bignum.n { color:${C_NUM}; } .fr2-bignum.d { color:${C_DEN}; }
.fr2-bigbar { height:4px; background:#2d3748; border-radius:2px; justify-self:stretch; margin:0 38px; }
.fr2-lbl { font-size:13px; line-height:1.35; color:#4a5568; }
.fr2-lbl b.n { color:${C_NUM}; } .fr2-lbl b.d { color:${C_DEN}; }
.fr2-reading { text-align:center; font-size:22px; font-weight:900; color:#7a4b1e; background:#fff3df; border-radius:14px; padding:8px 10px; }
.fr2-explain { font-size:15px; line-height:1.55; background:#fff; border:2px dashed #eadbc4; border-radius:14px; padding:10px 14px; }
.fr2-explain b.n { color:${C_NUM}; } .fr2-explain b.d { color:${C_DEN}; }
.fr2-retenir { font-size:13.5px; line-height:1.5; background:#eef6ff; border-left:5px solid #3b7ddd; border-radius:10px; padding:9px 12px; color:#244063; }
.fr2-retenir > b:first-child { display:block; margin-bottom:3px; font-size:14px; }
.fr2-retenir ul { margin:4px 0 0; padding-left:18px; }
.fr2-warn { background:#fff1f0; border-left-color:#e74c3c; color:#7b241c; }
/* Mascotte */
.fr2-mascot { display:flex; align-items:flex-end; gap:8px; margin-top:12px; }
.fr2-owl { font-size:40px; line-height:1; animation:fr2-bob 2.6s ease-in-out infinite; }
@keyframes fr2-bob { 0%,100% { transform:translateY(0) rotate(-3deg); } 50% { transform:translateY(-5px) rotate(3deg); } }
.fr2-bubble { position:relative; background:#fff8c9; border:2px solid #f1d96b; border-radius:14px; padding:8px 12px; font-size:13.5px; line-height:1.45; flex:1; }
.fr2-bubble::before { content:''; position:absolute; left:-10px; bottom:12px; border:8px solid transparent; border-right-color:#f1d96b; border-left:0; }
.fr2-bubble b.who { color:#9c6b00; }
.fr2-linkbtn { border:none; background:none; color:#b0700a; font-weight:800; cursor:pointer; font-size:12.5px; padding:0 0 0 4px; text-decoration:underline; }
/* Petits steppers */
.fr2-ctrls { display:flex; gap:12px; flex-wrap:wrap; justify-content:center; align-items:center; }
.fr2-mini { display:flex; align-items:center; gap:5px; background:#fff; border:2px solid #f0e3cf; border-radius:12px; padding:4px 8px; }
.fr2-mini span.l { font-size:12px; font-weight:800; color:#7b6a55; }
.fr2-mini span.v { min-width:26px; text-align:center; font-size:22px; font-family:'MarelleBaton','Nunito',sans-serif; }
.fr2-mini button { width:28px; height:28px; font-size:17px; border-radius:8px; }
.fr2-eq { font-size:26px; display:flex; align-items:center; justify-content:center; gap:8px; flex-wrap:wrap; font-weight:800; }
.fr2-eq .fr2-f { font-size:30px; }
.fr2-btn { border:none; border-radius:12px; padding:9px 16px; font-weight:900; font-size:15px; cursor:pointer; touch-action:manipulation;
    background:#f2994a; color:#fff; box-shadow:0 3px 0 #c97424; transition:transform .08s; }
.fr2-btn:active { transform:translateY(2px); box-shadow:0 1px 0 #c97424; }
.fr2-btn.alt { background:#fff; color:#7a4b1e; border:2px solid #eadbc4; box-shadow:0 3px 0 #e2d2b8; }
.fr2-btn.yes { background:#27ae60; box-shadow:0 3px 0 #1e8449; }
.fr2-btn.no  { background:#e74c3c; box-shadow:0 3px 0 #b03a2e; }
.fr2-btn[disabled] { opacity:.45; cursor:default; }
.fr2-score { font-weight:900; color:#7a4b1e; background:#fff3df; border-radius:20px; padding:4px 12px; font-size:13px; }
.fr2-feedback { font-size:15px; line-height:1.5; border-radius:14px; padding:10px 14px; width:100%; box-sizing:border-box; }
.fr2-feedback.ok { background:#e9f9ef; border:2px solid #7dd3a0; }
.fr2-feedback.ko { background:#fdecea; border:2px solid #f1a39a; }
.fr2-prompt { font-size:19px; font-weight:800; text-align:center; line-height:1.5; }
.fr2-prompt .fr2-f { font-size:28px; }
/* Comparer */
.fr2-cmp-row { display:flex; align-items:center; justify-content:center; gap:16px; flex-wrap:wrap; }
.fr2-cmp-box { display:flex; flex-direction:column; align-items:center; gap:4px; background:#fff; border:2px solid #f0e3cf; border-radius:14px; padding:8px 10px; }
.fr2-sign { font-size:46px; font-weight:900; min-width:60px; text-align:center; color:#2d3748; }
.fr2-sign.q { color:#c0a98a; }
.fr2-guess { display:flex; gap:8px; }
.fr2-guess .fr2-btn { font-size:24px; padding:4px 18px; }
/* Défi */
.fr2-dots { display:flex; gap:5px; justify-content:center; }
.fr2-dot { width:14px; height:14px; border-radius:50%; background:#eadfcd; }
.fr2-dot.ok { background:#27ae60; } .fr2-dot.ko { background:#e74c3c; } .fr2-dot.cur { background:#f2994a; box-shadow:0 0 0 3px #ffd9ad; }
.fr2-choices { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:10px; width:100%; max-width:720px; }
.fr2-choice { border:3px solid #eadbc4; background:#fff; border-radius:14px; padding:10px; min-height:62px; font-size:18px; font-weight:800;
    cursor:pointer; color:#2d3748; touch-action:manipulation; display:flex; align-items:center; justify-content:center; transition:transform .1s, border-color .15s; }
.fr2-choice:hover { border-color:#f2b56b; transform:translateY(-2px); }
.fr2-choice .fr2-f { font-size:28px; }
.fr2-choice.good { border-color:#27ae60; background:#e9f9ef; }
.fr2-choice.bad { border-color:#e74c3c; background:#fdecea; }
.fr2-choice[disabled] { cursor:default; transform:none; }
.fr2-streak { font-weight:900; color:#e67e22; }
.fr2-stars { font-size:54px; letter-spacing:6px; }
.fr2-confetti { position:absolute; pointer-events:none; font-size:24px; z-index:30; animation:fr2-pop 1.3s ease-out forwards; }
@keyframes fr2-pop { 0% { transform:translateY(0) scale(.4) rotate(0); opacity:0; } 15% { opacity:1; } 100% { transform:translateY(-170px) scale(1.2) rotate(200deg); opacity:0; } }
/* Aide */
.fr2-help { display:none; position:absolute; top:44px; right:12px; z-index:40; width:360px; max-width:calc(100% - 24px);
    background:#fff; border:1px solid #e2d5c2; border-radius:12px; box-shadow:0 8px 24px rgba(0,0,0,.18); padding:12px 14px;
    font-size:12.5px; line-height:1.55; color:#4a5568; }
.fr2-help.show { display:block; }
.fr2-help h4 { margin:0 0 6px; font-size:14px; color:#7a4b1e; }
.fr2-help p { margin:0 0 5px; }
.fr2-resize { position:absolute; right:0; bottom:0; width:18px; height:18px; cursor:se-resize; z-index:35;
    background:linear-gradient(135deg,transparent 50%,#c8b39a 50%); border-radius:0 0 16px 0; opacity:0; transition:opacity .2s; }
.fr2-container:hover .fr2-resize { opacity:1; }
.fr2-container.fr2-fullboard .fr2-resize { display:none; }
`;
        document.head.appendChild(s);
    }

    // ── Template ──────────────────────────────────────────────────────────
    if (!document.getElementById('template-' + TYPE)) {
        const tpl = document.createElement('template');
        tpl.id = 'template-' + TYPE;
        tpl.innerHTML = `
<div class="fr2-container">
  <div class="fr2-header">
    <span class="fr2-title">🍕 Comprendre les fractions <small>CM1 · CM2</small></span>
    <div class="wf-btns" style="margin-left:auto">
      <button class="fr2-help-btn" data-act="help" title="Aide">?</button>
      <button class="wf-btn wf-btn-min"   data-act="min"   title="Réduire"></button>
      <button class="wf-btn wf-btn-max"   data-act="max"   title="Plein écran"></button>
      <button class="wf-btn wf-btn-close" data-act="close" title="Fermer"></button>
    </div>
  </div>
  <div class="fr2-tabs"></div>
  <div class="fr2-body"></div>
  <div class="fr2-help">
    <h4>💡 Comment utiliser cette activité ?</h4>
    <p>Les onglets suivent une <b>progression</b> : on peut les faire dans l'ordre, une séance après l'autre.</p>
    <p><b>🍕 Découvrir</b> — Change le dénominateur (en combien de parts on partage) et le numérateur (combien on en prend). Clique sur les parts pour les prendre ou les reposer.</p>
    <p><b>⚖️ Parts égales</b> — La figure est-elle vraiment partagée en parts égales ? Réponds Oui ou Non.</p>
    <p><b>🦘 Droite graduée</b> — Le kangourou fait des bonds d'une fraction. Va au-delà de 1 pour découvrir les fractions plus grandes que 1.</p>
    <p><b>🟰 Fractions égales</b> — Coupe chaque part en 2, 3, 4… : la quantité ne change pas.</p>
    <p><b>🆚 Comparer</b> — Mode devinette : les élèves choisissent &lt;, = ou &gt; avant de voir la réponse.</p>
    <p><b>🏆 Défi</b> — 10 questions tirées au sort, avec des explications après chaque réponse.</p>
    <p>Bouton vert : plein écran. Bouton jaune : réduire.</p>
  </div>
  <div class="fr2-resize" title="Redimensionner"></div>
</div>`;
        document.body.appendChild(tpl);
    }

    // =====================================================================
    // OUTILS : nombres, noms, figures
    // =====================================================================
    const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    const pick = arr => arr[rnd(0, arr.length - 1)];
    const f2 = v => (+v).toFixed(2);
    function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; }
    function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a || 1; }
    function lcm(a, b) { return a / gcd(a, b) * b; }

    const UNITS = ['zéro','un','deux','trois','quatre','cinq','six','sept','huit','neuf','dix','onze','douze','treize','quatorze','quinze','seize','dix-sept','dix-huit','dix-neuf'];
    const TENS = { 2:'vingt', 3:'trente', 4:'quarante', 5:'cinquante', 6:'soixante' };
    function nw(n) {
        if (n < 20) return UNITS[n];
        if (n >= 100) return String(n);
        const t = Math.floor(n / 10), u = n % 10;
        if (t <= 6) return u === 0 ? TENS[t] : (u === 1 ? TENS[t] + ' et un' : TENS[t] + '-' + UNITS[u]);
        if (t === 7) return u === 1 ? 'soixante et onze' : 'soixante-' + UNITS[10 + u];
        if (t === 8) return u === 0 ? 'quatre-vingts' : 'quatre-vingt-' + UNITS[u];
        return 'quatre-vingt-' + UNITS[10 + u];
    }
    function ordinal(d) {
        let b = nw(d);
        if (b.endsWith('quatre-vingts')) b = b.slice(0, -1);
        if (b.endsWith('cinq')) return b + 'uième';
        if (b.endsWith('neuf')) return b.slice(0, -1) + 'vième';
        if (b.endsWith('e')) return b.slice(0, -1) + 'ième';
        return b + 'ième';
    }
    // Lecture d'une fraction : 3/8 → « trois huitièmes »
    function fracName(n, d) {
        const a = nw(n);
        if (d === 1) return n === 0 ? 'zéro' : (n === 1 ? 'une unité' : a + ' unités');
        if (d === 2) return n === 1 ? 'un demi' : a + ' demis';
        if (d === 3) return a + ' tiers';
        if (d === 4) return n === 1 ? 'un quart' : a + ' quarts';
        return a + ' ' + ordinal(d) + (n > 1 ? 's' : '');
    }
    // Fraction écrite en HTML
    function F(n, d, cls) {
        return `<span class="fr2-f ${cls || ''}"><span class="fr2-fn">${n}</span><span class="fr2-fb"></span><span class="fr2-fd">${d}</span></span>`;
    }

    // ── Pizza ─────────────────────────────────────────────────────────────
    const CHEESE = '#f7c04a', CRUST = '#d9893f', PALE = '#fbf4e6', PALE_CRUST = '#ece0c9';
    function pepperoni(x, y, r) {
        return `<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(r)}" fill="#c0392b"/><circle cx="${f2(x - r * .3)}" cy="${f2(y - r * .3)}" r="${f2(r * .28)}" fill="#e2604f"/>`;
    }
    function pizzaSVG(den, col, o) {
        o = o || {};
        const S = 260, C = 130, R = 104;
        const g0 = i => o.clickable ? `<g class="fr2-click" data-act="part" data-part="${i}">` : '<g>';
        let s = `<svg class="fr2-svg" viewBox="0 0 ${S} ${S}" xmlns="http://www.w3.org/2000/svg">`;
        s += `<circle cx="${C}" cy="${C}" r="${R + 15}" fill="#eef2f7" stroke="#cfd6e2" stroke-width="2"/>`;
        if (den <= 1) {
            const t = col.has(0);
            s += g0(0) + `<circle cx="${C}" cy="${C}" r="${R - 4}" fill="${t ? CHEESE : PALE}" stroke="${t ? CRUST : PALE_CRUST}" stroke-width="8"/>`;
            if (t) s += pepperoni(C, C - 45, 14) + pepperoni(C - 40, C + 22, 13) + pepperoni(C + 38, C + 26, 13) + pepperoni(C + 4, C + 2, 11);
            s += '</g>';
        } else {
            const step = 2 * Math.PI / den, large = step > Math.PI ? 1 : 0, rc = R - 4;
            for (let i = 0; i < den; i++) {
                const a0 = -Math.PI / 2 + i * step, a1 = a0 + step, am = a0 + step / 2, t = col.has(i);
                const off = (t && o.explode) ? 9 : 0;
                const cx = C + Math.cos(am) * off, cy = C + Math.sin(am) * off;
                const P = (r, a) => `${f2(cx + r * Math.cos(a))} ${f2(cy + r * Math.sin(a))}`;
                s += g0(i);
                s += `<path d="M${f2(cx)} ${f2(cy)} L${P(R, a0)} A${R} ${R} 0 ${large} 1 ${P(R, a1)} Z" fill="${t ? CHEESE : PALE}" stroke="${t ? '#b86a24' : '#d9cdb6'}" stroke-width="2" stroke-linejoin="round"/>`;
                s += `<path d="M${P(rc, a0)} A${rc} ${rc} 0 ${large} 1 ${P(rc, a1)}" fill="none" stroke="${t ? CRUST : PALE_CRUST}" stroke-width="8"/>`;
                if (t) {
                    const pr = Math.max(4, Math.min(14, 0.62 * R * Math.sin(Math.min(step, Math.PI) / 2) * 0.55));
                    s += pepperoni(cx + 0.6 * R * Math.cos(am), cy + 0.6 * R * Math.sin(am), pr);
                    if (step > 1) s += `<circle cx="${f2(cx + 0.3 * R * Math.cos(am + step * .18))}" cy="${f2(cy + 0.3 * R * Math.sin(am + step * .18))}" r="5" fill="#2e8b57"/>`;
                }
                s += '</g>';
            }
        }
        return s + '</svg>';
    }

    // ── Tablette de chocolat ──────────────────────────────────────────────
    function chocoSVG(den, col, o) {
        o = o || {};
        const rows = (den > 6 && den % 2 === 0) ? 2 : 1, cols = den / rows;
        const cw = Math.min(80, 440 / cols), ch = rows === 1 ? 100 : 80;
        const W = cols * cw + 24, H = rows * ch + 24;
        let s = `<svg class="fr2-svg" viewBox="0 0 ${f2(W)} ${H}" xmlns="http://www.w3.org/2000/svg">`;
        s += `<rect x="2" y="2" width="${f2(W - 4)}" height="${H - 4}" rx="12" fill="#f7f1ea" stroke="#c8b39a" stroke-width="2"/>`;
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
            const i = r * cols + c, t = col.has(i), x = 12 + c * cw, y = 12 + r * ch;
            s += o.clickable ? `<g class="fr2-click" data-act="part" data-part="${i}">` : '<g>';
            s += `<rect x="${f2(x + 2)}" y="${y + 2}" width="${f2(cw - 4)}" height="${ch - 4}" rx="7" fill="${t ? '#7b4a2d' : '#efe3d3'}" stroke="${t ? '#4f2b17' : '#cdb79a'}" stroke-width="2" ${t ? '' : 'stroke-dasharray="6 4"'}/>`;
            if (t) s += `<rect x="${f2(x + 9)}" y="${y + 9}" width="${f2(cw - 18)}" height="${ch - 18}" rx="5" fill="#8f5a39" stroke="#a8714c" stroke-width="2"/>`;
            s += '</g>';
        }
        return s + '</svg>';
    }

    // ── Barre partagée (parts égales ou non) ──────────────────────────────
    function barSVG(n, isCol, o) {
        o = o || {};
        const W = o.w || 420, H = o.h || 90, P = 4, BW = W - 2 * P;
        const w = o.weights || Array(n).fill(1), tot = w.reduce((a, b) => a + b, 0);
        let s = `<svg class="fr2-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`, x = P;
        for (let i = 0; i < n; i++) {
            const pw = BW * w[i] / tot;
            s += `<rect x="${f2(x)}" y="${P}" width="${f2(pw)}" height="${H - 2 * P}" fill="${isCol(i) ? (o.color || C_FILL) : '#fff'}" stroke="#374151" stroke-width="2"/>`;
            x += pw;
        }
        s += `<rect x="${P}" y="${P}" width="${BW}" height="${H - 2 * P}" fill="none" stroke="#1f2937" stroke-width="3" rx="2"/>`;
        return s + '</svg>';
    }

    // Fraction écrite dans un SVG
    function svgFrac(x, yc, n, d, size, color) {
        x = parseFloat(x);
        const lw = Math.max(String(n).length, String(d).length) * size * 0.55 + 6;
        return `<text x="${x}" y="${yc - 5}" text-anchor="middle" font-size="${size}" font-family="MarelleBaton,Nunito,sans-serif" font-weight="700" fill="${color || C_NUM}">${n}</text>`
             + `<line x1="${f2(x - lw / 2)}" y1="${yc}" x2="${f2(x + lw / 2)}" y2="${yc}" stroke="#2d3748" stroke-width="2.5" stroke-linecap="round"/>`
             + `<text x="${x}" y="${f2(yc + 5 + size * 0.78)}" text-anchor="middle" font-size="${size}" font-family="MarelleBaton,Nunito,sans-serif" font-weight="700" fill="${color || C_DEN}">${d}</text>`;
    }

    // ── Droite graduée ────────────────────────────────────────────────────
    function lineSVG(den, num, o) {
        o = o || {};
        const U = o.units || 3, W = 860, L = 40, Rm = 46;
        const H = o.jumps ? 225 : 140, y = o.jumps ? 135 : 70;
        const unit = (W - L - Rm) / U, X = v => L + v * unit;
        let s = `<svg class="fr2-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
        // L'unité de 0 à 1
        s += `<rect x="${X(0)}" y="${y - 22}" width="${f2(unit)}" height="44" rx="8" fill="#fff4d6"/>`;
        // Double flèche de 0 à 1 : elle montre exactement la longueur de l'unité
        {
            const ya = o.jumps ? y + 70 : y - 32, x0 = X(0), x1 = X(1), cu = '#b8860b';
            s += `<line x1="${f2(x0)}" y1="${ya - 8}" x2="${f2(x0)}" y2="${ya + 8}" stroke="${cu}" stroke-width="2"/>`
               + `<line x1="${f2(x1)}" y1="${ya - 8}" x2="${f2(x1)}" y2="${ya + 8}" stroke="${cu}" stroke-width="2"/>`
               + `<line x1="${f2(x0 + 2)}" y1="${ya}" x2="${f2(x1 - 2)}" y2="${ya}" stroke="${cu}" stroke-width="2"/>`
               + `<polygon points="${f2(x0 + 1)},${ya} ${f2(x0 + 11)},${ya - 5} ${f2(x0 + 11)},${ya + 5}" fill="${cu}"/>`
               + `<polygon points="${f2(x1 - 1)},${ya} ${f2(x1 - 11)},${ya - 5} ${f2(x1 - 11)},${ya + 5}" fill="${cu}"/>`
               + `<rect x="${f2((x0 + x1) / 2 - 34)}" y="${ya - 9}" width="68" height="18" rx="9" fill="#fffdf8"/>`
               + `<text x="${f2((x0 + x1) / 2)}" y="${ya + 4.5}" text-anchor="middle" font-size="13" font-weight="800" fill="${cu}">1 unité</text>`;
        }
        s += `<line x1="${L - 14}" y1="${y}" x2="${W - 14}" y2="${y}" stroke="#1f2937" stroke-width="3"/>`;
        s += `<polygon points="${W - 4},${y} ${W - 18},${y - 7} ${W - 18},${y + 7}" fill="#1f2937"/>`;
        const showLbl = o.labels && den > 1 && den <= 6;
        for (let k = 0; k <= U * den; k++) {
            const x = X(k / den), major = k % den === 0;
            s += `<line x1="${f2(x)}" y1="${y - (major ? 17 : 9)}" x2="${f2(x)}" y2="${y + (major ? 17 : 9)}" stroke="${major ? '#1f2937' : '#6b7280'}" stroke-width="${major ? 3 : 1.8}"/>`;
            if (major) s += `<text x="${f2(x)}" y="${y + 44}" text-anchor="middle" font-size="26" font-weight="900" fill="#1f2937" font-family="MarelleBaton,Nunito,sans-serif">${k / den}</text>`;
            else if (showLbl) s += svgFrac(f2(x), y + 34, k, den, 13, '#6b7280');
        }
        if (o.jumps && num > 0) {
            for (let k = 1; k <= num; k++) {
                const x1 = X((k - 1) / den), x2 = X(k / den), h = Math.min(46, (x2 - x1) * 0.7 + 10);
                const c = k % 2 ? C_NUM : '#8e44ad';
                s += `<path d="M${f2(x1)} ${y - 3} Q${f2((x1 + x2) / 2)} ${f2(y - 3 - 2 * h)} ${f2(x2)} ${y - 3}" fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round"/>`;
                if (U * den <= 30) s += `<text x="${f2((x1 + x2) / 2)}" y="${f2(y - h - 8)}" text-anchor="middle" font-size="11" font-weight="800" fill="${c}">${k}</text>`;
            }
        }
        if (num != null) {
            const x = X(Math.min(num, U * den) / den);
            if (o.jumps) s += `<text x="${f2(x)}" y="${y - 16}" text-anchor="middle" font-size="30">🦘</text>`;
            s += `<circle cx="${f2(x)}" cy="${y}" r="9" fill="#e74c3c" stroke="#fff" stroke-width="3"/>`;
        }
        return s + '</svg>';
    }

    // ── Fractions égales : deux barres superposées ────────────────────────
    function equivSVG(n, d, k) {
        const W = 760, P = 100, BW = 640, BH = 60, y1 = 24, y2 = 130, H = 210;
        let s = `<svg class="fr2-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
        s += svgFrac(48, y1 + BH / 2 + 2, n, d, 24) + svgFrac(48, y2 + BH / 2 + 2, n * k, d * k, 24);
        for (let i = 0; i < d; i++) s += `<rect x="${f2(P + i * BW / d)}" y="${y1}" width="${f2(BW / d)}" height="${BH}" fill="${i < n ? C_FILL : '#fff'}" stroke="#374151" stroke-width="2.5"/>`;
        for (let j = 0; j < d * k; j++) s += `<rect x="${f2(P + j * BW / (d * k))}" y="${y2}" width="${f2(BW / (d * k))}" height="${BH}" fill="${j < n * k ? '#f6b26b' : '#fff'}" stroke="${j % k === 0 ? '#374151' : '#9ca3af'}" stroke-width="${j % k === 0 ? 2.5 : 1.3}"/>`;
        for (let i = 1; i < d; i++) { const x = f2(P + i * BW / d); s += `<line x1="${x}" y1="${y1 + BH}" x2="${x}" y2="${y2 + BH}" stroke="#374151" stroke-width="2.5"/>`; }
        for (let i = 1; i < d; i++) { const x = f2(P + i * BW / d); s += `<line x1="${x}" y1="${y1 + BH}" x2="${x}" y2="${y2}" stroke="#fffdf8" stroke-width="2.5" stroke-dasharray="4 6"/>`; }
        s += `<rect x="${P}" y="${y1}" width="${BW}" height="${BH}" fill="none" stroke="#1f2937" stroke-width="3"/><rect x="${P}" y="${y2}" width="${BW}" height="${BH}" fill="none" stroke="#1f2937" stroke-width="3"/>`;
        const xe = f2(P + BW * n / d);
        s += `<line x1="${xe}" y1="${y1 - 10}" x2="${xe}" y2="${y2 + BH + 12}" stroke="#e74c3c" stroke-width="3" stroke-dasharray="8 5"/>`;
        s += `<text x="${+xe > P + BW - 170 ? +xe - 8 : +xe + 8}" y="${H - 4}" text-anchor="${+xe > P + BW - 170 ? 'end' : 'start'}" font-size="13" font-weight="800" fill="#e74c3c">même longueur coloriée</text>`;
        return s + '</svg>';
    }

    // ── Comparer : deux barres de même longueur ───────────────────────────
    function compareSVG(a, b) {
        const W = 760, P = 100, BW = 640, BH = 54, ys = [20, 104], H = 180;
        let s = `<svg class="fr2-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
        [[a, C_A], [b, C_B]].forEach(([fr, col], r) => {
            const y = ys[r];
            s += svgFrac(48, y + BH / 2 + 2, fr.n, fr.d, 22);
            for (let i = 0; i < fr.d; i++) s += `<rect x="${f2(P + i * BW / fr.d)}" y="${y}" width="${f2(BW / fr.d)}" height="${BH}" fill="${i < fr.n ? col : '#fff'}" stroke="#374151" stroke-width="2"/>`;
            s += `<rect x="${P}" y="${y}" width="${BW}" height="${BH}" fill="none" stroke="#1f2937" stroke-width="3"/>`;
            const xe = f2(P + BW * fr.n / fr.d);
            s += `<line x1="${xe}" y1="${y - 6}" x2="${xe}" y2="${y + BH + 6}" stroke="${col}" stroke-width="3" stroke-dasharray="6 4"/>`;
        });
        s += `<text x="${P + BW / 2}" y="${H - 4}" text-anchor="middle" font-size="12" font-weight="700" fill="#7b6a55">Les deux barres représentent la même unité</text>`;
        return s + '</svg>';
    }

    // ── Parts égales : figure (barre, disque ou carré coupé en triangles) ─
    function egSVG(q) {
        const COL = C_FILL, ST = '#374151';
        const tot = q.w.reduce((a, b) => a + b, 0);
        if (q.shape === 'bar') return barSVG(q.n, i => i === q.ci, { w: 420, h: 130, weights: q.w });
        if (q.shape === 'circle') {
            const S = 240, C = 120, R = 108;
            let s = `<svg class="fr2-svg" viewBox="0 0 ${S} ${S}" xmlns="http://www.w3.org/2000/svg">`, a = -Math.PI / 2;
            for (let i = 0; i < q.n; i++) {
                const st = 2 * Math.PI * q.w[i] / tot, b = a + st;
                s += `<path d="M${C} ${C} L${f2(C + R * Math.cos(a))} ${f2(C + R * Math.sin(a))} A${R} ${R} 0 ${st > Math.PI ? 1 : 0} 1 ${f2(C + R * Math.cos(b))} ${f2(C + R * Math.sin(b))} Z" fill="${i === q.ci ? COL : '#fff'}" stroke="${ST}" stroke-width="2.5" stroke-linejoin="round"/>`;
                a = b;
            }
            return s + `<circle cx="${C}" cy="${C}" r="${R}" fill="none" stroke="#1f2937" stroke-width="3"/></svg>`;
        }
        // Carré coupé par ses diagonales
        const S = 230, P = 15, Q = S - P, M = S / 2;
        const tris = q.n === 2
            ? [[[P, P], [Q, P], [Q, Q]], [[P, P], [P, Q], [Q, Q]]]
            : [[[P, P], [Q, P], [M, M]], [[Q, P], [Q, Q], [M, M]], [[Q, Q], [P, Q], [M, M]], [[P, Q], [P, P], [M, M]]];
        let s = `<svg class="fr2-svg" viewBox="0 0 ${S} ${S}" xmlns="http://www.w3.org/2000/svg">`;
        tris.forEach((t, i) => { s += `<polygon points="${t.map(p => p.join(',')).join(' ')}" fill="${i === q.ci ? COL : '#fff'}" stroke="${ST}" stroke-width="2.5" stroke-linejoin="round"/>`; });
        return s + `<rect x="${P}" y="${P}" width="${Q - P}" height="${Q - P}" fill="none" stroke="#1f2937" stroke-width="3"/></svg>`;
    }
    function makeEgQuestion() {
        const equal = Math.random() < 0.5;
        let shape = pick(['bar', 'circle']);
        let n = pick([2, 3, 4, 5, 6, 8]);
        if (equal && Math.random() < 0.3) { shape = 'diag'; n = pick([2, 4]); }
        let w;
        if (equal) w = Array(n).fill(1);
        else { do { w = []; for (let i = 0; i < n; i++) w.push(0.35 + Math.random() * 1.65); } while (Math.max(...w) / Math.min(...w) < 1.8); }
        let ci = rnd(0, n - 1);
        if (!equal) {
            // On colorie la part la plus éloignée de 1/n : la réponse « Non » est alors indiscutable
            const tot = w.reduce((a, b) => a + b, 0); let best = -1;
            w.forEach((v, i) => { const dev = Math.abs(v / tot - 1 / n); if (dev > best) { best = dev; ci = i; } });
        }
        return { n, equal, shape, w: w.map(v => +v.toFixed(3)), ci, answered: false, ans: null };
    }

    // =====================================================================
    // DÉFI : générateur de questions
    // =====================================================================
    function pickChoices(correct, cands) {
        const out = [{ n: correct[0], d: correct[1], ok: true }];
        const seen = new Set([correct.join('/')]);
        const ok = (n, d) => d > 0 && n >= 0 && !seen.has(n + '/' + d) && n * correct[1] !== d * correct[0];
        cands.forEach(([n, d]) => { if (out.length < 4 && ok(n, d)) { seen.add(n + '/' + d); out.push({ n, d, ok: false }); } });
        let g = 0;
        while (out.length < 4 && g++ < 80) { const d = rnd(2, 12), n = rnd(1, d + 2); if (ok(n, d)) { seen.add(n + '/' + d); out.push({ n, d, ok: false }); } }
        return shuffle(out).map(c => ({ html: F(c.n, c.d), ok: c.ok }));
    }
    function makeDefiQuestion(prev) {
        const types = ['identify', 'read', 'equiv', 'line', 'vs1', 'compare'];
        let t; do { t = pick(types); } while (t === prev);
        const q = { type: t, answered: false, chosen: null, visual: null };
        if (t === 'identify') {
            const den = rnd(3, 10), num = rnd(1, den - 1), kind = pick(['pizza', 'bar']);
            q.visual = { kind, den, num };
            q.prompt = 'Quelle fraction représente la partie en couleur ?';
            q.choices = pickChoices([num, den], [[den - num, den], [num, den - num], [den, num], [num, den + 1], [num + 1, den]]);
            q.explain = `La figure est partagée en <b class="d">${den}</b> parts égales : c'est le <b class="d">dénominateur</b>. <b class="n">${num}</b> parts sont en couleur : c'est le <b class="n">numérateur</b>. Réponse : ${F(num, den)}.`
                + (den - num !== num ? ` <br>⚠️ ${F(den - num, den)}, c'est la partie <i>sans</i> couleur.` : '');
        } else if (t === 'read') {
            const den = rnd(2, 10), num = den === 2 ? 1 : rnd(1, den - 1);
            q.prompt = `Comment se lit la fraction ${F(num, den)} ?`;
            const good = fracName(num, den), opts = [good];
            [num >= 2 ? fracName(den, num) : null, fracName(num, den + 1), fracName(num + 1, den), den > 2 ? fracName(num, den - 1) : null, fracName(num + 2, den)]
                .forEach(x => { if (x && opts.length < 4 && opts.indexOf(x) === -1) opts.push(x); });
            q.choices = shuffle(opts.map(x => ({ html: x, ok: x === good })));
            q.explain = `On lit d'abord le <b class="n">numérateur</b> (${nw(num)}), puis le <b class="d">dénominateur</b> avec « -ième » : ${F(num, den)} se lit « ${good} ».`
                + (den <= 4 ? ' Pour 2, 3 et 4, on dit <b>demi</b>, <b>tiers</b> et <b>quart</b>.' : '');
        } else if (t === 'equiv') {
            let d, n; do { d = rnd(2, 6); n = rnd(1, d - 1); } while (gcd(n, d) !== 1);
            const k = rnd(2, 4);
            q.prompt = `Quelle fraction est égale à ${F(n, d)} ?`;
            q.choices = pickChoices([n * k, d * k], [[n + k, d + k], [n * k, d], [n, d * k], [n + 1, d + 1], [n * k, d * k + 1]]);
            q.explain = `${F(n, d)} = ${F(n + ' × ' + k, d + ' × ' + k)} = ${F(n * k, d * k)} : on multiplie le numérateur <b>ET</b> le dénominateur par le même nombre (${k}).<br>⚠️ Ajouter le même nombre en haut et en bas ne donne pas une fraction égale !`;
        } else if (t === 'line') {
            const den = rnd(2, 6), num = rnd(1, 2 * den);
            q.visual = { kind: 'line', den, num };
            q.prompt = 'Quelle fraction correspond au point rouge 🔴 ?';
            q.choices = pickChoices([num, den], [[num + 1, den], [num, den + 1], [num - 1, den], [den, num], [num + 2, den]]);
            q.explain = `Chaque unité est partagée en <b class="d">${den}</b> parts égales (compte les espaces, pas les traits !). Le point est à <b class="n">${num}</b> parts de 0 : c'est ${F(num, den)}` + (num % den === 0 ? `, c'est-à-dire ${num / den}.` : '.');
        } else if (t === 'vs1') {
            const den = rnd(2, 9), r = rnd(0, 2);
            const num = r === 0 ? rnd(1, den - 1) : r === 1 ? den : rnd(den + 1, 2 * den + 1);
            q.prompt = `La fraction ${F(num, den)} est…`;
            q.choices = [{ html: 'plus petite que 1', ok: r === 0 }, { html: 'égale à 1', ok: r === 1 }, { html: 'plus grande que 1', ok: r === 2 }];
            q.explain = r === 0 ? `Le numérateur (${num}) est plus petit que le dénominateur (${den}) : on prend moins de parts qu'il n'en faut pour faire une unité. ${F(num, den)} &lt; 1.`
                : r === 1 ? `Le numérateur est égal au dénominateur : on prend toutes les parts, c'est l'unité entière. ${F(num, den)} = 1.`
                : `Le numérateur (${num}) est plus grand que le dénominateur (${den}) : on a dépassé l'unité. ${F(num, den)} = ${F(den, den)} + ${F(num - den, den)} = 1 + ${F(num - den, den)}, donc ${F(num, den)} &gt; 1.`;
        } else {
            let A, B, rule;
            if (Math.random() < 0.5) {
                const d = rnd(3, 10); let a, b; do { a = rnd(1, d); b = rnd(1, d); } while (a === b);
                A = [a, d]; B = [b, d];
                rule = `Même dénominateur : les parts ont la même taille. On compare les numérateurs : celle qui a le plus de parts est la plus grande.`;
            } else {
                const n = rnd(1, 5); let da, db; do { da = rnd(n + 1, 12); db = rnd(n + 1, 12); } while (da === db);
                A = [n, da]; B = [n, db];
                rule = `Même numérateur : on prend autant de parts. Mais plus le dénominateur est grand, plus les parts sont <b>petites</b> ! La plus grande fraction a le plus petit dénominateur.`;
            }
            const c = A[0] * B[1] - B[0] * A[1], sign = c < 0 ? '<' : c > 0 ? '>' : '=';
            q.prompt = `Choisis le bon signe :<br>${F(A[0], A[1])} <span style="color:#c0a98a;font-size:28px">?</span> ${F(B[0], B[1])}`;
            q.choices = ['<', '=', '>'].map(sg => ({ html: `<span style="font-size:30px">${sg.replace('<', '&lt;').replace('>', '&gt;')}</span>`, ok: sg === sign }));
            q.explain = rule + `<br>Donc ${F(A[0], A[1])} ${sign.replace('<', '&lt;').replace('>', '&gt;')} ${F(B[0], B[1])}.`;
        }
        return q;
    }
    function defiVisual(v) {
        if (!v) return '';
        const col = new Set([...Array(v.num || 0).keys()]);
        if (v.kind === 'pizza') return `<div class="fr2-visual" style="max-width:240px">${pizzaSVG(v.den, col, {})}</div>`;
        if (v.kind === 'bar') return `<div class="fr2-visual" style="max-width:460px">${barSVG(v.den, i => i < v.num, { w: 460, h: 90 })}</div>`;
        if (v.kind === 'line') return `<div class="fr2-visual wide">${lineSVG(v.den, v.num, { units: 2 })}</div>`;
        return '';
    }

    // =====================================================================
    // Conseils de Fracto le hibou
    // =====================================================================
    const TIPS = {
        decouvrir: [
            'Pour ne pas confondre : le <b style="color:' + C_DEN + '">Dénominateur</b> est <b>Dessous</b>… et c\'est lui qui <b>Découpe</b> !',
            'Plus le dénominateur est grand, plus les parts sont <b>petites</b> : ' + F(1, 8) + ' de pizza, c\'est moins que ' + F(1, 4) + ' de pizza !',
            'Tu peux cliquer directement sur les parts pour les prendre ou les reposer.',
            'Quand le numérateur est égal au dénominateur, on a pris toute l\'unité : ' + F(4, 4) + ' = 1.',
            'Le trait de fraction veut dire « partagé en ». ' + F(3, 4) + ', c\'est 3 parts d\'une unité partagée en 4.'
        ],
        egal: [
            'Une pizza coupée n\'importe comment en 4 morceaux ne donne pas des quarts !',
            'Les parts peuvent avoir des <b>formes</b> différentes : ce qui compte, c\'est qu\'elles aient la même <b>taille</b>.',
            'Astuce : imagine que tu dois partager avec tes copains. Si un morceau est plus gros, ce n\'est pas juste… et ce n\'est pas une fraction !'
        ],
        droite: [
            'Sur la droite, on compte les <b>espaces</b> entre les graduations, pas les traits !',
            'Pour faire 1, il faut autant de bonds que le dénominateur : ' + F(5, 5) + ' = 1.',
            F(3, 2) + ', c\'est un et demi : 1 + ' + F(1, 2) + '. Une fraction peut dépasser 1 !',
            'Chaque nombre entier peut s\'écrire en fraction : 2 = ' + F(4, 2) + ' = ' + F(6, 3) + ' = ' + F(8, 4) + '.'
        ],
        equiv: [
            'Couper une pizza en plus de parts ne la fait pas grossir : ' + F(1, 2) + ' = ' + F(2, 4) + ' = ' + F(4, 8) + '.',
            'Piège classique : ' + F(1, 2) + ' n\'est PAS égal à ' + F(2, 3) + '. Ajouter 1 en haut et en bas, ça ne marche pas !',
            'Simplifier, c\'est faire le chemin inverse : on divise en haut et en bas par le même nombre.'
        ],
        cmp: [
            'Avec le même dénominateur, c\'est facile : on compare juste les numérateurs.',
            'Qui préfère ' + F(1, 2) + ' ou ' + F(1, 10) + ' d\'un gâteau ? Moins on est à partager, plus la part est grosse !',
            'Une fraction plus petite que 1 est toujours plus petite qu\'une fraction plus grande que 1.'
        ],
        defi: [
            'Lis bien la question : couleur ou sans couleur ?',
            'Sur une droite, compte les espaces depuis 0.',
            'Pas de panique si tu te trompes : lis l\'explication, c\'est comme ça qu\'on apprend !'
        ]
    };

    function _isPhone() {
        if (typeof isMobileBoardMode === 'function') { try { return !!isMobileBoardMode(); } catch (e) {} }
        return !!(window.matchMedia && window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse)').matches);
    }

    function defaultState() {
        return {
            tab: 'decouvrir', tip: 0,
            dec: { shape: 'pizza', den: 8, colored: [0, 1, 2] },
            eg: { score: 0, total: 0, q: null },
            dr: { num: 3, den: 4, labels: true },
            eq: { num: 3, den: 4, k: 2 },
            cmp: { a: { n: 3, d: 4 }, b: { n: 2, d: 3 }, guess: true, guessed: null },
            defi: { idx: 0, score: 0, streak: 0, best: 0, results: [], q: null, done: false }
        };
    }

    const TABS = [
        ['decouvrir', '🍕', 'Découvrir'],
        ['egal', '⚖️', 'Parts égales'],
        ['droite', '🦘', 'Droite graduée'],
        ['equiv', '🟰', 'Fractions égales'],
        ['cmp', '🆚', 'Comparer'],
        ['defi', '🏆', 'Défi']
    ];

    // =====================================================================
    // INITIALISATION
    // =====================================================================
    window.initFractions2Widget = function (widget) {
        const pending = window._fr2NextPendingData || null;
        window._fr2NextPendingData = null;
        const restored = !!pending;

        const container = widget.querySelector('.fr2-container');
        const tabsEl = container.querySelector('.fr2-tabs');
        const body = container.querySelector('.fr2-body');
        const help = container.querySelector('.fr2-help');
        const resizeHandle = container.querySelector('.fr2-resize');

        // ── État (fusionné avec la sauvegarde) ──
        const S = defaultState();
        if (pending && pending.state) {
            const ps = pending.state;
            Object.keys(S).forEach(k => {
                if (ps[k] === undefined) return;
                if (S[k] && typeof S[k] === 'object' && !Array.isArray(S[k])) S[k] = Object.assign(S[k], ps[k]);
                else S[k] = ps[k];
            });
        }

        const save = () => { if (typeof saveBoard === 'function') saveBoard(); };

        // ── Onglets ──
        tabsEl.innerHTML = TABS.map(([id, ico, lbl]) =>
            `<button class="fr2-tab" data-act="tab" data-tab="${id}" title="${lbl}"><span class="fr2-tab-ico">${ico}</span><span class="fr2-tab-lbl">${lbl}</span></button>`).join('');

        function mascot(key) {
            const list = TIPS[key] || TIPS.decouvrir;
            const tip = list[S.tip % list.length];
            return `<div class="fr2-mascot"><div class="fr2-owl">🦉</div><div class="fr2-bubble"><b class="who">Fracto le hibou :</b> ${tip}
                <button class="fr2-linkbtn" data-act="tip">Un autre conseil ➜</button></div></div>`;
        }
        const stepper = (act, val, cls, extra) =>
            `<div class="fr2-stp"><button data-act="${act}" data-d="-1" ${extra || ''}>−</button><span class="fr2-bignum ${cls}">${val}</span><button data-act="${act}" data-d="1" ${extra || ''}>+</button></div>`;
        const mini = (act, label, val, color, extra) =>
            `<div class="fr2-mini"><span class="l">${label}</span><button data-act="${act}" data-d="-1" ${extra || ''}>−</button><span class="v" style="color:${color}">${val}</span><button data-act="${act}" data-d="1" ${extra || ''}>+</button></div>`;
        const lt = sg => sg.replace('<', '&lt;').replace('>', '&gt;');

        // ── 1. DÉCOUVRIR ─────────────────────────────────────────────────
        function renderDecouvrir() {
            const d = S.dec, den = d.den, col = new Set(d.colored), n = col.size;
            const obj = d.shape === 'pizza' ? 'la pizza' : 'la tablette de chocolat';
            const Obj = d.shape === 'pizza' ? 'La pizza' : 'La tablette';
            const visual = d.shape === 'pizza' ? pizzaSVG(den, col, { clickable: true, explode: true }) : chocoSVG(den, col, { clickable: true });
            let txt;
            if (den === 1) txt = `${Obj} n'est pas partagée : elle forme <b class="d">1</b> seule part, l'unité entière. `;
            else txt = `${Obj} est partagée en <b class="d">${den}</b> parts <b>égales</b>. Chaque part vaut ${F(1, den)} (« ${fracName(1, den)} »).<br>`;
            if (n === 0) txt += `Je n'en prends <b class="n">aucune</b> : ${F(0, den)} = 0, il n'y a rien ! 😮`;
            else if (n < den) txt += `J'en prends <b class="n">${n}</b> : j'ai ${F(n, den)} de ${obj}. Il en reste ${F(den - n, den)}.<br>Comme ${n} &lt; ${den}, la fraction est <b>plus petite que 1</b>.`;
            else txt += `Je prends <b class="n">toutes</b> les parts : ${F(n, den)} = 1, c'est ${obj} entière ! 🎉`;
            return `<div class="fr2-cols">
              <div class="fr2-left">
                <div class="fr2-seg"><button data-act="dec-shape" data-v="pizza" class="${d.shape === 'pizza' ? 'on' : ''}">🍕 Pizza</button><button data-act="dec-shape" data-v="choco" class="${d.shape === 'choco' ? 'on' : ''}">🍫 Chocolat</button></div>
                <div class="fr2-visual" style="max-width:${d.shape === 'pizza' ? 330 : 460}px">${visual}</div>
                <div class="fr2-hint">👆 Clique sur les parts pour les prendre ou les reposer</div>
              </div>
              <div class="fr2-right">
                <div class="fr2-big">
                  ${stepper('dec-num', n, 'n')}<div class="fr2-lbl"><b class="n">Numérateur</b> (en haut)<br>le nombre de parts que je <b>prends</b></div>
                  <div class="fr2-bigbar"></div><div class="fr2-lbl" style="font-size:12px;color:#9a8770">trait de fraction = « partagé en »</div>
                  ${stepper('dec-den', den, 'd')}<div class="fr2-lbl"><b class="d">Dénominateur</b> (en bas)<br>en combien de parts <b>égales</b> on a partagé</div>
                </div>
                <div class="fr2-reading">${F(n, den)} se lit « ${fracName(n, den)} »</div>
                <div class="fr2-explain">${txt}</div>
                <div class="fr2-retenir"><b>📘 À retenir</b>Une fraction désigne une partie d'une unité partagée en <b>parts égales</b>.
                  On lit le numérateur puis le dénominateur avec « -ième » : ${F(3, 8)} « trois huitièmes ».
                  Exceptions : ${F(1, 2)} un demi, ${F(1, 3)} un tiers, ${F(1, 4)} un quart.</div>
              </div>
            </div>${mascot('decouvrir')}`;
        }

        // ── 2. PARTS ÉGALES ──────────────────────────────────────────────
        function renderEgal() {
            const e = S.eg; if (!e.q) e.q = makeEgQuestion();
            const q = e.q;
            let fb = '';
            if (q.answered) {
                const good = (q.ans === 'oui') === q.equal;
                const why = q.equal
                    ? `Les ${q.n} parts ont toutes la <b>même taille</b> : chacune vaut ${F(1, q.n)} (« ${fracName(1, q.n)} »).` + (q.shape === 'diag' ? ' Ce sont des triangles et pas des rectangles, mais c\'est la taille qui compte !' : '')
                    : `Les parts n'ont <b>pas</b> la même taille : on ne peut pas parler de « ${({ 2: 'demis', 3: 'tiers', 4: 'quarts' })[q.n] || ordinal(q.n) + 's'} ». La partie coloriée n'est pas ${F(1, q.n)} de la figure.`;
                fb = `<div class="fr2-feedback ${good ? 'ok' : 'ko'}">${good ? '✅ Bravo ! ' : '❌ Pas tout à fait… '}<b>${q.equal ? 'Oui' : 'Non'}</b> — ${why}</div>
                      <button class="fr2-btn" data-act="eg-next">Figure suivante ➜</button>`;
            }
            return `<div class="fr2-full">
                <div class="fr2-retenir fr2-warn" style="width:100%;box-sizing:border-box"><b>⚠️ La règle d'or</b>Pour parler de fraction, l'unité doit être partagée en parts <b>ÉGALES</b> (de même taille). Les parts n'ont pas forcément la même forme, mais elles ont toutes la même aire.</div>
                <div style="display:flex;gap:10px;align-items:center"><span class="fr2-score">Score : ${e.score} / ${e.total}</span></div>
                <div class="fr2-prompt">Cette figure est partagée en <b>${q.n}</b> parts.<br>Peut-on dire que la partie coloriée représente ${F(1, q.n)} de la figure ?</div>
                <div class="fr2-visual" style="max-width:${q.shape === 'bar' ? 440 : 250}px">${egSVG(q)}</div>
                <div style="display:flex;gap:14px">
                  <button class="fr2-btn yes" data-act="eg-ans" data-v="oui" ${q.answered ? 'disabled' : ''}>✔ Oui</button>
                  <button class="fr2-btn no" data-act="eg-ans" data-v="non" ${q.answered ? 'disabled' : ''}>✘ Non</button>
                </div>
                ${fb}
              </div>${mascot('egal')}`;
        }

        // ── 3. DROITE GRADUÉE ────────────────────────────────────────────
        function renderDroite() {
            const { num, den } = S.dr;
            let cmp;
            if (num === 0) cmp = `0 bond : le kangourou reste sur 0. ${F(0, den)} = 0.`;
            else if (num < den) cmp = `${F(num, den)} est <b>plus petite que 1</b> : le numérateur (${num}) est plus petit que le dénominateur (${den}). Il manque ${F(den - num, den)} pour arriver à 1.`;
            else if (num === den) cmp = `${F(num, den)} = <b>1</b> : il faut exactement ${den} bonds de ${F(1, den)} pour parcourir une unité.`;
            else {
                const qn = Math.floor(num / den), r = num % den;
                cmp = `${F(num, den)} est <b>plus grande que 1</b> : le numérateur (${num}) est plus grand que le dénominateur (${den}).<br>`
                    + (r === 0 ? `${F(num, den)} = <b>${qn}</b> : c'est exactement ${qn} unités (${qn} × ${den} = ${num}).`
                               : `${F(num, den)} = ${F(qn * den, den)} + ${F(r, den)} = <b>${qn} + ${F(r, den)}</b>. Le kangourou est entre ${qn} et ${qn + 1}.`);
            }
            return `<div class="fr2-full">
                <div class="fr2-ctrls">
                  ${mini('dr-den', 'Dénominateur', den, C_DEN)}
                  ${mini('dr-num', 'Numérateur (bonds)', num, C_NUM)}
                  <button class="fr2-btn alt" data-act="dr-labels">${S.dr.labels ? '🙈 Cacher' : '👁 Montrer'} les fractions</button>
                </div>
                <div class="fr2-visual wide">${lineSVG(den, num, { units: 3, jumps: true, labels: S.dr.labels })}</div>
                ${S.dr.labels && den > 6 ? '<div class="fr2-hint">(graduations trop serrées pour écrire les fractions)</div>' : ''}
                <div class="fr2-explain" style="width:100%;box-sizing:border-box">Chaque unité est partagée en <b class="d">${den}</b> parts égales : un bond vaut ${F(1, den)}.
                  Le kangourou fait <b class="n">${num}</b> bond${num > 1 ? 's' : ''} depuis 0 : il arrive à ${F(num, den)}.<br>${cmp}</div>
                <div class="fr2-retenir" style="width:100%;box-sizing:border-box"><b>📘 À retenir</b>Sur une droite graduée, le <b>dénominateur</b> dit en combien de parts égales on partage chaque unité, le <b>numérateur</b> dit combien de parts on compte à partir de 0.
                  <ul><li>numérateur &lt; dénominateur → fraction <b>&lt; 1</b></li><li>numérateur = dénominateur → fraction <b>= 1</b></li><li>numérateur &gt; dénominateur → fraction <b>&gt; 1</b> (ex. ${F(5, 4)} = 1 + ${F(1, 4)})</li></ul></div>
              </div>${mascot('droite')}`;
        }

        // ── 4. FRACTIONS ÉGALES ──────────────────────────────────────────
        function renderEquiv() {
            const { num, den, k } = S.eq;
            const expl = k === 1
                ? 'Augmente le nombre « Je coupe chaque part en… » pour voir ce qui se passe.'
                : `Je coupe chaque part en <b>${k}</b> : il y a ${k} fois plus de parts (${den} × ${k} = <b class="d">${den * k}</b>) et j'en prends ${k} fois plus (${num} × ${k} = <b class="n">${num * k}</b>).<br>
                   La partie coloriée <b>n'a pas changé de taille</b> : ${F(num, den)} et ${F(num * k, den * k)} sont deux écritures de la même quantité.<br>
                   <span style="color:#7b6a55">Dans l'autre sens : ${F(num * k, den * k)} = ${F(num, den)} en divisant en haut et en bas par ${k}. C'est <b>simplifier</b> la fraction.</span>`;
            return `<div class="fr2-full">
                <div class="fr2-ctrls">
                  ${mini('eq-num', 'Numérateur', num, C_NUM)}
                  ${mini('eq-den', 'Dénominateur', den, C_DEN)}
                  ${mini('eq-k', '✂️ Je coupe chaque part en', k, '#7a4b1e')}
                </div>
                <div class="fr2-eq">${F(num, den)} = ${F(num + ' × ' + k, den + ' × ' + k, 'plain')} = ${F(num * k, den * k)}</div>
                <div class="fr2-visual wide">${equivSVG(num, den, k)}</div>
                <div class="fr2-explain" style="width:100%;box-sizing:border-box">${expl}</div>
                <div class="fr2-retenir" style="width:100%;box-sizing:border-box"><b>📘 À retenir</b>Deux fractions sont <b>égales</b> (on dit aussi équivalentes) quand elles représentent la même quantité.
                  On obtient une fraction égale en <b>multipliant</b> (ou en divisant) le numérateur <b>ET</b> le dénominateur par le <b>même nombre</b>.</div>
                <div class="fr2-retenir fr2-warn" style="width:100%;box-sizing:border-box"><b>⚠️ Attention au piège</b>Ajouter le même nombre en haut et en bas ne marche pas : ${F(1, 2)} ≠ ${F(2, 3)} (1 + 1 et 2 + 1).</div>
              </div>${mascot('equiv')}`;
        }

        // ── 5. COMPARER ──────────────────────────────────────────────────
        function cmpSign(a, b) { const c = a.n * b.d - b.n * a.d; return c < 0 ? '<' : c > 0 ? '>' : '='; }
        function renderCmp() {
            const c = S.cmp, a = c.a, b = c.b, sg = cmpSign(a, b);
            const reveal = !c.guess || c.guessed;
            let why;
            if (a.d === b.d) why = `<b>Même dénominateur (${a.d})</b> : les parts ont la même taille. On compare les numérateurs : ${a.n} ${lt(sg)} ${b.n}.`;
            else if (a.n === b.n && a.n > 0) why = `<b>Même numérateur (${a.n})</b> : on prend autant de parts. Mais les parts de ${F(1, Math.min(a.d, b.d))} sont plus grosses que celles de ${F(1, Math.max(a.d, b.d))}. La plus grande fraction est celle qui a le <b>plus petit</b> dénominateur.`;
            else if (a.n === 0 || b.n === 0) why = `Une fraction de numérateur 0 vaut 0 : on ne prend aucune part.`;
            else {
                const L = lcm(a.d, b.d), ma = L / a.d, mb = L / b.d;
                why = `Ni le même numérateur, ni le même dénominateur : on écrit les deux fractions avec le <b>même dénominateur</b> (${L}).<br>
                       ${F(a.n, a.d)} = ${F(a.n * ma, L)} et ${F(b.n, b.d)} = ${F(b.n * mb, L)}. Puis on compare les numérateurs : ${a.n * ma} ${lt(sg)} ${b.n * mb}.`;
            }
            let res = '';
            if (c.guess && c.guessed) res = c.guessed === sg ? '<div class="fr2-feedback ok">✅ Bien vu ! Les barres le confirment.</div>' : `<div class="fr2-feedback ko">❌ Raté : tu avais choisi « ${lt(c.guessed)} ». Regarde les barres !</div>`;
            const box = (key, fr, col) => `<div class="fr2-cmp-box" style="border-color:${col}55">
                ${mini('cmp', 'N', fr.n, C_NUM, `data-f="${key}" data-p="n"`)}
                <span style="font-size:40px">${F(fr.n, fr.d)}</span>
                ${mini('cmp', 'D', fr.d, C_DEN, `data-f="${key}" data-p="d"`)}</div>`;
            return `<div class="fr2-full">
                <div class="fr2-ctrls">
                  <button class="fr2-btn alt" data-act="cmp-rand">🎲 Nouvelles fractions</button>
                  <button class="fr2-btn alt" data-act="cmp-mode">${c.guess ? '🔮 Mode devinette : activé' : '🔮 Mode devinette : désactivé'}</button>
                </div>
                <div class="fr2-cmp-row">
                  ${box('a', a, C_A)}
                  <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
                    <div class="fr2-sign ${reveal ? '' : 'q'}">${reveal ? lt(sg) : '?'}</div>
                    ${c.guess && !c.guessed ? `<div class="fr2-guess">${['<', '=', '>'].map(x => `<button class="fr2-btn alt" data-act="cmp-guess" data-v="${x}">${lt(x)}</button>`).join('')}</div>` : ''}
                  </div>
                  ${box('b', b, C_B)}
                </div>
                ${res}
                ${reveal ? `<div class="fr2-visual wide">${compareSVG(a, b)}</div><div class="fr2-explain" style="width:100%;box-sizing:border-box">${why}</div>`
                         : '<div class="fr2-hint">Choisis &lt;, = ou &gt; pour voir les barres et l\'explication.</div>'}
                <div class="fr2-retenir" style="width:100%;box-sizing:border-box"><b>📘 À retenir</b><ul style="margin-top:0">
                  <li><b>Même dénominateur</b> : la plus grande fraction a le plus grand numérateur.</li>
                  <li><b>Même numérateur</b> : la plus grande fraction a le plus <b>petit</b> dénominateur (parts plus grosses).</li>
                  <li><b>Sinon</b> : on écrit les deux fractions avec le même dénominateur, ou on les compare à 1.</li></ul></div>
              </div>${mascot('cmp')}`;
        }

        // ── 6. DÉFI ──────────────────────────────────────────────────────
        function renderDefi() {
            const D = S.defi, N = 10;
            if (D.done) {
                const st = D.score >= 9 ? 3 : D.score >= 7 ? 2 : D.score >= 5 ? 1 : 0;
                const msg = ['Continue à t\'entraîner : relis les onglets et retente ta chance ! 💪', 'Pas mal du tout ! Encore un effort. 👍', 'Très bien ! Tu maîtrises les fractions. 🌟', 'Champion·ne des fractions ! 🏆'][st];
                return `<div class="fr2-full" style="padding-top:20px">
                    <div style="font-size:26px;font-weight:900;color:#7a4b1e">Défi terminé !</div>
                    <div class="fr2-stars">${'⭐'.repeat(st)}${'☆'.repeat(3 - st)}</div>
                    <div style="font-size:22px;font-weight:800">${D.score} bonne${D.score > 1 ? 's' : ''} réponse${D.score > 1 ? 's' : ''} sur ${N}</div>
                    <div class="fr2-dots">${D.results.map(r => `<span class="fr2-dot ${r ? 'ok' : 'ko'}"></span>`).join('')}</div>
                    <div style="font-size:16px">${msg}</div>
                    <div style="font-size:14px;color:#7b6a55">Meilleure série : 🔥 ${D.best}</div>
                    <button class="fr2-btn" data-act="defi-restart">🔄 Rejouer</button>
                  </div>${mascot('defi')}`;
            }
            if (!D.q) D.q = makeDefiQuestion(null);
            const q = D.q;
            const dots = Array.from({ length: N }, (_, i) => `<span class="fr2-dot ${i < D.results.length ? (D.results[i] ? 'ok' : 'ko') : (i === D.idx ? 'cur' : '')}"></span>`).join('');
            const choices = q.choices.map((c, i) => {
                let cls = '';
                if (q.answered) { if (c.ok) cls = 'good'; else if (i === q.chosen) cls = 'bad'; }
                return `<button class="fr2-choice ${cls}" data-act="defi-ans" data-i="${i}" ${q.answered ? 'disabled' : ''}>${c.html}</button>`;
            }).join('');
            let fb = '';
            if (q.answered) {
                const good = q.choices[q.chosen] && q.choices[q.chosen].ok;
                fb = `<div class="fr2-feedback ${good ? 'ok' : 'ko'}">${good ? pick(['✅ Bravo !', '✅ Excellent !', '✅ Parfait !', '✅ Super !']) : '❌ Pas tout à fait…'} ${q.explain}</div>
                      <button class="fr2-btn" data-act="defi-next">${D.idx >= N - 1 ? '🏁 Voir mon résultat' : 'Question suivante ➜'}</button>`;
            }
            return `<div class="fr2-full">
                <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;justify-content:center">
                  <span class="fr2-score">Question ${D.idx + 1} / ${N}</span><div class="fr2-dots">${dots}</div>
                  <span class="fr2-score">Score : ${D.score}</span>${D.streak >= 2 ? `<span class="fr2-streak">🔥 ${D.streak} d'affilée !</span>` : ''}
                </div>
                <div class="fr2-prompt">${q.prompt}</div>
                ${defiVisual(q.visual)}
                <div class="fr2-choices">${choices}</div>
                ${fb}
              </div>${mascot('defi')}`;
        }

        // ── Rendu principal ──
        function render() {
            tabsEl.querySelectorAll('.fr2-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === S.tab));
            const fn = { decouvrir: renderDecouvrir, egal: renderEgal, droite: renderDroite, equiv: renderEquiv, cmp: renderCmp, defi: renderDefi }[S.tab] || renderDecouvrir;
            const top = body.scrollTop;
            body.innerHTML = fn();
            body.scrollTop = top;
        }

        function celebrate() {
            const r = container.getBoundingClientRect();
            for (let i = 0; i < 14; i++) {
                const sp = document.createElement('span');
                sp.className = 'fr2-confetti';
                sp.textContent = pick(['🎉', '⭐', '✨', '🍕', '👏', '🌟']);
                sp.style.left = (10 + Math.random() * 80) + '%';
                sp.style.top = (r.height * (0.45 + Math.random() * 0.4)) + 'px';
                sp.style.animationDelay = (Math.random() * 0.35) + 's';
                container.appendChild(sp);
                setTimeout(() => sp.remove(), 1800);
            }
        }

        // ── Actions ──
        function act(a, el) {
            const d = parseInt(el.dataset.d || '0', 10);
            switch (a) {
                case 'help': help.classList.toggle('show'); return;
                case 'min':
                    container.classList.remove('fr2-fullboard');
                    if (typeof window._wfMiniBarCollapse === 'function') window._wfMiniBarCollapse(widget, '🍕 Comprendre les fractions');
                    return;
                case 'max': container.classList.toggle('fr2-fullboard'); save(); return;
                case 'close':
                    if (typeof snapshotNow === 'function') snapshotNow();
                    widget.remove(); save(); return;
                case 'tab': S.tab = el.dataset.tab; S.tip = 0; body.scrollTop = 0; break;
                case 'tip': S.tip++; break;
                // Découvrir
                case 'dec-shape': S.dec.shape = el.dataset.v; break;
                case 'dec-den': {
                    const nd = Math.max(1, Math.min(12, S.dec.den + d));
                    if (nd === S.dec.den) return;
                    const keep = Math.min(S.dec.colored.length, nd);
                    S.dec.den = nd; S.dec.colored = [...Array(keep).keys()];
                    break;
                }
                case 'dec-num': {
                    const col = S.dec.colored.slice().sort((x, y) => x - y);
                    if (d > 0 && col.length < S.dec.den) { let i = 0; while (col.indexOf(i) !== -1) i++; col.push(i); }
                    else if (d < 0 && col.length > 0) col.pop();
                    else return;
                    S.dec.colored = col; break;
                }
                case 'part': {
                    const i = parseInt(el.dataset.part, 10), col = S.dec.colored, p = col.indexOf(i);
                    if (p === -1) col.push(i); else col.splice(p, 1);
                    break;
                }
                // Parts égales
                case 'eg-ans': {
                    const q = S.eg.q; if (!q || q.answered) return;
                    q.answered = true; q.ans = el.dataset.v; S.eg.total++;
                    if ((q.ans === 'oui') === q.equal) { S.eg.score++; render(); celebrate(); save(); return; }
                    break;
                }
                case 'eg-next': S.eg.q = makeEgQuestion(); break;
                // Droite
                case 'dr-den': S.dr.den = Math.max(1, Math.min(10, S.dr.den + d)); S.dr.num = Math.min(S.dr.num, 3 * S.dr.den); break;
                case 'dr-num': S.dr.num = Math.max(0, Math.min(3 * S.dr.den, S.dr.num + d)); break;
                case 'dr-labels': S.dr.labels = !S.dr.labels; break;
                // Égales
                case 'eq-den': S.eq.den = Math.max(2, Math.min(8, S.eq.den + d)); S.eq.num = Math.min(S.eq.num, S.eq.den); S.eq.k = Math.min(S.eq.k, Math.max(1, Math.floor(24 / S.eq.den))); break;
                case 'eq-num': S.eq.num = Math.max(1, Math.min(S.eq.den, S.eq.num + d)); break;
                case 'eq-k': S.eq.k = Math.max(1, Math.min(Math.min(6, Math.floor(24 / S.eq.den)), S.eq.k + d)); break;
                // Comparer
                case 'cmp': {
                    const fr = S.cmp[el.dataset.f];
                    if (el.dataset.p === 'd') { fr.d = Math.max(1, Math.min(12, fr.d + d)); fr.n = Math.min(fr.n, fr.d); }
                    else fr.n = Math.max(0, Math.min(fr.d, fr.n + d));
                    S.cmp.guessed = null; break;
                }
                case 'cmp-rand': {
                    const r = Math.random(); let a, b;
                    if (r < 0.4) { const dd = rnd(3, 12); a = { n: rnd(1, dd), d: dd }; do { b = { n: rnd(1, dd), d: dd }; } while (b.n === a.n); }
                    else if (r < 0.75) { const nn = rnd(1, 5); a = { n: nn, d: rnd(nn, 12) }; do { b = { n: nn, d: rnd(nn, 12) }; } while (b.d === a.d); }
                    else { a = { d: rnd(2, 10) }; a.n = rnd(1, a.d); do { b = { d: rnd(2, 10) }; b.n = rnd(1, b.d); } while (b.d === a.d || b.n === a.n); }
                    S.cmp.a = a; S.cmp.b = b; S.cmp.guessed = null; break;
                }
                case 'cmp-mode': S.cmp.guess = !S.cmp.guess; S.cmp.guessed = null; break;
                case 'cmp-guess':
                    S.cmp.guessed = el.dataset.v; render(); save();
                    if (S.cmp.guessed === cmpSign(S.cmp.a, S.cmp.b)) celebrate();
                    return;
                // Défi
                case 'defi-ans': {
                    const D = S.defi, q = D.q; if (!q || q.answered) return;
                    q.answered = true; q.chosen = parseInt(el.dataset.i, 10);
                    const good = !!(q.choices[q.chosen] && q.choices[q.chosen].ok);
                    D.results.push(good);
                    if (good) { D.score++; D.streak++; D.best = Math.max(D.best, D.streak); } else D.streak = 0;
                    render(); save(); if (good) celebrate();
                    return;
                }
                case 'defi-next': {
                    const D = S.defi;
                    if (D.idx >= 9) D.done = true;
                    else { D.idx++; D.q = makeDefiQuestion(D.q && D.q.type); }
                    break;
                }
                case 'defi-restart': S.defi = { idx: 0, score: 0, streak: 0, best: S.defi.best, results: [], q: makeDefiQuestion(null), done: false }; break;
                default: return;
            }
            render(); save();
        }

        // ── Délégation des événements (clic souris + stylet / écran tactile, dédoublonnés) ──
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
        // Le contenu ne déplace pas le widget : seul l'en-tête sert de poignée
        ['pointerdown', 'mousedown', 'touchstart'].forEach(ev => container.addEventListener(ev, e => {
            if (e.target.closest('.fr2-header') && !e.target.closest('button')) return;
            e.stopPropagation();
        }, ev === 'touchstart' ? { passive: true } : false));
        document.addEventListener('pointerdown', e => {
            if (help.classList.contains('show') && !help.contains(e.target) && !e.target.closest('.fr2-help-btn')) help.classList.remove('show');
        }, true);

        // ── Redimensionnement ──
        resizeHandle.addEventListener('pointerdown', e => {
            e.stopPropagation(); e.preventDefault();
            resizeHandle.setPointerCapture(e.pointerId);
            const sx = e.clientX, sy = e.clientY, sw = container.offsetWidth, sh = container.offsetHeight;
            const mv = ev => {
                container.style.width = Math.max(420, sw + ev.clientX - sx) + 'px';
                container.style.height = Math.max(360, sh + ev.clientY - sy) + 'px';
            };
            const up = () => { resizeHandle.removeEventListener('pointermove', mv); resizeHandle.removeEventListener('pointerup', up); save(); };
            resizeHandle.addEventListener('pointermove', mv);
            resizeHandle.addEventListener('pointerup', up);
        });

        // ── Sauvegarde ──
        widget._fr2GetData = function () {
            const curW = window.innerWidth, curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
            const full = container.classList.contains('fr2-fullboard');
            return {
                state: JSON.parse(JSON.stringify(S)),
                wPct: full ? (widget._fr2SavedW || 0) : (container.offsetWidth / curW) * 100,
                hPct: full ? (widget._fr2SavedH || 0) : (container.offsetHeight / curVH) * 100,
                fullboard: full
            };
        };
        new MutationObserver(() => {
            // Mémoriser la taille « fenêtre » avant le passage en plein écran
            if (!container.classList.contains('fr2-fullboard')) {
                const curW = window.innerWidth, curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
                widget._fr2SavedW = (container.offsetWidth / curW) * 100;
                widget._fr2SavedH = (container.offsetHeight / curVH) * 100;
            }
        }).observe(container, { attributes: true, attributeFilter: ['style'] });

        render();

        requestAnimationFrame(() => requestAnimationFrame(() => {
            const curW = window.innerWidth, curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
            if (restored) {
                if (pending.wPct > 0) container.style.width = (pending.wPct / 100) * curW + 'px';
                if (pending.hPct > 0) container.style.height = (pending.hPct / 100) * curVH + 'px';
                widget._fr2SavedW = pending.wPct || 0; widget._fr2SavedH = pending.hPct || 0;
                if (pending.fullboard) container.classList.add('fr2-fullboard');
            } else {
                widget._fr2SavedW = (container.offsetWidth / curW) * 100;
                widget._fr2SavedH = (container.offsetHeight / curVH) * 100;
                widget.style.left = '100px';
                widget.dataset.leftPercent = (100 / curW) * 100;
                if (_isPhone()) container.classList.add('fr2-fullboard');
                save();
            }
        }));
    };

    // =====================================================================
    // HOOK dans createWidget
    // =====================================================================
    function install(orig) {
        window.createWidget = function (type) {
            const w = orig.apply(this, arguments);
            if (type === TYPE && w) window.initFractions2Widget(w);
            return w;
        };
    }
    if (typeof window.createWidget === 'function') install(window.createWidget);
    else document.addEventListener('DOMContentLoaded', () => { if (typeof window.createWidget === 'function') install(window.createWidget); });

})();
