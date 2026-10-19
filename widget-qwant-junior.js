// =========================================================================
// WIDGET QWANT JUNIOR — Le Bureau du Prof
// =========================================================================
// Moteur de recherche pour les enfants, affiché directement dans le tableau.
// Construit sur le modèle du widget « Fenêtre web » :
//   - la page d'accueil de Qwant Junior s'ouvre dès la création du widget
//   - barre de recherche : on tape des mots → la recherche se fait dans le
//     widget ; on colle une adresse → la page s'ouvre dans le widget
//   - ⌂ revient à l'accueil de Qwant Junior, ⟳ recharge, zoom − / +
//     (pratique au tableau), ↗ ouvre dans un onglet, plein écran,
//     boutons fenêtre jaune / vert / rouge
//   - bandeau d'aide si la page reste blanche, avec « Ouvrir dans un onglet »
//
// Utilisation : createWidget('qwant-junior')
// Le template #template-qwant-junior est injecté dans le DOM par ce fichier.
// L'adresse affichée et le zoom sont gardés avec le tableau (attributs
// data-qj-url et data-qj-zoom).
// =========================================================================

const QJ_HOME = 'https://www.qwantjunior.com/';
const _QJ_STOP = ' onpointerdown="event.stopPropagation()" onmousedown="event.stopPropagation()" ontouchstart="event.stopPropagation()"';
const _QJ_ZOOMS = [0.5, 0.67, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2];

document.body.insertAdjacentHTML('beforeend', `
<template id="template-qwant-junior">
    <div class="editor-container qj-v2" data-qj-zoom="1" data-qj-url="${QJ_HOME}" style="height:520px;width:760px;">
        <button class="exit-fs-btn" onclick="document.exitFullscreen()">✖ Quitter Plein Écran</button>
        <div class="qj-bar editor-toolbar">
            <button type="button" class="qj-ib" data-qj-action="home" title="Accueil de Qwant Junior" aria-label="Accueil"${_QJ_STOP}>⌂</button>
            <button type="button" class="qj-ib qj-sm-hide" data-qj-action="reload" title="Recharger la page" aria-label="Recharger"${_QJ_STOP}>⟳</button>
            <div class="qj-field"${_QJ_STOP}>
                <span class="qj-field-ico">🔎</span>
                <input type="text" class="qj-input" spellcheck="true" autocomplete="off" lang="fr"
                       placeholder="Que veux-tu chercher ?"
                       onkeydown="qjInputKey(event,this)" oninput="qjInputChanged(this)" onfocus="this.select()">
                <button type="button" class="qj-clear" data-qj-action="clear" title="Effacer" aria-label="Effacer">✕</button>
                <button type="button" class="qj-go" data-qj-action="go" title="Chercher sur Qwant Junior">🔎<span class="qj-go-lbl"> Chercher</span></button>
            </div>
            <div class="qj-zoom qj-sm-hide"${_QJ_STOP}>
                <button type="button" data-qj-action="zoom-out" title="Rapetisser la page" aria-label="Rapetisser">−</button>
                <button type="button" class="qj-zoom-val" data-qj-action="zoom-reset" title="Taille normale">100 %</button>
                <button type="button" data-qj-action="zoom-in" title="Agrandir la page" aria-label="Agrandir">+</button>
            </div>
            <button type="button" class="qj-ib qj-sm-hide" data-qj-action="newtab" title="Ouvrir dans un nouvel onglet" aria-label="Ouvrir dans un onglet"${_QJ_STOP}>↗</button>
            <button type="button" class="qj-ib qj-sm-hide" onclick="toggleFullScreen(this.closest('.editor-container'))" title="Projeter sur tout l'écran" aria-label="Projeter"${_QJ_STOP}>⛶</button>
            <div class="wf-btns"${_QJ_STOP}>
                <button class="wf-btn wf-btn-min"   title="Réduire"          onclick="toggleMediaCollapse(this.closest('.editor-container'))"></button>
                <button class="wf-btn wf-btn-max"   title="Plein écran board" onclick="toggleMediaBoardFullscreen(this.closest('.editor-container'))"></button>
                <button class="wf-btn wf-btn-close" title="Fermer"            onclick="snapshotNow();this.closest('.widget').remove();saveBoard();"></button>
            </div>
            <div class="qj-progress"></div>
        </div>
        <div class="qj-stage">
            <iframe class="qj-frame" src="${QJ_HOME}" title="Qwant Junior" referrerpolicy="strict-origin-when-cross-origin"
                    allow="autoplay; fullscreen; clipboard-write; encrypted-media; picture-in-picture" allowfullscreen></iframe>
            <div class="qj-help"${_QJ_STOP}>
                <span>La page reste blanche ? Le navigateur bloque peut-être l'affichage dans une fenêtre.</span>
                <button type="button" data-qj-action="newtab">↗ Ouvrir dans un onglet</button>
                <button type="button" class="qj-help-x" data-qj-action="help-close" title="Masquer" aria-label="Masquer">✕</button>
            </div>
            <div class="qj-flash"></div>
        </div>
    </div>
</template>
`);

/* ── Outils ─────────────────────────────────────────────────────── */
const _qjSave = () => { if (typeof saveBoard === 'function') saveBoard(); };
const _qjFrame = c => c.querySelector('iframe.qj-frame');
const _qjUrl = c => c.getAttribute('data-qj-url') || QJ_HOME;

function _qjLooksLikeUrl(t) {
    t = String(t || '').trim();
    if (!t || /\s/.test(t)) return false;
    if (/^https?:\/\//i.test(t)) return true;
    return /^[^\/\s]+\.[a-z]{2,}(:\d+)?(\/.*)?$/i.test(t);
}
function _qjSearchUrl(q) { return QJ_HOME + '?q=' + encodeURIComponent(q); }

function _qjFlash(c, text, ms) {
    const f = c && c.querySelector('.qj-flash');
    if (!f) return;
    f.textContent = text;
    f.classList.remove('is-on'); void f.offsetWidth; f.classList.add('is-on');
    clearTimeout(f._t);
    f._t = setTimeout(() => f.classList.remove('is-on'), ms || 1800);
}
function _qjNudge(c, msg) {
    const field = c.querySelector('.qj-field');
    if (field) {
        field.classList.remove('is-bad'); void field.offsetWidth; field.classList.add('is-bad');
        clearTimeout(field._t);
        field._t = setTimeout(() => field.classList.remove('is-bad'), 1200);
    }
    if (msg) _qjFlash(c, msg, 2200);
    const input = c.querySelector('.qj-input');
    if (input) try { input.focus({ preventScroll: true }); } catch (e) {}
}
function _qjSetInput(c, text) {
    const input = c.querySelector('.qj-input');
    if (!input) return;
    input.value = text || '';
    if (text) input.setAttribute('value', text); else input.removeAttribute('value');
    qjInputChanged(input);
}

/* ── Navigation ─────────────────────────────────────────────────── */
function _qjOpen(c, url) {
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    const frame = _qjFrame(c);
    if (!frame) return;
    c.setAttribute('data-qj-url', url);
    _qjHelp(c, false);
    _qjLoading(c, true);
    frame.src = url;
    _qjSave();
}
function _qjSearch(c, q) {
    q = String(q || '').trim();
    if (!q) { _qjNudge(c, 'Tape d’abord ce que tu cherches'); return; }
    if (_qjLooksLikeUrl(q)) _qjOpen(c, q);
    else _qjOpen(c, _qjSearchUrl(q));
    const input = c.querySelector('.qj-input');
    if (input) try { input.blur(); } catch (e) {}
}
function _qjHome(c) {
    _qjSetInput(c, '');
    _qjOpen(c, QJ_HOME);
}
function _qjReload(c) {
    const frame = _qjFrame(c);
    _qjHelp(c, false);
    _qjLoading(c, true);
    frame.src = 'about:blank';
    setTimeout(() => { frame.src = _qjUrl(c); }, 30);
}

/* ── Chargement et aide « page blanche » ────────────────────────── */
function _qjLoading(c, on) {
    c.classList.toggle('qj-loading', !!on);
    clearTimeout(c._qjLoadT);
    if (on) c._qjLoadT = setTimeout(() => c.classList.remove('qj-loading'), 15000);
}
function _qjHelp(c, on) {
    clearTimeout(c._qjHelpT);
    const h = c.querySelector('.qj-help');
    if (h) h.classList.toggle('is-on', !!on);
}
function _qjOnFrameLoad(c) {
    _qjLoading(c, false);
    const f = _qjFrame(c);
    if (!f || (f.getAttribute('src') || '') === 'about:blank') return;
    // Le premier chargement peut échouer sans erreur visible : on propose l'onglet un moment
    if (!c._qjHelpShown) {
        c._qjHelpShown = true;
        _qjHelp(c, true);
        c._qjHelpT = setTimeout(() => _qjHelp(c, false), 6000);
    }
}

/* ── Zoom ───────────────────────────────────────────────────────── */
function _qjApplyZoom(c) {
    let z = parseFloat(c.getAttribute('data-qj-zoom'));
    if (!isFinite(z) || z <= 0) z = 1;
    const frame = _qjFrame(c);
    if (frame) {
        if (z === 1) { frame.style.width = ''; frame.style.height = ''; frame.style.transform = ''; }
        else {
            frame.style.width = (100 / z) + '%';
            frame.style.height = (100 / z) + '%';
            frame.style.transform = 'scale(' + z + ')';
        }
    }
    const v = c.querySelector('.qj-zoom-val');
    if (v) v.textContent = Math.round(z * 100) + ' %';
}
function _qjZoom(c, dir) {
    let z = parseFloat(c.getAttribute('data-qj-zoom')) || 1;
    if (dir === 0) z = 1;
    else {
        let i = _QJ_ZOOMS.findIndex(v => v >= z - 0.001);
        if (i < 0) i = _QJ_ZOOMS.length - 1;
        if (_QJ_ZOOMS[i] > z + 0.001 && dir < 0) i++;
        i = Math.max(0, Math.min(_QJ_ZOOMS.length - 1, i + dir));
        z = _QJ_ZOOMS[i];
    }
    c.setAttribute('data-qj-zoom', z);
    _qjApplyZoom(c);
    _qjFlash(c, 'Taille ' + Math.round(z * 100) + ' %', 1000);
    _qjSave();
}

/* ── Barre de recherche ─────────────────────────────────────────── */
function qjInputKey(e, input) {
    e.stopPropagation();                       // pas de raccourcis du tableau pendant la saisie
    if (e.key === 'Enter') { e.preventDefault(); _qjSearch(input.closest('.editor-container'), input.value); }
    else if (e.key === 'Escape') input.blur();
}
function qjInputChanged(input) {
    const c = input.closest('.qj-v2');
    if (!c) return;
    const v = input.value.trim();
    const url = _qjLooksLikeUrl(v);
    const go = c.querySelector('.qj-go');
    if (go) {
        go.innerHTML = url ? '➜<span class="qj-go-lbl"> Ouvrir</span>' : '🔎<span class="qj-go-lbl"> Chercher</span>';
        go.title = url ? 'Ouvrir cette page' : 'Chercher sur Qwant Junior';
    }
    const field = c.querySelector('.qj-field');
    if (field) { field.classList.toggle('has-text', !!v); field.classList.remove('is-bad'); }
}

/* ── Clics (délégués : survivent à la sauvegarde / restauration) ─── */
document.addEventListener('click', e => {
    const btn = e.target.closest && e.target.closest('[data-qj-action]');
    if (!btn) return;
    const c = btn.closest('.qj-v2');
    if (!c) return;
    const input = c.querySelector('.qj-input');
    switch (btn.getAttribute('data-qj-action')) {
        case 'go':         _qjSearch(c, input.value); break;
        case 'clear':      _qjSetInput(c, ''); input.focus(); break;
        case 'home':       _qjHome(c); break;
        case 'reload':     _qjReload(c); break;
        case 'newtab':     window.open(_qjUrl(c), '_blank', 'noopener'); break;
        case 'help-close': _qjHelp(c, false); break;
        case 'zoom-in':    _qjZoom(c, 1); break;
        case 'zoom-out':   _qjZoom(c, -1); break;
        case 'zoom-reset': _qjZoom(c, 0); break;
    }
});

/* ── Mise en route des widgets (nouveaux ou restaurés) ───────────── */
function _qjInit(c) {
    if (!c || c._qjInited || !c.classList.contains('qj-v2')) return;
    c._qjInited = true;
    const frame = _qjFrame(c);
    c.classList.remove('qj-loading');
    _qjHelp(c, false);
    if (frame) {
        frame.addEventListener('load', () => _qjOnFrameLoad(c));
        const url = _qjUrl(c);
        if ((frame.getAttribute('src') || '') !== url) frame.src = url;   // la page s'ouvre directement
        _qjLoading(c, true);
    }
    const input = c.querySelector('.qj-input');
    if (input) qjInputChanged(input);
    _qjApplyZoom(c);
}
function _qjScan(n) {
    if (!n || n.nodeType !== 1) return;
    if (n.matches('.qj-v2')) _qjInit(n);
    else if (n.querySelectorAll) n.querySelectorAll('.qj-v2').forEach(_qjInit);
}
new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => {
    if (n.nodeType === 1 && n.closest && n.closest('.qj-stage, .qj-bar')) return;
    _qjScan(n);
}))).observe(document.body, { childList: true, subtree: true });

// Création depuis un panneau
window.createQwantJuniorWidget = function () {
    return typeof createWidget === 'function' ? createWidget('qwant-junior') : null;
};

/* ── Styles ─────────────────────────────────────────────────────── */
(function () {
    if (document.getElementById('qj-styles')) return;
    const st = document.createElement('style');
    st.id = 'qj-styles';
    st.textContent = `
.editor-container.qj-v2{
  --qj-accent:#5c6bff; --qj-accent-2:#ff7a59;
  container-type:inline-size; position:relative; display:flex; flex-direction:column;
  overflow:hidden; box-sizing:border-box; padding:0; background:#18181c; color:#eee;
  font-family:system-ui,-apple-system,"Segoe UI",sans-serif; font-size:13px;
}
.qj-v2 button{font-family:inherit}
.qj-v2 :focus-visible{outline:2px solid var(--qj-accent);outline-offset:1px}
/* Barre du haut */
.qj-v2 .qj-bar{flex:none;position:relative;z-index:10;height:48px;min-height:0;box-sizing:border-box;display:flex;flex-wrap:nowrap;align-items:center;gap:5px;
  padding:0 10px;background:#232329;border-bottom:1px solid #2f2f37;visibility:visible;opacity:1;user-select:none;-webkit-user-select:none}
.qj-v2 .qj-progress{position:absolute;left:0;bottom:-1px;height:3px;width:0;opacity:0;pointer-events:none;
  background:linear-gradient(90deg,var(--qj-accent),var(--qj-accent-2))}
.qj-v2.qj-loading .qj-progress{opacity:1;animation:qj-load 2.5s ease-out forwards}
@keyframes qj-load{from{width:0}to{width:85%}}
.qj-v2 .qj-field{flex:1;min-width:110px;display:flex;align-items:center;height:34px;box-sizing:border-box;padding:0 3px 0 12px;
  background:#fff;border:2px solid transparent;border-radius:99px;transition:border-color .15s,box-shadow .15s}
.qj-v2 .qj-field:focus-within{border-color:var(--qj-accent);box-shadow:0 0 0 3px rgba(92,107,255,.25)}
.qj-v2 .qj-field.is-bad{border-color:#ff5f57;animation:qj-shake .3s}
@keyframes qj-shake{25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
.qj-v2 .qj-field-ico{flex:none;font-size:13px;margin-right:6px}
.qj-v2 .qj-input{flex:1;min-width:0;height:100%;border:0;outline:0;background:transparent;color:#222;font:inherit;font-size:15px;padding:0;
  user-select:text;-webkit-user-select:text;cursor:text}
.qj-v2 .qj-input::placeholder{color:#8a8a96}
.qj-v2 .qj-clear{display:none;flex:none;width:24px;height:24px;border:0;border-radius:50%;background:transparent;color:#999;
  font-size:11px;cursor:pointer;align-items:center;justify-content:center;padding:0;margin-right:2px}
.qj-v2 .qj-clear:hover{background:#eee;color:#333}
.qj-v2 .qj-field.has-text .qj-clear{display:inline-flex}
.qj-v2 .qj-go{flex:none;height:26px;border:0;border-radius:99px;background:linear-gradient(90deg,var(--qj-accent),#7b61d9);color:#fff;
  font-size:13px;font-weight:700;padding:0 14px;cursor:pointer;white-space:nowrap}
.qj-v2 .qj-go:hover{filter:brightness(1.1)}
.qj-v2 .qj-ib{flex:none;width:32px;height:32px;border:0;border-radius:8px;background:transparent;color:#cfcfd6;
  font-size:17px;line-height:1;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;padding:0}
.qj-v2 .qj-ib:hover{background:rgba(255,255,255,.1);color:#fff}
.qj-v2 .qj-zoom{flex:none;display:inline-flex;align-items:center;background:#2f2f38;border-radius:99px;padding:2px}
.qj-v2 .qj-zoom button{height:28px;min-width:28px;border:0;border-radius:99px;background:transparent;color:#cfcfd6;font-size:15px;cursor:pointer;padding:0 6px}
.qj-v2 .qj-zoom button:hover{background:rgba(255,255,255,.12);color:#fff}
.qj-v2 .qj-zoom .qj-zoom-val{font-size:11px;min-width:44px;font-variant-numeric:tabular-nums}
@container (max-width: 640px){ .qj-v2 .qj-zoom{display:none} }
@container (max-width: 480px){ .qj-v2 .qj-sm-hide{display:none !important} .qj-v2 .qj-go-lbl{display:none} .qj-v2 .qj-bar{gap:3px;padding:0 6px} }
/* Page */
.qj-v2 .qj-stage{position:relative;flex:1;min-height:0;overflow:hidden;background:#fff}
.qj-v2 .qj-frame{position:absolute;left:0;top:0;width:100%;height:100%;border:0;display:block;background:#fff;transform-origin:0 0}
/* Bandeau « page blanche » */
.qj-v2 .qj-help{position:absolute;left:10px;right:10px;bottom:10px;z-index:4;display:flex;align-items:center;gap:8px;flex-wrap:wrap;
  padding:7px 8px 7px 12px;border-radius:10px;background:rgba(24,24,30,.92);color:#e6e6ea;font-size:12px;
  box-shadow:0 4px 16px rgba(0,0,0,.35);opacity:0;transform:translateY(8px);pointer-events:none;transition:opacity .25s,transform .25s}
.qj-v2 .qj-help.is-on{opacity:1;transform:none;pointer-events:auto}
.qj-v2 .qj-help span{flex:1;min-width:160px}
.qj-v2 .qj-help button{flex:none;height:26px;border:0;border-radius:99px;background:var(--qj-accent);color:#fff;font-size:12px;font-weight:600;padding:0 12px;cursor:pointer}
.qj-v2 .qj-help .qj-help-x{width:26px;padding:0;background:transparent;color:#9a9aa6}
.qj-v2 .qj-help .qj-help-x:hover{background:rgba(255,255,255,.12);color:#fff}
/* Message temporaire */
.qj-v2 .qj-flash{position:absolute;left:50%;top:10px;transform:translateX(-50%);z-index:9;max-width:calc(100% - 24px);box-sizing:border-box;
  padding:7px 14px;border-radius:12px;background:rgba(0,0,0,.85);color:#fff;font-size:12.5px;font-weight:600;text-align:center;
  pointer-events:none;opacity:0;transition:opacity .25s}
.qj-v2 .qj-flash.is-on{opacity:1}
.qj-v2:fullscreen{width:100% !important;height:100% !important}
@media print{ .qj-v2 .qj-bar,.qj-v2 .qj-help{display:none} }
`;
    document.head.appendChild(st);
})();

// Widgets déjà présents au chargement du script.
_qjScan(document.body);
