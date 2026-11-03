// =========================================================================
// WIDGET DICTIONNAIRE — Le Bureau du Prof
// =========================================================================
// Un dictionnaire pour la classe, dans le style du widget « Qwant Junior » :
//   - grande barre de recherche (Entrée ou bouton « Chercher »)
//   - définitions tirées du Wiktionnaire (connexion internet requise),
//     classées par nature (nom, verbe, adjectif…), avec un exemple,
//     la prononciation, les synonymes, les contraires et l'origine du mot
//   - un mot bleu dans une définition se cherche d'un simple clic
//   - 🔊 écouter le mot (synthèse vocale du navigateur)
//   - mot introuvable : propositions de mots proches
//   - dernières recherches dans un menu déroulant, effaçable
//   - les mots déjà cherchés restent consultables hors connexion
//   - barre d'édition : A− / A+ (taille du texte) et ? (aide)
//   - déplacement en tirant la barre de titre, redimensionnement libre
//   - boutons fenêtre jaune (réduire) / vert (plein écran board) / rouge (fermer)
//   - restauré après l'actualisation du tableau (mot affiché, taille du texte)
//
// Utilisation : createWidget('dictionnaire')
// Le template #template-dictionnaire est injecté dans le DOM par ce fichier.
// Sauvegarde : window.dicGetData(widget) / window.dicSetData(widget, data)
// (appelés par save-load.js)
// =========================================================================

const DIC_API  = 'https://fr.wiktionary.org/w/api.php';
const DIC_WIKT = 'https://fr.wiktionary.org/wiki/';
const _DIC_STOP = ' onpointerdown="event.stopPropagation()" onmousedown="event.stopPropagation()" ontouchstart="event.stopPropagation()"';
const _DIC_LS_RECENT = 'lbdp-dictionnaire-recents';
const _DIC_LS_CACHE  = 'lbdp-dictionnaire-cache';
const _DIC_RECENT_MAX = 15;
const _DIC_CACHE_MAX  = 40;
const _DIC_DEFS_SHOWN = 3;      // sens affichés par nature avant « Voir plus »
const _DIC_EXAMPLES = ['chat', 'courir', 'joyeux', 'volcan', 'bibliothèque', 'rapidement'];

document.body.insertAdjacentHTML('beforeend', `
<template id="template-dictionnaire">
    <div class="editor-container dic-w" style="height:580px;width:760px;">
        <div class="dic-bar editor-toolbar" title="Glisser pour déplacer">
            <span class="dic-bar-title">📖 Dictionnaire</span>
            <div class="dic-tools"${_DIC_STOP}>
                <button type="button" class="dic-ib" data-dic-action="font-down" title="Texte plus petit">A−</button>
                <button type="button" class="dic-ib" data-dic-action="font-up"   title="Texte plus grand">A+</button>
                <button type="button" class="dic-ib dic-ib-help" data-dic-action="help" title="Aide">?</button>
            </div>
            <div class="wf-btns"${_DIC_STOP}>
                <button class="wf-btn wf-btn-min"   title="Réduire"           onclick="toggleMediaCollapse(this.closest('.editor-container'))"></button>
                <button class="wf-btn wf-btn-max"   title="Plein écran board" onclick="toggleMediaBoardFullscreen(this.closest('.editor-container'))"></button>
                <button class="wf-btn wf-btn-close" title="Fermer"            onclick="snapshotNow();this.closest('.widget').remove();saveBoard();"></button>
            </div>
        </div>
        <div class="dic-stage"${_DIC_STOP}>
            <div class="dic-top">
                <div class="dic-search">
                    <div class="dic-field">
                        <span class="dic-field-ico">📖</span>
                        <input type="text" class="dic-input" spellcheck="true" autocomplete="off" lang="fr"
                               placeholder="Tape un mot…"
                               onkeydown="dicInputKey(event,this)" onkeyup="event.stopPropagation()" onkeypress="event.stopPropagation()"
                               onpaste="event.stopPropagation()" oninput="dicInputChanged(this)">
                        <button type="button" class="dic-clear" data-dic-action="clear" title="Effacer" aria-label="Effacer">✕</button>
                    </div>
                    <button type="button" class="dic-go" data-dic-action="go" title="Chercher ce mot">Chercher</button>
                    <span class="dic-recents"></span>
                </div>
            </div>
            <div class="dic-result"></div>
            <div class="dic-flash"></div>
        </div>
        <div class="dic-help" hidden${_DIC_STOP}>
            <div class="dic-help-card">
                <div class="dic-help-head">
                    <span>❓ Comment utiliser le dictionnaire</span>
                    <button type="button" class="dic-ib" data-dic-action="help-close" title="Fermer l'aide">✕</button>
                </div>
                <ul class="dic-help-list">
                    <li><b>Chercher un mot :</b> tape-le dans la barre, puis appuie sur <b>Entrée</b> ou sur <b>Chercher</b>.</li>
                    <li><b>Mots bleus :</b> un mot bleu dans une définition se cherche d'un simple clic. Pratique pour comprendre un mot difficile !</li>
                    <li><b>🔊 Écouter :</b> fait prononcer le mot par l'ordinateur.</li>
                    <li><b>Les natures :</b> chaque couleur indique la nature du mot (nom, verbe, adjectif…). Un mot peut en avoir plusieurs.</li>
                    <li><b>Voir plus :</b> seuls les premiers sens sont affichés ; le bouton « Voir … autres sens » montre tous les autres.</li>
                    <li><b>Synonymes et contraires :</b> clique sur l'un d'eux pour le chercher à son tour.</li>
                    <li><b>🕘 Historique :</b> retrouve les derniers mots cherchés, et efface-les si besoin.</li>
                    <li><b>A− / A+ :</b> rend le texte plus petit ou plus grand pour la projection.</li>
                    <li><b>Fenêtre :</b> tire la barre du haut pour déplacer le dictionnaire, le coin pour l'agrandir. Bouton jaune : réduire, vert : plein écran, rouge : fermer.</li>
                </ul>
                <div class="dic-help-note">Les définitions viennent du <b>Wiktionnaire</b>, le dictionnaire libre (connexion internet nécessaire). Les mots déjà cherchés restent consultables sans connexion.</div>
            </div>
        </div>
    </div>
</template>
`);

/* ── Outils ─────────────────────────────────────────────────────── */
const _dicEsc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function _dicLsGet(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }
function _dicLsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
const _dicNorm = s => String(s || '').trim().replace(/\s+/g, ' ');
const _dicKey  = s => _dicNorm(s).toLowerCase();

function _dicFlash(c, text, ms) {
    const f = c && c.querySelector('.dic-flash');
    if (!f) return;
    f.textContent = text;
    f.classList.remove('is-on'); void f.offsetWidth; f.classList.add('is-on');
    clearTimeout(f._t);
    f._t = setTimeout(() => f.classList.remove('is-on'), ms || 2000);
}
function _dicNudge(c, msg) {
    const field = c.querySelector('.dic-field');
    if (field) {
        field.classList.remove('is-bad'); void field.offsetWidth; field.classList.add('is-bad');
        clearTimeout(field._t);
        field._t = setTimeout(() => field.classList.remove('is-bad'), 1200);
    }
    if (msg) _dicFlash(c, msg);
    const input = c.querySelector('.dic-input');
    if (input) try { input.focus({ preventScroll: true }); } catch (e) {}
}
function _dicLaunch(c, url) {
    const api = window.electronAPI;
    if (api && typeof api.openExternal === 'function') { api.openExternal(url); return; }
    let w = null;
    try { w = window.open(url, '_blank'); } catch (e) {}
    if (!w) _dicFlash(c, '⚠ Le navigateur a bloqué l’ouverture : autorise les fenêtres pour ce site.', 4000);
}

/* ── Natures des mots (titres de sections du Wiktionnaire) ───────── */
const _DIC_POS = [
    ['Nom commun',   'nom',    'Nom commun'],
    ['Nom propre',   'nompr',  'Nom propre'],
    ['Adjectif',     'adj',    null],
    ['Verbe',        'verbe',  'Verbe'],
    ['Adverbe',      'adv',    'Adverbe'],
    ['Pronom',       'pron',   null],
    ['Préposition',  'prep',   'Préposition'],
    ['Conjonction',  'conj',   null],
    ['Interjection', 'interj', 'Interjection'],
    ['Onomatopée',   'interj', 'Onomatopée'],
    ['Déterminant',  'det',    null],
    ['Article',      'det',    null],
    ['Locution',     'loc',    null],
    ['Forme de',     'forme',  null],
    ['Préfixe',      'autre',  'Préfixe'],
    ['Suffixe',      'autre',  'Suffixe'],
    ['Symbole',      'autre',  'Symbole'],
    ['Lettre',       'autre',  'Lettre']
];
const _DIC_COLORS = {
    nom: '#e74c3c', nompr: '#c0392b', adj: '#2e86de', verbe: '#27ae60', adv: '#8e44ad',
    pron: '#e67e22', det: '#d35400', prep: '#16a085', conj: '#7f8c8d', interj: '#f39c12',
    loc: '#6c5ce7', forme: '#95a5a6', autre: '#636e72'
};
function _dicPosOf(title) {
    const t = title.replace(/\s*\d+\s*$/, '').trim();
    for (const [start, key, label] of _DIC_POS) {
        if (t.toLowerCase().startsWith(start.toLowerCase())) return { key, label: label || t };
    }
    return null;
}

/* ── Lecture de la page du Wiktionnaire ─────────────────────────── */
function _dicHeading(el) {
    let h = null;
    if (/^H[2-6]$/.test(el.tagName)) h = el;
    else if (el.classList && el.classList.contains('mw-heading')) h = el.querySelector('h2,h3,h4,h5,h6');
    if (!h) return null;
    return { level: +h.tagName[1], id: h.id || '', text: h.textContent.replace(/\s+/g, ' ').trim() };
}
// Texte d'une définition en HTML sûr : seuls restent les liens vers d'autres
// mots (cliquables), les étiquettes de domaine (Zoologie…), le gras et l'italique.
function _dicSafeHtml(node) {
    let out = '';
    node.childNodes.forEach(ch => {
        if (ch.nodeType === 3) { out += _dicEsc(ch.textContent); return; }
        if (ch.nodeType !== 1) return;
        const tag = ch.tagName;
        if (tag === 'A') {
            const href = ch.getAttribute('href') || '';
            const m = href.match(/^\/wiki\/([^#?]+)/);
            let target = '';
            try { target = m ? decodeURIComponent(m[1]).replace(/_/g, ' ') : ''; } catch (e) {}
            const txt = ch.textContent;
            if (target && target.indexOf(':') === -1 && txt.trim()) {
                out += `<span class="dic-link" data-dic-action="lookup" data-w="${_dicEsc(target)}" title="Chercher « ${_dicEsc(target)} »">${_dicEsc(txt)}</span>`;
            } else out += _dicEsc(txt);
        } else if (ch.classList.contains('term')) {
            out += `<span class="dic-label">${_dicEsc(ch.textContent)}</span>`;
        } else if (tag === 'B' || tag === 'STRONG') {
            out += '<b>' + _dicSafeHtml(ch) + '</b>';
        } else if (tag === 'I' || tag === 'EM') {
            out += '<i>' + _dicSafeHtml(ch) + '</i>';
        } else if (tag === 'BR') {
            out += ' ';
        } else {
            out += _dicSafeHtml(ch);
        }
    });
    return out;
}
const _dicCleanText = el => (el ? el.textContent : '').replace(/\s+/g, ' ').trim();

function _dicParse(html, title) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    doc.querySelectorAll('.mw-editsection, sup.reference, .reference, style, script, link, .mw-empty-elt, .sources').forEach(n => n.remove());
    const root = doc.querySelector('.mw-parser-output') || doc.body;
    const flat = [];
    (function walk(p) {
        Array.prototype.forEach.call(p.children, el => {
            if (el.tagName === 'SECTION') walk(el); else flat.push(el);
        });
    })(root);

    const res = { title, pron: '', pos: [], syn: [], ant: [], etym: '' };
    let inFr = false, cur = null, mode = null;
    const pushUnique = (arr, t) => {
        t = _dicNorm(t);
        if (t && t.length < 40 && t.toLowerCase() !== title.toLowerCase() &&
            !arr.some(x => x.toLowerCase() === t.toLowerCase())) arr.push(t);
    };

    for (const el of flat) {
        const h = _dicHeading(el);
        if (h) {
            if (h.level === 2) {
                if (inFr) break;                              // fin de la section Français
                inFr = h.id === 'Français' || /^Français\b/i.test(h.text);
                mode = null; cur = null;
                continue;
            }
            if (!inFr) continue;
            const pos = _dicPosOf(h.text);
            if (pos && h.level <= 4) {
                cur = { key: pos.key, label: pos.label, gender: '', defs: [], headDone: false };
                res.pos.push(cur);
                mode = 'pos';
                continue;
            }
            if (/^Étymologie/i.test(h.text))                 { mode = 'etym'; continue; }
            if (/^Synonymes/i.test(h.text))                  { mode = 'syn';  continue; }
            if (/^(Antonymes|Contraires)/i.test(h.text))     { mode = 'ant';  continue; }
            mode = null;
            continue;
        }
        if (!inFr || !mode) continue;

        if (mode === 'etym') {
            if (!res.etym && /^(DL|P|UL|OL)$/.test(el.tagName)) {
                const t = _dicCleanText(el);
                if (t && !/^\(Date à préciser\)$/.test(t)) res.etym = t.length > 420 ? t.slice(0, 417) + '…' : t;
            }
        } else if (mode === 'syn' || mode === 'ant') {
            if (el.tagName === 'UL') {
                el.querySelectorAll(':scope > li').forEach(li => {
                    const a = li.querySelector('a');
                    pushUnique(mode === 'syn' ? res.syn : res.ant, _dicCleanText(a || li));
                });
            }
        } else if (mode === 'pos' && cur) {
            if (el.tagName === 'P' && !cur.headDone) {
                cur.headDone = true;
                const api = el.querySelector('.API');
                if (api && !res.pron) res.pron = _dicCleanText(api);
                const g = Array.prototype.map.call(el.querySelectorAll('.ligne-de-forme'), _dicCleanText).filter(Boolean);
                cur.gender = g.join(', ');
            } else if (el.tagName === 'OL') {
                el.querySelectorAll(':scope > li').forEach(li => {
                    const clone = li.cloneNode(true);
                    let ex = '';
                    const exEl = clone.querySelector('ul .example, ul > li, dl dd');
                    if (exEl) {
                        exEl.querySelectorAll('.sources, .example-details, sup').forEach(n => n.remove());
                        const q = exEl.querySelector('q, i') || exEl;
                        ex = _dicCleanText(q).replace(/^[«"“\s]+|[»"”\s]+$/g, '');
                        if (ex.length > 230) ex = ex.slice(0, 227) + '…';
                    }
                    clone.querySelectorAll('ul, ol, dl').forEach(n => n.remove());
                    const html = _dicSafeHtml(clone).replace(/\s+/g, ' ').trim();
                    const plain = _dicCleanText(clone);
                    if (!plain || /^Définition manquante/i.test(plain)) return;
                    cur.defs.push({ html, ex });
                });
            }
        }
    }
    res.pos = res.pos.filter(p => p.defs.length).map(p => ({ key: p.key, label: p.label, gender: p.gender, defs: p.defs }));
    res.syn = res.syn.slice(0, 12);
    res.ant = res.ant.slice(0, 12);
    return res;
}

/* ── Accès au Wiktionnaire ──────────────────────────────────────── */
async function _dicFetchJson(params) {
    const url = DIC_API + '?' + new URLSearchParams(Object.assign({ format: 'json', formatversion: '2', origin: '*' }, params)).toString();
    const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), 12000) : null;
    try {
        const r = await fetch(url, ctrl ? { signal: ctrl.signal } : {});
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return await r.json();
    } finally { if (timer) clearTimeout(timer); }
}
async function _dicFetchWord(q) {
    const variants = [];
    [q, q.toLowerCase(), q.charAt(0).toLowerCase() + q.slice(1)].forEach(v => { if (v && variants.indexOf(v) === -1) variants.push(v); });
    for (const v of variants) {
        const j = await _dicFetchJson({ action: 'parse', page: v, prop: 'text', redirects: '1', disableeditsection: '1', disabletoc: '1' });
        if (!j || j.error || !j.parse || !j.parse.text) continue;
        const html = typeof j.parse.text === 'string' ? j.parse.text : (j.parse.text['*'] || '');
        const data = _dicParse(html, j.parse.title || v);
        if (data.pos.length) return data;
    }
    // Mot introuvable : propositions de mots proches
    let sugg = [];
    try {
        const s = await _dicFetchJson({ action: 'opensearch', search: q, limit: '8', namespace: '0' });
        if (Array.isArray(s) && Array.isArray(s[1])) {
            sugg = s[1].filter(t => t && t.toLowerCase() !== q.toLowerCase()).slice(0, 6);
        }
    } catch (e) {}
    return { notFound: true, q, sugg };
}

/* ── Mots déjà cherchés (consultables hors connexion) ───────────── */
function _dicCacheGet(q) {
    const cache = _dicLsGet(_DIC_LS_CACHE, {});
    const hit = cache && cache[_dicKey(q)];
    return hit && hit.d ? hit.d : null;
}
function _dicCachePut(q, data) {
    const cache = _dicLsGet(_DIC_LS_CACHE, {}) || {};
    const now = Date.now();
    cache[_dicKey(q)] = { t: now, d: data };
    if (data.title) cache[_dicKey(data.title)] = { t: now, d: data };
    const keys = Object.keys(cache).sort((a, b) => (cache[b].t || 0) - (cache[a].t || 0));
    keys.slice(_DIC_CACHE_MAX).forEach(k => delete cache[k]);
    _dicLsSet(_DIC_LS_CACHE, cache);
}

/* ── Affichage ──────────────────────────────────────────────────── */
function _dicChip(word, cls) {
    return `<button type="button" class="dic-chip${cls ? ' ' + cls : ''}" data-dic-action="lookup" data-w="${_dicEsc(word)}">${_dicEsc(word)}</button>`;
}
function _dicRenderWelcome(c) {
    const res = c.querySelector('.dic-result');
    if (!res) return;
    res.innerHTML = `
        <div class="dic-card dic-welcome">
            <div class="dic-welcome-ico">📖</div>
            <div class="dic-welcome-t">Quel mot veux-tu découvrir ?</div>
            <div class="dic-welcome-s">Tape un mot dans la barre, ou essaie :</div>
            <div class="dic-chips">${_DIC_EXAMPLES.map(w => _dicChip(w)).join('')}</div>
        </div>`;
    res.scrollTop = 0;
}
function _dicRenderLoading(c, q) {
    const res = c.querySelector('.dic-result');
    if (res) res.innerHTML = `<div class="dic-card dic-msg"><div class="dic-spin"></div><div class="dic-msg-t">Je cherche « ${_dicEsc(q)} »…</div></div>`;
}
function _dicRenderMsg(c, ico, title, text, sugg) {
    const res = c.querySelector('.dic-result');
    if (!res) return;
    res.innerHTML = `
        <div class="dic-card dic-msg">
            <div class="dic-msg-ico">${ico}</div>
            <div class="dic-msg-t">${title}</div>
            ${text ? `<div class="dic-msg-s">${text}</div>` : ''}
            ${sugg && sugg.length ? `<div class="dic-msg-s">Voulais-tu dire :</div><div class="dic-chips">${sugg.map(w => _dicChip(w)).join('')}</div>` : ''}
        </div>`;
    res.scrollTop = 0;
}
function _dicRenderEntry(c, d) {
    const res = c.querySelector('.dic-result');
    if (!res) return;
    const posHtml = d.pos.map(p => {
        const color = _DIC_COLORS[p.key] || _DIC_COLORS.autre;
        const defs = p.defs.map((df, j) =>
            `<li class="${j >= _DIC_DEFS_SHOWN ? 'dic-def-extra' : ''}">` +
            `<span class="dic-def">${df.html}</span>` +
            (df.ex ? `<div class="dic-ex">« ${_dicEsc(df.ex)} »</div>` : '') +
            `</li>`).join('');
        const extra = p.defs.length - _DIC_DEFS_SHOWN;
        const more = extra > 0
            ? `<button type="button" class="dic-more" data-dic-action="more" data-n="${extra}">Voir ${extra} autre${extra > 1 ? 's' : ''} sens ▾</button>`
            : '';
        return `<section class="dic-pos" style="--c:${color}">
                    <div class="dic-pos-head"><span class="dic-pos-tag">${_dicEsc(p.label)}</span>${p.gender ? `<span class="dic-gender">${_dicEsc(p.gender)}</span>` : ''}</div>
                    <ol class="dic-defs">${defs}</ol>${more}
                </section>`;
    }).join('');
    const rel = (label, ico, list) => list && list.length
        ? `<div class="dic-rel"><div class="dic-rel-t">${ico} ${label}</div><div class="dic-chips">${list.map(w => _dicChip(w)).join('')}</div></div>`
        : '';
    res.innerHTML = `
        <div class="dic-card dic-entry">
            <div class="dic-head">
                <div class="dic-head-l">
                    <div class="dic-word">${_dicEsc(d.title)}</div>
                    ${d.pron ? `<div class="dic-pron" title="Prononciation">${_dicEsc(d.pron)}</div>` : ''}
                </div>
                <div class="dic-head-r">
                    <button type="button" class="dic-act" data-dic-action="speak" title="Écouter le mot">🔊 Écouter</button>
                    <button type="button" class="dic-act dic-act-ghost" data-dic-action="open-wikt" title="Ouvrir la page du Wiktionnaire dans un nouvel onglet">Wiktionnaire ↗</button>
                </div>
            </div>
            ${posHtml}
            ${rel('Synonymes', '🟰', d.syn)}
            ${rel('Contraires', '↔️', d.ant)}
            ${d.etym ? `<details class="dic-etym"><summary>📜 D'où vient ce mot ?</summary><div class="dic-etym-t">${_dicEsc(d.etym)}</div></details>` : ''}
        </div>`;
    res.scrollTop = 0;
}

/* ── Recherche ──────────────────────────────────────────────────── */
async function _dicLookup(c, raw, opts) {
    opts = opts || {};
    const q = _dicNorm(raw);
    const input = c.querySelector('.dic-input');
    if (!q) { _dicNudge(c, 'Tape d’abord un mot'); return; }
    if (input && input.value !== q) { input.value = q; dicInputChanged(input); }
    _dicMenuClose(c);
    const req = c._dicReq = (c._dicReq || 0) + 1;

    let data = _dicCacheGet(q);
    if (!data) {
        if (navigator.onLine === false) {
            _dicRenderMsg(c, '📡', 'Pas de connexion internet',
                'Le dictionnaire a besoin d’internet pour trouver un nouveau mot. Les mots déjà cherchés restent consultables.');
            return;
        }
        _dicRenderLoading(c, q);
        try { data = await _dicFetchWord(q); }
        catch (e) {
            if (req !== c._dicReq) return;
            _dicRenderMsg(c, '⚠️', 'Le dictionnaire ne répond pas',
                'Vérifie la connexion internet, puis réessaie dans un moment.');
            return;
        }
    }
    if (req !== c._dicReq || !document.contains(c)) return;

    if (data.notFound) {
        c._dicWord = '';
        _dicRenderMsg(c, '🤔', `Je ne trouve pas « ${_dicEsc(q)} »`,
            'Vérifie l’orthographe, ou essaie le mot au singulier ou à l’infinitif.', data.sugg);
    } else {
        _dicCachePut(q, data);
        c._dicWord = data.title;
        _dicRenderEntry(c, data);
        if (!opts.noRecent) _dicAddRecent(data.title);
    }
    if (!opts.silent && typeof saveBoard === 'function') try { saveBoard(); } catch (e) {}
}

function _dicSpeak(c) {
    const word = c._dicWord;
    if (!word) return;
    if (!('speechSynthesis' in window)) { _dicFlash(c, '🔇 La lecture à voix haute n’est pas disponible ici'); return; }
    try {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(word);
        u.lang = 'fr-FR'; u.rate = 0.85;
        const fr = speechSynthesis.getVoices().find(v => /^fr(-|_|$)/i.test(v.lang));
        if (fr) u.voice = fr;
        speechSynthesis.speak(u);
    } catch (e) { _dicFlash(c, '🔇 Lecture impossible'); }
}

/* ── Taille du texte ────────────────────────────────────────────── */
function _dicSetFs(c, fs) {
    fs = Math.max(0.8, Math.min(1.8, Math.round(fs * 10) / 10));
    c._dicFs = fs;
    c.style.setProperty('--dic-fs', fs);
}

/* ── Dernières recherches ───────────────────────────────────────── */
const _dicRecentList = () => _dicLsGet(_DIC_LS_RECENT, []).filter(x => typeof x === 'string').slice(0, _DIC_RECENT_MAX);
function _dicRenderAll() { document.querySelectorAll('.dic-w').forEach(_dicRenderRecents); }
function _dicAddRecent(q) {
    const list = _dicRecentList().filter(x => x.toLowerCase() !== q.toLowerCase());
    list.unshift(q);
    _dicLsSet(_DIC_LS_RECENT, list.slice(0, _DIC_RECENT_MAX));
    _dicRenderAll();
}
function _dicRenderRecents(c) {
    const box = c.querySelector('.dic-recents');
    if (!box) return;
    const list = _dicRecentList();
    const open = !!c.querySelector('.dic-menu');
    box.innerHTML = list.length
        ? `<button type="button" class="dic-hist-btn${open ? ' is-open' : ''}" data-dic-action="hist-toggle" aria-haspopup="true" aria-expanded="${open}" title="Dernières recherches">🕘 <span class="dic-hist-n">${list.length}</span> <span class="dic-hist-caret">▾</span></button>`
        : '';
    if (open) { if (list.length) _dicMenuBuild(c); else _dicMenuClose(c); }
}
function _dicMenuBuild(c) {
    let m = c.querySelector('.dic-menu');
    if (!m) {
        m = document.createElement('div');
        m.className = 'dic-menu';
        m.setAttribute('role', 'menu');
        ['pointerdown', 'mousedown', 'touchstart'].forEach(t => m.addEventListener(t, ev => ev.stopPropagation()));
        c.appendChild(m);
    }
    m.innerHTML = '<div class="dic-menu-t">Dernières recherches</div><div class="dic-menu-list">' + _dicRecentList().map(q =>
        `<div class="dic-mi" role="menuitem" data-dic-action="lookup" data-w="${_dicEsc(q)}" title="Chercher « ${_dicEsc(q)} »">` +
        `<span class="dic-mi-t">${_dicEsc(q)}</span>` +
        `<button type="button" class="dic-mi-x" data-dic-action="recent-del" data-w="${_dicEsc(q)}" title="Retirer de l’historique" aria-label="Retirer">✕</button></div>`).join('') +
        '</div><button type="button" class="dic-menu-clear" data-dic-action="hist-clear">🗑 Effacer tout l’historique</button>';
    _dicMenuPlace(c, m);
}
// Place le menu sous le bouton (ou au-dessus s'il manque de place)
function _dicMenuPlace(c, m) {
    const btn = c.querySelector('.dic-hist-btn');
    if (!btn) return;
    const cr = c.getBoundingClientRect(), br = btn.getBoundingClientRect();
    const s = (c.offsetHeight && cr.height / c.offsetHeight) || 1;
    const H = c.offsetHeight, W = c.offsetWidth;
    const bTop = (br.top - cr.top) / s, bBot = (br.bottom - cr.top) / s;
    const bRight = (br.right - cr.left) / s;
    const w = Math.min(260, W - 16);
    m.style.width = w + 'px';
    m.style.left = Math.max(8, Math.min(W - w - 8, bRight - w)) + 'px';
    const below = H - bBot - 8, above = bTop - 48;
    m.style.top = m.style.bottom = '';
    if (below >= 150 || below >= above) {
        m.style.top = (bBot + 4) + 'px';
        m.style.maxHeight = Math.max(90, below - 4) + 'px';
    } else {
        m.style.bottom = (H - bTop + 4) + 'px';
        m.style.maxHeight = Math.max(90, above) + 'px';
    }
}
function _dicMenuClose(c) {
    const m = c && c.querySelector('.dic-menu');
    if (m) m.remove();
    const b = c && c.querySelector('.dic-hist-btn');
    if (b) { b.classList.remove('is-open'); b.setAttribute('aria-expanded', 'false'); }
}
function _dicMenuToggle(c) {
    if (c.querySelector('.dic-menu')) { _dicMenuClose(c); return; }
    document.querySelectorAll('.dic-w').forEach(o => { if (o !== c) _dicMenuClose(o); });
    _dicMenuBuild(c);
    const b = c.querySelector('.dic-hist-btn');
    if (b) { b.classList.add('is-open'); b.setAttribute('aria-expanded', 'true'); }
}
// Clic ailleurs ou Échap : on ferme le menu (et l'aide avec Échap)
document.addEventListener('pointerdown', e => {
    const t = e.target;
    if (t && t.closest && (t.closest('.dic-menu') || t.closest('.dic-hist-btn'))) return;
    document.querySelectorAll('.dic-w .dic-menu').forEach(m => _dicMenuClose(m.closest('.dic-w')));
}, true);
document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.dic-w .dic-menu').forEach(m => _dicMenuClose(m.closest('.dic-w')));
    document.querySelectorAll('.dic-w .dic-help:not([hidden])').forEach(h => { h.hidden = true; });
}, true);

/* ── Saisie ─────────────────────────────────────────────────────── */
function dicInputKey(e, input) {
    e.stopPropagation();                       // pas de raccourcis du tableau pendant la saisie
    if (e.key === 'Enter') { e.preventDefault(); _dicLookup(input.closest('.editor-container'), input.value); }
    else if (e.key === 'Escape') input.blur();
}
function dicInputChanged(input) {
    const field = input.closest('.dic-field');
    if (field) { field.classList.toggle('has-text', !!input.value.trim()); field.classList.remove('is-bad'); }
    if (input.value) input.setAttribute('value', input.value); else input.removeAttribute('value');
}

/* ── Clics (délégués : survivent à la sauvegarde / restauration) ─── */
document.addEventListener('click', e => {
    const btn = e.target.closest && e.target.closest('[data-dic-action]');
    if (!btn) return;
    const c = btn.closest('.dic-w');
    if (!c) return;
    const input = c.querySelector('.dic-input');
    switch (btn.getAttribute('data-dic-action')) {
        case 'go':     _dicLookup(c, input ? input.value : ''); break;
        case 'lookup': _dicLookup(c, btn.getAttribute('data-w') || ''); break;
        case 'clear':  input.value = ''; dicInputChanged(input); input.focus(); break;
        case 'speak':  _dicSpeak(c); break;
        case 'open-wikt':
            if (c._dicWord) _dicLaunch(c, DIC_WIKT + encodeURIComponent(c._dicWord.replace(/ /g, '_')));
            break;
        case 'more': {
            const sec = btn.closest('.dic-pos');
            if (!sec) break;
            const all = sec.classList.toggle('is-all');
            const n = +btn.getAttribute('data-n') || 0;
            btn.textContent = all ? 'Voir moins ▴' : `Voir ${n} autre${n > 1 ? 's' : ''} sens ▾`;
            break;
        }
        case 'font-down': _dicSetFs(c, (c._dicFs || 1) - 0.1); if (typeof saveBoard === 'function') try { saveBoard(); } catch (err) {} break;
        case 'font-up':   _dicSetFs(c, (c._dicFs || 1) + 0.1); if (typeof saveBoard === 'function') try { saveBoard(); } catch (err) {} break;
        case 'help': {
            const h = c.querySelector('.dic-help');
            if (h) h.hidden = !h.hidden;
            _dicMenuClose(c);
            break;
        }
        case 'help-close': { const h = c.querySelector('.dic-help'); if (h) h.hidden = true; break; }
        case 'hist-toggle': _dicMenuToggle(c); break;
        case 'recent-del': {
            e.stopPropagation();
            const q = btn.getAttribute('data-w');
            _dicLsSet(_DIC_LS_RECENT, _dicRecentList().filter(x => x !== q));
            _dicRenderAll();
            break;
        }
        case 'hist-clear':
            _dicLsSet(_DIC_LS_RECENT, []);
            document.querySelectorAll('.dic-w').forEach(_dicMenuClose);
            _dicRenderAll();
            _dicFlash(c, '🗑 Historique effacé');
            break;
    }
});

/* ── Déplacement du widget en tirant la barre de titre ───────────── */
function _dicDragStart(e) {
    const bar = e.currentTarget, c = bar.closest('.dic-w');
    if (!c || (e.button !== undefined && e.button !== 0)) return;
    if (e.target.closest('button, .wf-btns, .dic-tools, input')) return;
    e.stopPropagation();                                    // le tableau ne gère pas ce glisser
    if (c.classList.contains('wf-media-fullboard')) return; // pas de déplacement en plein écran
    e.preventDefault();
    _dicMenuClose(c);
    const w = c.closest('.widget') || c;
    const cs = getComputedStyle(w);
    if (cs.position === 'static') w.style.position = 'absolute';
    const r = w.getBoundingClientRect();
    const sx = (w.offsetWidth && r.width / w.offsetWidth) || 1;
    const sy = (w.offsetHeight && r.height / w.offsetHeight) || 1;
    const L0 = parseFloat(cs.left) || w.offsetLeft || 0, T0 = parseFloat(cs.top) || w.offsetTop || 0;
    const X0 = e.clientX, Y0 = e.clientY;
    let moved = false;
    try { bar.setPointerCapture(e.pointerId); } catch (err) {}
    bar.classList.add('is-dragging');
    const move = ev => {
        const dx = (ev.clientX - X0) / sx, dy = (ev.clientY - Y0) / sy;
        if (!moved) {
            if (Math.abs(dx) < 3 && Math.abs(dy) < 3) return;
            moved = true;
            if (typeof snapshotNow === 'function') try { snapshotNow(); } catch (err) {}
        }
        w.style.left = (L0 + dx) + 'px';
        w.style.top = (T0 + dy) + 'px';
    };
    const end = () => {
        bar.removeEventListener('pointermove', move);
        bar.removeEventListener('pointerup', end);
        bar.removeEventListener('pointercancel', end);
        bar.classList.remove('is-dragging');
        if (moved && typeof saveBoard === 'function') try { saveBoard(); } catch (err) {}
    };
    bar.addEventListener('pointermove', move);
    bar.addEventListener('pointerup', end);
    bar.addEventListener('pointercancel', end);
}
function _dicBindDrag(c) {
    const bar = c.querySelector('.dic-bar');
    if (!bar || bar._dicDrag) return;
    bar._dicDrag = true;
    bar.addEventListener('pointerdown', _dicDragStart);
    ['mousedown', 'touchstart'].forEach(t => bar.addEventListener(t, ev => {
        if (!ev.target.closest('button, .wf-btns')) ev.stopPropagation();
    }));
}

/* ── Mise en route des widgets (nouveaux ou restaurés) ───────────── */
function _dicInit(c) {
    if (!c || c._dicInited || !c.classList.contains('dic-w')) return;
    c._dicInited = true;
    const bar = c.querySelector('.dic-bar');
    if (bar) { bar.classList.add('editor-toolbar'); bar.title = 'Glisser pour déplacer'; }
    c.querySelectorAll('.dic-menu').forEach(m => m.remove());
    const help = c.querySelector('.dic-help');
    if (help) help.hidden = true;
    const input = c.querySelector('.dic-input');
    if (input) dicInputChanged(input);
    _dicSetFs(c, c._dicFs || 1);
    const res = c.querySelector('.dic-result');
    if (res && !res.children.length) _dicRenderWelcome(c);
    _dicBindDrag(c);
    _dicRenderRecents(c);
    new MutationObserver(() => _dicFitFullboard(c)).observe(c, { attributes: true, attributeFilter: ['class'] });
    _dicFitFullboard(c);
}

/* ── Plein écran sur téléphone : laisser la place des onglets À GAUCHE ──
   Même principe que Qwant Junior : les onglets latéraux occupent 40 px à
   gauche ; le plein écran commence donc à 40 px du bord et va jusqu'au bord
   droit, avec correction si le tableau est décalé ou mis à l'échelle. */
const _DIC_PHONE_Q = '(max-width: 768px), (max-height: 500px) and (pointer: coarse)';
const _DIC_TABS_W = 40;
const _DIC_FS_PROPS = ['position', 'inset', 'top', 'right', 'bottom', 'left', 'width', 'height', 'max-width', 'max-height', 'margin', 'transform'];
function _dicIsPhone() {
    if (typeof window.isPhoneScreen === 'function') return window.isPhoneScreen();
    return !!(window.matchMedia && window.matchMedia(_DIC_PHONE_Q).matches);
}
function _dicFitFullboard(c) {
    const on = c.classList.contains('wf-media-fullboard') && _dicIsPhone();
    if (!on) { _dicUnfit(c); return; }
    if (c._dicFsBusy) return;
    c._dicFsBusy = true;
    if (!c._dicFsFitted) {
        c._dicFsSaved = {};
        _DIC_FS_PROPS.forEach(p => { c._dicFsSaved[p] = [c.style.getPropertyValue(p), c.style.getPropertyPriority(p)]; });
    }
    c._dicFsMine = c._dicFsMine || {};
    const set = (p, v) => { c.style.setProperty(p, v, 'important'); c._dicFsMine[p] = c.style.getPropertyValue(p); };
    const vw = window.innerWidth, vh = window.innerHeight;
    set('position', 'fixed'); set('inset', 'auto'); set('margin', '0'); set('transform', 'none');
    set('top', '0px'); set('left', _DIC_TABS_W + 'px');
    set('right', 'auto'); set('bottom', 'auto');
    set('width', (vw - _DIC_TABS_W) + 'px'); set('height', vh + 'px');
    set('max-width', 'none'); set('max-height', 'none');
    c._dicFsFitted = true;
    const r = c.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
        const sx = r.width / (vw - _DIC_TABS_W), sy = r.height / vh;
        const left = _DIC_TABS_W + (_DIC_TABS_W - r.left) / sx;
        const top  = (0 - r.top) / sy;
        if (Math.abs(r.left - _DIC_TABS_W) > 1 || Math.abs(sx - 1) > 0.01) {
            set('left', left + 'px');
            set('width', ((vw - _DIC_TABS_W) / sx) + 'px');
        }
        if (Math.abs(r.top) > 1 || Math.abs(sy - 1) > 0.01) {
            set('top', top + 'px');
            set('height', (vh / sy) + 'px');
        }
    }
    c._dicFsBusy = false;
}
function _dicUnfit(c) {
    if (!c._dicFsFitted) return;
    const saved = c._dicFsSaved || {}, mine = c._dicFsMine || {};
    _DIC_FS_PROPS.forEach(p => {
        if (!(p in mine) || c.style.getPropertyValue(p) !== mine[p]) return;
        const v = saved[p];
        if (v && v[0]) c.style.setProperty(p, v[0], v[1]); else c.style.removeProperty(p);
    });
    c._dicFsFitted = false; c._dicFsMine = {}; c._dicFsSaved = null;
}
window.addEventListener('resize', () => document.querySelectorAll('.dic-w.wf-media-fullboard').forEach(c => {
    _dicUnfit(c);
    _dicFitFullboard(c);
}));

function _dicScan(n) {
    if (!n || n.nodeType !== 1) return;
    if (n.matches('.dic-w')) _dicInit(n);
    else if (n.querySelectorAll) n.querySelectorAll('.dic-w').forEach(_dicInit);
}
new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => {
    if (n.nodeType === 1 && n.closest && n.closest('.dic-stage, .dic-bar, .dic-help')) return;
    _dicScan(n);
}))).observe(document.body, { childList: true, subtree: true });

/* ── Sauvegarde / restauration (appelées par save-load.js) ──────── */
window.dicGetData = function (widget) {
    const c = widget && widget.querySelector('.dic-w');
    if (!c) return null;
    const input = c.querySelector('.dic-input');
    return {
        word:  c._dicWord || '',
        query: input ? input.value : '',
        fs:    c._dicFs || 1
    };
};
window.dicSetData = function (widget, d) {
    const c = widget && widget.querySelector('.dic-w');
    if (!c || !d) return;
    _dicInit(c);                                  // l'init normale passe par un observateur (asynchrone)
    if (d.fs) _dicSetFs(c, +d.fs || 1);
    const input = c.querySelector('.dic-input');
    if (input && (d.word || d.query)) { input.value = d.word || d.query; dicInputChanged(input); }
    // On attend que le widget soit posé sur le tableau avant de réafficher le mot
    if (d.word) setTimeout(() => _dicLookup(c, d.word, { silent: true, noRecent: true }), 80);
};

window.createDictionnaireWidget = function () {
    return typeof createWidget === 'function' ? createWidget('dictionnaire') : null;
};

/* ── Styles ─────────────────────────────────────────────────────── */
(function () {
    if (document.getElementById('dic-styles')) return;
    const st = document.createElement('style');
    st.id = 'dic-styles';
    st.textContent = `
.editor-container.dic-w{
  --dic-accent:#14a3a0; --dic-accent-2:#4a90e2; --dic-fs:1;
  container-type:inline-size; position:relative; display:flex; flex-direction:column;
  overflow:hidden; box-sizing:border-box; padding:0; background:#18181c; color:#eee;
  font-family:system-ui,-apple-system,"Segoe UI",sans-serif; font-size:13px;
}
.dic-w button{font-family:inherit}
.dic-w :focus-visible{outline:2px solid var(--dic-accent);outline-offset:2px}
/* Barre du haut */
.dic-w .dic-bar{flex:none;position:relative;z-index:10;height:40px;min-height:0;box-sizing:border-box;display:flex;flex-wrap:nowrap;align-items:center;gap:6px;
  padding:0 10px;background:#232329;border-bottom:1px solid #2f2f37;visibility:visible;opacity:1;user-select:none;-webkit-user-select:none}
.dic-w .dic-bar-title{flex:1;min-width:0;font-weight:700;font-size:13px;color:#e6e6ea;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dic-w .dic-tools{flex:none;display:flex;align-items:center;gap:2px;margin-right:4px}
.dic-w .dic-ib{flex:none;min-width:30px;height:30px;border:0;border-radius:8px;background:transparent;color:#9a9aa6;
  font-size:13px;font-weight:800;line-height:1;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;padding:0 6px}
.dic-w .dic-ib:hover{background:rgba(255,255,255,.1);color:#fff}
.dic-w .dic-ib-help{width:26px;min-width:26px;height:26px;border-radius:50%;background:rgba(20,163,160,.22);color:#7fe0dc;margin-left:2px}
.dic-w .dic-ib-help:hover{background:var(--dic-accent);color:#fff}
/* Zone principale */
.dic-w .dic-stage{position:relative;flex:1;min-height:0;display:flex;flex-direction:column;
  background:radial-gradient(circle at 12% 10%,rgba(20,163,160,.38),transparent 45%),radial-gradient(circle at 88% 95%,rgba(74,144,226,.42),transparent 50%),#1b1d2b}
.dic-w .dic-top{flex:none;padding:14px 16px 10px}
.dic-w .dic-search{display:flex;align-items:center;gap:8px;max-width:640px;margin:0 auto}
.dic-w .dic-field{flex:1;min-width:0;display:flex;align-items:center;height:clamp(42px,8cqw,52px);box-sizing:border-box;padding:0 6px 0 14px;
  background:#fff;border:3px solid transparent;border-radius:99px;box-shadow:0 6px 20px rgba(0,0,0,.35);transition:border-color .15s}
.dic-w .dic-field:focus-within{border-color:var(--dic-accent)}
.dic-w .dic-field.is-bad{border-color:#ff5f57;animation:dic-shake .3s}
@keyframes dic-shake{25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
.dic-w .dic-field-ico{flex:none;font-size:18px;margin-right:8px}
.dic-w .dic-input{flex:1;min-width:0;height:100%;border:0;outline:0;background:transparent;color:#222;font:inherit;
  font-size:clamp(16px,3.4cqw,21px);padding:0;user-select:text;-webkit-user-select:text}
.dic-w .dic-input::placeholder{color:#9a9aa6}
.dic-w .dic-clear{display:none;flex:none;width:30px;height:30px;border:0;border-radius:50%;background:transparent;color:#999;
  font-size:13px;align-items:center;justify-content:center;padding:0}
.dic-w .dic-clear:hover{background:#eee;color:#333}
.dic-w .dic-field.has-text .dic-clear{display:inline-flex}
.dic-w .dic-go{flex:none;height:clamp(42px,8cqw,52px);border:0;border-radius:99px;padding:0 20px;color:#fff;font-size:15px;font-weight:800;
  background:linear-gradient(90deg,var(--dic-accent),#2c8fd6);box-shadow:0 4px 14px rgba(20,163,160,.45)}
.dic-w .dic-go:hover{filter:brightness(1.1)}
.dic-w .dic-recents{flex:none;display:flex}
.dic-w .dic-recents:empty{display:none}
.dic-w .dic-hist-btn{height:clamp(42px,8cqw,52px);border:0;border-radius:99px;padding:0 12px;background:rgba(255,255,255,.14);color:#fff;font-size:13px;font-weight:700;white-space:nowrap}
.dic-w .dic-hist-btn:hover,.dic-w .dic-hist-btn.is-open{background:rgba(255,255,255,.26)}
.dic-w .dic-hist-caret{display:inline-block;transition:transform .15s}
.dic-w .dic-hist-btn.is-open .dic-hist-caret{transform:rotate(180deg)}
/* Résultat */
.dic-w .dic-result{flex:1;min-height:0;overflow:auto;padding:4px 16px 16px;-webkit-overflow-scrolling:touch}
.dic-w .dic-card{max-width:720px;margin:0 auto;box-sizing:border-box;background:#fffdf7;color:#2a2a33;border-radius:16px;
  box-shadow:0 8px 26px rgba(0,0,0,.35);padding:16px 18px;font-size:calc(15px * var(--dic-fs));line-height:1.45}
.dic-w .dic-welcome,.dic-w .dic-msg{text-align:center;padding:26px 18px}
.dic-w .dic-welcome-ico,.dic-w .dic-msg-ico{font-size:calc(40px * var(--dic-fs));line-height:1;margin-bottom:8px}
.dic-w .dic-welcome-t,.dic-w .dic-msg-t{font-size:1.35em;font-weight:800;color:#1f2a44}
.dic-w .dic-welcome-s,.dic-w .dic-msg-s{color:#6b6b78;margin-top:8px;font-size:.92em}
.dic-w .dic-spin{width:34px;height:34px;margin:0 auto 12px;border-radius:50%;border:4px solid #d9eceb;border-top-color:var(--dic-accent);animation:dic-spin .8s linear infinite}
@keyframes dic-spin{to{transform:rotate(360deg)}}
.dic-w .dic-chips{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-top:10px}
.dic-w .dic-chip{border:0;border-radius:99px;padding:6px 14px;background:#e6f5f4;color:#0f6f6c;font-size:.9em;font-weight:700}
.dic-w .dic-chip:hover{background:var(--dic-accent);color:#fff}
.dic-w .dic-head{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:10px;padding-bottom:10px;margin-bottom:6px;border-bottom:2px solid #efe9da}
.dic-w .dic-head-l{min-width:0}
.dic-w .dic-word{font-size:2em;font-weight:900;color:#1f2a44;line-height:1.1;word-break:break-word}
.dic-w .dic-pron{color:#7a7a88;font-size:.95em;margin-top:2px}
.dic-w .dic-head-r{display:flex;flex-wrap:wrap;gap:6px}
.dic-w .dic-act{height:34px;border:0;border-radius:99px;padding:0 14px;background:var(--dic-accent);color:#fff;font-size:13px;font-weight:700}
.dic-w .dic-act:hover{filter:brightness(1.1)}
.dic-w .dic-act-ghost{background:#eef1f6;color:#3d4a66}
.dic-w .dic-act-ghost:hover{background:#dfe5ef;filter:none}
.dic-w .dic-pos{margin-top:14px}
.dic-w .dic-pos-head{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:4px}
.dic-w .dic-pos-tag{display:inline-block;padding:3px 12px;border-radius:99px;background:var(--c);color:#fff;font-weight:800;font-size:.85em}
.dic-w .dic-gender{color:#7a7a88;font-style:italic;font-size:.9em}
.dic-w .dic-defs{margin:4px 0 0;padding-left:1.6em}
.dic-w .dic-defs > li{margin:6px 0;padding-left:2px}
.dic-w .dic-defs > li::marker{color:var(--c);font-weight:800}
.dic-w .dic-def-extra{display:none}
.dic-w .dic-pos.is-all .dic-def-extra{display:list-item}
.dic-w .dic-label{display:inline-block;margin-right:4px;padding:0 7px;border-radius:6px;background:#f1eee4;color:#6b6352;font-size:.78em;font-style:italic}
.dic-w .dic-link{color:#1d6fd1;font-weight:600;border-bottom:1px dashed rgba(29,111,209,.45)}
.dic-w .dic-link:hover{color:#0b4ea2;border-bottom-style:solid}
.dic-w .dic-ex{margin-top:3px;padding:4px 10px;border-left:3px solid var(--c);background:rgba(0,0,0,.03);border-radius:0 8px 8px 0;color:#555566;font-style:italic;font-size:.92em}
.dic-w .dic-more{margin:2px 0 0 1.6em;border:0;background:transparent;color:var(--c);font-weight:800;font-size:.88em;padding:4px 0}
.dic-w .dic-more:hover{text-decoration:underline}
.dic-w .dic-rel{margin-top:16px}
.dic-w .dic-rel-t{font-weight:800;color:#1f2a44}
.dic-w .dic-rel .dic-chips{justify-content:flex-start;margin-top:6px}
.dic-w .dic-etym{margin-top:16px;border-radius:10px;background:#f6f2e6;padding:8px 12px}
.dic-w .dic-etym summary{font-weight:800;color:#5a4f33}
.dic-w .dic-etym-t{margin-top:6px;color:#5a5a66;font-size:.92em}
/* Menu déroulant de l'historique */
.dic-w .dic-menu{position:absolute;z-index:12;display:flex;flex-direction:column;box-sizing:border-box;padding:6px;border-radius:12px;
  background:#26262f;border:1px solid #3a3a46;box-shadow:0 10px 30px rgba(0,0,0,.5);text-align:left}
.dic-w .dic-menu-t{flex:none;padding:4px 10px 6px;color:#9a9aa6;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px}
.dic-w .dic-menu-list{flex:1;min-height:0;overflow:auto}
.dic-w .dic-mi{display:flex;align-items:center;gap:6px;height:32px;padding:0 4px 0 10px;border-radius:8px;color:#eee;font-size:13px}
.dic-w .dic-mi:hover{background:rgba(255,255,255,.1)}
.dic-w .dic-mi-t{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dic-w .dic-mi-x{flex:none;width:24px;height:24px;border:0;border-radius:50%;background:transparent;color:#9a9aa6;font-size:10px;
  display:inline-flex;align-items:center;justify-content:center;padding:0}
.dic-w .dic-mi-x:hover{background:#c0392b;color:#fff}
.dic-w .dic-menu-clear{flex:none;margin-top:6px;height:32px;border:0;border-top:1px solid #3a3a46;border-radius:0 0 8px 8px;background:transparent;
  color:#ff8a80;font-size:12.5px;font-weight:600}
.dic-w .dic-menu-clear:hover{background:rgba(255,95,87,.15)}
/* Aide */
.dic-w .dic-help{position:absolute;left:0;right:0;top:40px;bottom:0;z-index:14;display:flex;align-items:flex-start;justify-content:center;
  padding:14px;box-sizing:border-box;overflow:auto;background:rgba(10,10,20,.6)}
.dic-w .dic-help[hidden]{display:none}
.dic-w .dic-help-card{width:100%;max-width:560px;box-sizing:border-box;background:#fffdf7;color:#2a2a33;border-radius:16px;padding:12px 16px 14px;box-shadow:0 10px 30px rgba(0,0,0,.45)}
.dic-w .dic-help-head{display:flex;align-items:center;justify-content:space-between;gap:8px;font-weight:800;font-size:15px;color:#1f2a44;margin-bottom:6px}
.dic-w .dic-help-head .dic-ib{color:#666}
.dic-w .dic-help-head .dic-ib:hover{background:#eee;color:#222}
.dic-w .dic-help-list{margin:0;padding-left:18px;font-size:13px;line-height:1.5}
.dic-w .dic-help-list li{margin:4px 0}
.dic-w .dic-help-note{margin-top:10px;padding:8px 10px;border-radius:10px;background:#e6f5f4;color:#0f5f5c;font-size:12px}
/* Curseurs */
.editor-container.dic-w,.editor-container.dic-w *{cursor:default!important}
.dic-w .dic-stage,.dic-w .dic-stage *,.dic-w .dic-menu,.dic-w .dic-bar-title,.dic-w .dic-help{user-select:none;-webkit-user-select:none}
.editor-container.dic-w .dic-bar,.editor-container.dic-w .dic-bar .dic-bar-title{cursor:grab!important;touch-action:none}
.editor-container.dic-w .dic-bar.is-dragging,.editor-container.dic-w .dic-bar.is-dragging *{cursor:grabbing!important}
.editor-container.dic-w.wf-media-fullboard .dic-bar,.editor-container.dic-w.wf-media-fullboard .dic-bar-title{cursor:default!important}
.editor-container.dic-w button,.editor-container.dic-w button *,.editor-container.dic-w .dic-mi,.editor-container.dic-w .dic-mi *,
.editor-container.dic-w .dic-link,.editor-container.dic-w summary{cursor:pointer!important}
.editor-container.dic-w .dic-input{cursor:text!important;user-select:text;-webkit-user-select:text}
/* Message temporaire */
.dic-w .dic-flash{position:absolute;left:50%;top:10px;transform:translateX(-50%);z-index:13;max-width:calc(100% - 24px);box-sizing:border-box;
  padding:7px 14px;border-radius:12px;background:rgba(0,0,0,.85);color:#fff;font-size:12.5px;font-weight:600;text-align:center;
  pointer-events:none;opacity:0;transition:opacity .25s}
.dic-w .dic-flash.is-on{opacity:1}
/* Petits widgets / téléphone : la barre de recherche passe sur deux lignes */
@container (max-width: 480px){
  .dic-w .dic-search{flex-wrap:wrap}
  .dic-w .dic-field{flex-basis:100%}
  .dic-w .dic-go{flex:1}
  .dic-w .dic-top{padding:10px 10px 8px}
  .dic-w .dic-result{padding:4px 10px 12px}
  .dic-w .dic-card{padding:14px 14px}
}
@media print{ .dic-w .dic-bar{display:none} }
`;
    document.head.appendChild(st);
})();

// Widgets déjà présents au chargement du script.
_dicScan(document.body);
