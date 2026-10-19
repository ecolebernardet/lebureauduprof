// =========================================================================
// WIDGET QWANT JUNIOR — Le Bureau du Prof
// =========================================================================
// Qwant Junior refuse d'être affiché à l'intérieur d'un autre site (les
// navigateurs bloquent la page dans une fenêtre intégrée). Le widget est donc
// un « lanceur » de recherche, dans le style du widget « Fenêtre web » :
//   - grande barre de recherche adaptée aux enfants
//   - Entrée ou « Chercher » : les résultats s'ouvrent dans un nouvel onglet
//   - bouton « Ouvrir Qwant Junior » pour la page d'accueil
//   - dernières recherches en pastilles (gardées dans ce navigateur)
//   - boutons fenêtre jaune / vert / rouge habituels
//
// Utilisation : createWidget('qwant-junior')
// Le template #template-qwant-junior est injecté dans le DOM par ce fichier.
// =========================================================================

const QJ_HOME = 'https://www.qwantjunior.com/';
const _QJ_STOP = ' onpointerdown="event.stopPropagation()" onmousedown="event.stopPropagation()" ontouchstart="event.stopPropagation()"';
const _QJ_LS_RECENT = 'lbdp-qwant-junior-recents';

document.body.insertAdjacentHTML('beforeend', `
<template id="template-qwant-junior">
    <div class="editor-container qj-v2" style="height:340px;width:560px;">
        <div class="qj-bar editor-toolbar">
            <span class="qj-bar-title">🔎 Qwant Junior</span>
            <div class="wf-btns"${_QJ_STOP}>
                <button class="wf-btn wf-btn-min"   title="Réduire"          onclick="toggleMediaCollapse(this.closest('.editor-container'))"></button>
                <button class="wf-btn wf-btn-max"   title="Plein écran board" onclick="toggleMediaBoardFullscreen(this.closest('.editor-container'))"></button>
                <button class="wf-btn wf-btn-close" title="Fermer"            onclick="snapshotNow();this.closest('.widget').remove();saveBoard();"></button>
            </div>
        </div>
        <div class="qj-stage"${_QJ_STOP}>
            <div class="qj-box">
                <div class="qj-title">Que veux-tu chercher ?</div>
                <div class="qj-field">
                    <span class="qj-field-ico">🔎</span>
                    <input type="text" class="qj-input" spellcheck="true" autocomplete="off" lang="fr"
                           placeholder="Tape tes mots ici…"
                           onkeydown="qjInputKey(event,this)" oninput="qjInputChanged(this)">
                    <button type="button" class="qj-clear" data-qj-action="clear" title="Effacer" aria-label="Effacer">✕</button>
                </div>
                <div class="qj-btns">
                    <button type="button" class="qj-go" data-qj-action="go">🔎 Chercher</button>
                    <button type="button" class="qj-home" data-qj-action="home">Ouvrir Qwant Junior</button>
                </div>
                <div class="qj-recents"></div>
                <div class="qj-note">Les résultats s’ouvrent dans un nouvel onglet.</div>
            </div>
            <div class="qj-flash"></div>
        </div>
    </div>
</template>
`);

/* ── Outils ─────────────────────────────────────────────────────── */
const _qjEsc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function _qjLsGet(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }
function _qjLsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
const _qjSearchUrl = q => QJ_HOME + '?q=' + encodeURIComponent(q);

function _qjFlash(c, text, ms) {
    const f = c && c.querySelector('.qj-flash');
    if (!f) return;
    f.textContent = text;
    f.classList.remove('is-on'); void f.offsetWidth; f.classList.add('is-on');
    clearTimeout(f._t);
    f._t = setTimeout(() => f.classList.remove('is-on'), ms || 2000);
}
function _qjNudge(c, msg) {
    const field = c.querySelector('.qj-field');
    if (field) {
        field.classList.remove('is-bad'); void field.offsetWidth; field.classList.add('is-bad');
        clearTimeout(field._t);
        field._t = setTimeout(() => field.classList.remove('is-bad'), 1200);
    }
    if (msg) _qjFlash(c, msg);
    const input = c.querySelector('.qj-input');
    if (input) try { input.focus({ preventScroll: true }); } catch (e) {}
}

/* ── Ouverture de Qwant Junior : toujours dans un nouvel onglet ───── */
function _qjLaunch(c, url) {
    const api = window.electronAPI;
    if (api && typeof api.openExternal === 'function') { api.openExternal(url); return; }
    let w = null;
    try { w = window.open(url, '_blank'); } catch (e) {}
    if (!w) _qjFlash(c, '⚠ Le navigateur a bloqué l’ouverture : autorise les fenêtres pour ce site.', 4000);
}

function _qjSearch(c) {
    const input = c.querySelector('.qj-input');
    const q = (input ? input.value : '').trim();
    if (!q) { _qjNudge(c, 'Tape d’abord ce que tu cherches'); return; }
    _qjAddRecent(q);
    _qjLaunch(c, _qjSearchUrl(q));
    _qjFlash(c, '🔎 Résultats ouverts dans un nouvel onglet');
}

/* ── Dernières recherches ───────────────────────────────────────── */
function _qjAddRecent(q) {
    const list = _qjLsGet(_QJ_LS_RECENT, []).filter(x => typeof x === 'string' && x.toLowerCase() !== q.toLowerCase());
    list.unshift(q);
    _qjLsSet(_QJ_LS_RECENT, list.slice(0, 8));
    document.querySelectorAll('.qj-v2').forEach(_qjRenderRecents);
}
function _qjRenderRecents(c) {
    const box = c.querySelector('.qj-recents');
    if (!box) return;
    const list = _qjLsGet(_QJ_LS_RECENT, []).filter(x => typeof x === 'string').slice(0, 6);
    box.innerHTML = list.length
        ? '<span class="qj-recents-h">Dernières recherches :</span>' + list.map(q =>
            `<span class="qj-chip" data-qj-action="recent" data-q="${_qjEsc(q)}" title="Chercher « ${_qjEsc(q)} »">${_qjEsc(q)}` +
            `<button type="button" class="qj-chip-x" data-qj-action="recent-del" data-q="${_qjEsc(q)}" title="Retirer" aria-label="Retirer">✕</button></span>`).join('')
        : '';
}

/* ── Saisie ─────────────────────────────────────────────────────── */
function qjInputKey(e, input) {
    e.stopPropagation();                       // pas de raccourcis du tableau pendant la saisie
    if (e.key === 'Enter') { e.preventDefault(); _qjSearch(input.closest('.editor-container')); }
    else if (e.key === 'Escape') input.blur();
}
function qjInputChanged(input) {
    const field = input.closest('.qj-field');
    if (field) { field.classList.toggle('has-text', !!input.value.trim()); field.classList.remove('is-bad'); }
    if (input.value) input.setAttribute('value', input.value); else input.removeAttribute('value');
}

/* ── Clics (délégués : survivent à la sauvegarde / restauration) ─── */
document.addEventListener('click', e => {
    const btn = e.target.closest && e.target.closest('[data-qj-action]');
    if (!btn) return;
    const c = btn.closest('.qj-v2');
    if (!c) return;
    const input = c.querySelector('.qj-input');
    switch (btn.getAttribute('data-qj-action')) {
        case 'go':     _qjSearch(c); break;
        case 'home':   _qjLaunch(c, QJ_HOME); break;
        case 'clear':  input.value = ''; qjInputChanged(input); input.focus(); break;
        case 'recent': input.value = btn.getAttribute('data-q') || ''; qjInputChanged(input); _qjSearch(c); break;
        case 'recent-del': {
            e.stopPropagation();
            const q = btn.getAttribute('data-q');
            _qjLsSet(_QJ_LS_RECENT, _qjLsGet(_QJ_LS_RECENT, []).filter(x => x !== q));
            document.querySelectorAll('.qj-v2').forEach(_qjRenderRecents);
            break;
        }
    }
});
/* ── Mise en route des widgets (nouveaux ou restaurés) ───────────── */
function _qjInit(c) {
    if (!c || c._qjInited || !c.classList.contains('qj-v2')) return;
    // Ancienne version (page intégrée, bloquée par le site) : on remplace l'intérieur
    if (c.querySelector('iframe.qj-frame')) {
        const tpl = document.getElementById('template-qwant-junior');
        const fresh = tpl && tpl.content.querySelector('.qj-v2');
        if (fresh) { c.innerHTML = fresh.innerHTML; c.style.width = '560px'; c.style.height = '340px'; }
    }
    c._qjInited = true;
    const bar = c.querySelector('.qj-bar');
    if (bar) bar.classList.add('editor-toolbar');
    const input = c.querySelector('.qj-input');
    if (input) qjInputChanged(input);
    _qjRenderRecents(c);
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
.qj-v2 :focus-visible{outline:2px solid var(--qj-accent);outline-offset:2px}
/* Barre du haut */
.qj-v2 .qj-bar{flex:none;position:relative;z-index:10;height:40px;min-height:0;box-sizing:border-box;display:flex;flex-wrap:nowrap;align-items:center;gap:6px;
  padding:0 10px;background:#232329;border-bottom:1px solid #2f2f37;visibility:visible;opacity:1;user-select:none;-webkit-user-select:none}
.qj-v2 .qj-bar-title{flex:1;min-width:0;font-weight:700;font-size:13px;color:#e6e6ea;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.qj-v2 .qj-ib{flex:none;width:30px;height:30px;border:0;border-radius:8px;background:transparent;color:#8d8d99;
  font-size:16px;line-height:1;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;padding:0}
.qj-v2 .qj-ib:hover{background:rgba(255,255,255,.1);color:#fff}
/* Zone de recherche */
.qj-v2 .qj-stage{position:relative;flex:1;min-height:0;overflow:auto;display:flex;align-items:center;justify-content:center;padding:16px;
  background:radial-gradient(circle at 15% 15%,rgba(255,122,89,.35),transparent 45%),radial-gradient(circle at 85% 90%,rgba(92,107,255,.45),transparent 50%),#1d1d2b}
.qj-v2 .qj-box{width:100%;max-width:520px;margin:auto;text-align:center}
.qj-v2 .qj-title{font-size:clamp(17px,4.5cqw,26px);font-weight:800;color:#fff;margin-bottom:12px}
.qj-v2 .qj-field{display:flex;align-items:center;height:clamp(44px,9cqw,56px);box-sizing:border-box;padding:0 6px 0 16px;
  background:#fff;border:3px solid transparent;border-radius:99px;box-shadow:0 6px 20px rgba(0,0,0,.35);transition:border-color .15s}
.qj-v2 .qj-field:focus-within{border-color:var(--qj-accent)}
.qj-v2 .qj-field.is-bad{border-color:#ff5f57;animation:qj-shake .3s}
@keyframes qj-shake{25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
.qj-v2 .qj-field-ico{flex:none;font-size:18px;margin-right:8px}
.qj-v2 .qj-input{flex:1;min-width:0;height:100%;border:0;outline:0;background:transparent;color:#222;font:inherit;
  font-size:clamp(16px,3.6cqw,22px);padding:0;user-select:text;-webkit-user-select:text;cursor:text}
.qj-v2 .qj-input::placeholder{color:#9a9aa6}
.qj-v2 .qj-clear{display:none;flex:none;width:30px;height:30px;border:0;border-radius:50%;background:transparent;color:#999;
  font-size:13px;cursor:pointer;align-items:center;justify-content:center;padding:0}
.qj-v2 .qj-clear:hover{background:#eee;color:#333}
.qj-v2 .qj-field.has-text .qj-clear{display:inline-flex}
.qj-v2 .qj-btns{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:14px}
.qj-v2 .qj-go{height:42px;border:0;border-radius:99px;padding:0 24px;cursor:pointer;color:#fff;font-size:15px;font-weight:800;
  background:linear-gradient(90deg,var(--qj-accent),#7b61d9);box-shadow:0 4px 14px rgba(92,107,255,.45)}
.qj-v2 .qj-go:hover{filter:brightness(1.1)}
.qj-v2 .qj-home{height:42px;border:0;border-radius:99px;padding:0 18px;cursor:pointer;color:#fff;font-size:13px;font-weight:600;
  background:rgba(255,255,255,.14)}
.qj-v2 .qj-home:hover{background:rgba(255,255,255,.24)}
.qj-v2 .qj-recents{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;align-items:center;margin-top:14px}
.qj-v2 .qj-recents:empty{display:none}
.qj-v2 .qj-recents-h{font-size:12px;color:#b9b9c8;margin-right:2px}
.qj-v2 .qj-chip{display:inline-flex;align-items:center;gap:2px;max-width:180px;height:28px;box-sizing:border-box;padding:0 4px 0 12px;border-radius:99px;
  background:rgba(255,255,255,.12);color:#fff;font-size:12px;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.qj-v2 .qj-chip:hover{background:rgba(255,255,255,.22)}
.qj-v2 .qj-chip-x{flex:none;width:20px;height:20px;border:0;border-radius:50%;background:transparent;color:#b9b9c8;font-size:9px;cursor:pointer;
  display:none;align-items:center;justify-content:center;padding:0}
.qj-v2 .qj-chip:hover .qj-chip-x{display:inline-flex}
.qj-v2 .qj-chip-x:hover{background:#c0392b;color:#fff}
@media (hover: none){ .qj-v2 .qj-chip-x{display:inline-flex} }
.qj-v2 .qj-note{font-size:11px;color:#9a9aa6;margin-top:12px}
/* Message temporaire */
.qj-v2 .qj-flash{position:absolute;left:50%;top:10px;transform:translateX(-50%);z-index:9;max-width:calc(100% - 24px);box-sizing:border-box;
  padding:7px 14px;border-radius:12px;background:rgba(0,0,0,.85);color:#fff;font-size:12.5px;font-weight:600;text-align:center;
  pointer-events:none;opacity:0;transition:opacity .25s}
.qj-v2 .qj-flash.is-on{opacity:1}
@media print{ .qj-v2 .qj-bar{display:none} }
`;
    document.head.appendChild(st);
})();

// Widgets déjà présents au chargement du script.
_qjScan(document.body);
