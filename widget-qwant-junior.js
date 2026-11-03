// =========================================================================
// WIDGET QWANT JUNIOR — Le Bureau du Prof
// =========================================================================
// Qwant Junior refuse d'être affiché à l'intérieur d'un autre site (les
// navigateurs bloquent la page dans une fenêtre intégrée). Le widget est donc
// un « lanceur » de recherche, dans le style du widget « Fenêtre web » :
//   - grande barre de recherche adaptée aux enfants
//   - deux boutons : « Pages web » et « Images » (Entrée = pages web) ;
//     les résultats s'ouvrent dans un nouvel onglet
//   - bouton « Ouvrir Qwant Junior » pour la page d'accueil
//   - dernières recherches dans un menu déroulant, effaçable
//     (gardées dans ce navigateur)
//   - déplacement du widget en le tirant par sa barre de titre
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
    <div class="editor-container qj-v2" style="height:500px;width:800px;">
        <div class="qj-bar editor-toolbar" title="Glisser pour déplacer">
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
                    <button type="button" class="qj-go" data-qj-action="go-web" title="Chercher des pages web">🌐 Pages web</button>
                    <button type="button" class="qj-go qj-go-img" data-qj-action="go-images" title="Chercher des images">🖼️ Images</button>
                    <button type="button" class="qj-home" data-qj-action="home">Ouvrir Qwant Junior</button>
                </div>
                <div class="qj-recents"></div>
                <div class="qj-note">Entrée = pages web. Les résultats s’ouvrent dans un nouvel onglet.</div>
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
// type : 'web' (pages web) ou 'images'
const _qjSearchUrl = (q, type) => QJ_HOME + '?q=' + encodeURIComponent(q) + (type === 'images' ? '&t=images' : '');

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

function _qjSearch(c, type) {
    const input = c.querySelector('.qj-input');
    const q = (input ? input.value : '').trim();
    if (!q) { _qjNudge(c, 'Tape d’abord ce que tu cherches'); return; }
    _qjAddRecent(q);
    _qjLaunch(c, _qjSearchUrl(q, type));
    _qjFlash(c, type === 'images' ? '🖼️ Images ouvertes dans un nouvel onglet' : '🌐 Pages web ouvertes dans un nouvel onglet');
}

/* ── Dernières recherches ───────────────────────────────────────── */
const _QJ_RECENT_MAX = 15;
const _qjRecentList = () => _qjLsGet(_QJ_LS_RECENT, []).filter(x => typeof x === 'string').slice(0, _QJ_RECENT_MAX);
function _qjRenderAll() { document.querySelectorAll('.qj-v2').forEach(_qjRenderRecents); }
function _qjAddRecent(q) {
    const list = _qjRecentList().filter(x => x.toLowerCase() !== q.toLowerCase());
    list.unshift(q);
    _qjLsSet(_QJ_LS_RECENT, list.slice(0, _QJ_RECENT_MAX));
    _qjRenderAll();
}
// Bouton « Historique ▾ » (caché s'il n'y a rien) + menu s'il est ouvert
function _qjRenderRecents(c) {
    const box = c.querySelector('.qj-recents');
    if (!box) return;
    const list = _qjRecentList();
    const open = !!c.querySelector('.qj-menu');
    box.innerHTML = list.length
        ? `<button type="button" class="qj-hist-btn${open ? ' is-open' : ''}" data-qj-action="hist-toggle" aria-haspopup="true" aria-expanded="${open}">` +
          `🕘 Dernières recherches (${list.length}) <span class="qj-hist-caret">▾</span></button>`
        : '';
    if (open) { if (list.length) _qjMenuBuild(c); else _qjMenuClose(c); }
}
function _qjMenuBuild(c) {
    let m = c.querySelector('.qj-menu');
    if (!m) {
        m = document.createElement('div');
        m.className = 'qj-menu';
        m.setAttribute('role', 'menu');
        ['pointerdown', 'mousedown', 'touchstart'].forEach(t => m.addEventListener(t, ev => ev.stopPropagation()));
        c.appendChild(m);
    }
    const list = _qjRecentList();
    m.innerHTML = '<div class="qj-menu-list">' + list.map(q =>
        `<div class="qj-mi" role="menuitem" data-qj-action="recent" data-q="${_qjEsc(q)}" title="Chercher « ${_qjEsc(q)} »">` +
        `<span class="qj-mi-t">${_qjEsc(q)}</span>` +
        `<button type="button" class="qj-mi-x" data-qj-action="recent-del" data-q="${_qjEsc(q)}" title="Retirer de l’historique" aria-label="Retirer">✕</button></div>`).join('') +
        '</div><button type="button" class="qj-menu-clear" data-qj-action="hist-clear">🗑 Effacer tout l’historique</button>';
    _qjMenuPlace(c, m);
}
// Place le menu sous le bouton (ou au-dessus s'il manque de place)
function _qjMenuPlace(c, m) {
    const btn = c.querySelector('.qj-hist-btn');
    if (!btn) return;
    const cr = c.getBoundingClientRect(), br = btn.getBoundingClientRect();
    const s = (c.offsetHeight && cr.height / c.offsetHeight) || 1;
    const H = c.offsetHeight, W = c.offsetWidth;
    const bTop = (br.top - cr.top) / s, bBot = (br.bottom - cr.top) / s;
    const bMid = (br.left + br.width / 2 - cr.left) / s;
    const w = Math.min(280, W - 16);
    m.style.width = w + 'px';
    m.style.left = Math.max(8, Math.min(W - w - 8, bMid - w / 2)) + 'px';
    const below = H - bBot - 8, above = bTop - 48;          // 48 = barre de titre + marge
    m.style.top = m.style.bottom = '';
    if (below >= 150 || below >= above) {
        m.style.top = (bBot + 4) + 'px';
        m.style.maxHeight = Math.max(90, below - 4) + 'px';
    } else {
        m.style.bottom = (H - bTop + 4) + 'px';
        m.style.maxHeight = Math.max(90, above) + 'px';
    }
}
function _qjMenuClose(c) {
    const m = c && c.querySelector('.qj-menu');
    if (m) m.remove();
    const b = c && c.querySelector('.qj-hist-btn');
    if (b) { b.classList.remove('is-open'); b.setAttribute('aria-expanded', 'false'); }
}
function _qjMenuToggle(c) {
    if (c.querySelector('.qj-menu')) { _qjMenuClose(c); return; }
    document.querySelectorAll('.qj-v2').forEach(o => { if (o !== c) _qjMenuClose(o); });
    _qjMenuBuild(c);
    const b = c.querySelector('.qj-hist-btn');
    if (b) { b.classList.add('is-open'); b.setAttribute('aria-expanded', 'true'); }
}
// Clic ailleurs ou Échap : on ferme le menu
document.addEventListener('pointerdown', e => {
    const t = e.target;
    if (t && t.closest && (t.closest('.qj-menu') || t.closest('.qj-hist-btn'))) return;
    document.querySelectorAll('.qj-v2 .qj-menu').forEach(m => _qjMenuClose(m.closest('.qj-v2')));
}, true);
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') document.querySelectorAll('.qj-v2 .qj-menu').forEach(m => _qjMenuClose(m.closest('.qj-v2')));
}, true);

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
        case 'go':
        case 'go-web':    _qjSearch(c, 'web'); break;
        case 'go-images': _qjSearch(c, 'images'); break;
        case 'home':   _qjLaunch(c, QJ_HOME); break;
        case 'clear':  input.value = ''; qjInputChanged(input); input.focus(); break;
        case 'hist-toggle': _qjMenuToggle(c); break;
        case 'recent':
            _qjMenuClose(c);
            input.value = btn.getAttribute('data-q') || ''; qjInputChanged(input); _qjSearch(c, 'web');
            break;
        case 'recent-del': {
            e.stopPropagation();
            const q = btn.getAttribute('data-q');
            _qjLsSet(_QJ_LS_RECENT, _qjRecentList().filter(x => x !== q));
            _qjRenderAll();
            break;
        }
        case 'hist-clear':
            _qjLsSet(_QJ_LS_RECENT, []);
            document.querySelectorAll('.qj-v2').forEach(_qjMenuClose);
            _qjRenderAll();
            _qjFlash(c, '🗑 Historique effacé');
            break;
    }
});
/* ── Déplacement du widget en tirant la barre de titre ───────────── */
function _qjDragStart(e) {
    const bar = e.currentTarget, c = bar.closest('.qj-v2');
    if (!c || (e.button !== undefined && e.button !== 0)) return;
    if (e.target.closest('button, .wf-btns, input')) return;
    e.stopPropagation();                                   // le tableau ne gère pas ce glisser
    if (c.classList.contains('wf-media-fullboard')) return; // pas de déplacement en plein écran
    e.preventDefault();
    _qjMenuClose(c);
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
function _qjBindDrag(c) {
    const bar = c.querySelector('.qj-bar');
    if (!bar || bar._qjDrag) return;
    bar._qjDrag = true;
    bar.addEventListener('pointerdown', _qjDragStart);
    // Les anciens événements souris / tactiles ne doivent pas lancer un 2ᵉ glisser
    ['mousedown', 'touchstart'].forEach(t => bar.addEventListener(t, ev => {
        if (!ev.target.closest('button, .wf-btns')) ev.stopPropagation();
    }));
}

/* ── Mise en route des widgets (nouveaux ou restaurés) ───────────── */
function _qjInit(c) {
    if (!c || c._qjInited || !c.classList.contains('qj-v2')) return;
    // Ancienne version (page intégrée, bloquée par le site) : on remplace l'intérieur
    if (c.querySelector('iframe.qj-frame')) {
        const tpl = document.getElementById('template-qwant-junior');
        const fresh = tpl && tpl.content.querySelector('.qj-v2');
        if (fresh) { c.innerHTML = fresh.innerHTML; c.style.width = '800px'; c.style.height = '500px'; }
    }
    // Widget sauvegardé avec un seul bouton « Chercher » : on met les deux boutons
    const oldGo = c.querySelector('.qj-go[data-qj-action="go"]');
    if (oldGo) {
        const tpl = document.getElementById('template-qwant-junior');
        const freshBtns = tpl && tpl.content.querySelector('.qj-btns');
        const btns = oldGo.closest('.qj-btns');
        if (freshBtns && btns) btns.innerHTML = freshBtns.innerHTML;
    }
    const note = c.querySelector('.qj-note');
    if (note) note.textContent = 'Entrée = pages web. Les résultats s’ouvrent dans un nouvel onglet.';
    c._qjInited = true;
    const bar = c.querySelector('.qj-bar');
    if (bar) bar.classList.add('editor-toolbar');
    const input = c.querySelector('.qj-input');
    if (input) qjInputChanged(input);
    c.querySelectorAll('.qj-menu').forEach(m => m.remove());   // menu resté ouvert à la sauvegarde
    const bar2 = c.querySelector('.qj-bar');
    if (bar2) bar2.title = 'Glisser pour déplacer';
    _qjBindDrag(c);
    _qjRenderRecents(c);
    // Plein écran (bouton vert) : on suit l'ajout / le retrait de la classe
    new MutationObserver(() => _qjFitFullboard(c)).observe(c, { attributes: true, attributeFilter: ['class'] });
    _qjFitFullboard(c);
}

/* ── Plein écran sur téléphone : laisser la place des onglets À GAUCHE ──
   Sur téléphone, les onglets latéraux occupent 40 px à gauche de l'écran.
   Le plein écran doit donc commencer à 40 px du bord gauche et aller
   jusqu'au bord droit. On pose la position, puis on mesure où le widget
   s'affiche réellement : si le tableau est décalé ou mis à l'échelle, on
   corrige l'écart pour que le widget colle bien au bord droit de l'écran. */
const _QJ_PHONE_Q = '(max-width: 768px), (max-height: 500px) and (pointer: coarse)';
const _QJ_TABS_W = 40;
const _QJ_FS_PROPS = ['position', 'inset', 'top', 'right', 'bottom', 'left', 'width', 'height', 'max-width', 'max-height', 'margin', 'transform'];
function _qjIsPhone() {
    if (typeof window.isPhoneScreen === 'function') return window.isPhoneScreen();
    return !!(window.matchMedia && window.matchMedia(_QJ_PHONE_Q).matches);
}
function _qjFitFullboard(c) {
    const on = c.classList.contains('wf-media-fullboard') && _qjIsPhone();
    if (!on) { _qjUnfit(c); return; }
    if (c._qjFsBusy) return;
    c._qjFsBusy = true;
    // Valeurs d'avant le recalage, pour les remettre en sortant du plein écran
    if (!c._qjFsFitted) {
        c._qjFsSaved = {};
        _QJ_FS_PROPS.forEach(p => { c._qjFsSaved[p] = [c.style.getPropertyValue(p), c.style.getPropertyPriority(p)]; });
    }
    c._qjFsMine = c._qjFsMine || {};
    const set = (p, v) => { c.style.setProperty(p, v, 'important'); c._qjFsMine[p] = c.style.getPropertyValue(p); };
    const vw = window.innerWidth, vh = window.innerHeight;
    set('position', 'fixed'); set('inset', 'auto'); set('margin', '0'); set('transform', 'none');
    set('top', '0px'); set('left', _QJ_TABS_W + 'px');
    set('right', 'auto'); set('bottom', 'auto');
    set('width', (vw - _QJ_TABS_W) + 'px'); set('height', vh + 'px');
    set('max-width', 'none'); set('max-height', 'none');
    c._qjFsFitted = true;
    // Correction si un parent (tableau) décale ou met à l'échelle l'affichage
    const r = c.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
        const sx = r.width / (vw - _QJ_TABS_W), sy = r.height / vh;
        const left = _QJ_TABS_W + (_QJ_TABS_W - r.left) / sx;
        const top  = (0 - r.top) / sy;
        if (Math.abs(r.left - _QJ_TABS_W) > 1 || Math.abs(sx - 1) > 0.01) {
            set('left', left + 'px');
            set('width', ((vw - _QJ_TABS_W) / sx) + 'px');
        }
        if (Math.abs(r.top) > 1 || Math.abs(sy - 1) > 0.01) {
            set('top', top + 'px');
            set('height', (vh / sy) + 'px');
        }
    }
    c._qjFsBusy = false;
}
// Sortie du plein écran : on ne remet que les propriétés que personne
// d'autre n'a modifiées entre-temps (la taille normale du widget est gardée)
function _qjUnfit(c) {
    if (!c._qjFsFitted) return;
    const saved = c._qjFsSaved || {}, mine = c._qjFsMine || {};
    _QJ_FS_PROPS.forEach(p => {
        if (!(p in mine) || c.style.getPropertyValue(p) !== mine[p]) return;
        const v = saved[p];
        if (v && v[0]) c.style.setProperty(p, v[0], v[1]); else c.style.removeProperty(p);
    });
    c._qjFsFitted = false; c._qjFsMine = {}; c._qjFsSaved = null;
}
// Rotation / redimensionnement : on recale les widgets en plein écran
window.addEventListener('resize', () => document.querySelectorAll('.qj-v2.wf-media-fullboard').forEach(c => {
    _qjUnfit(c);
    _qjFitFullboard(c);
}));
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
.qj-v2 .qj-go-img{background:linear-gradient(90deg,var(--qj-accent-2),#e8508a);box-shadow:0 4px 14px rgba(255,122,89,.45)}
.qj-v2 .qj-go:hover{filter:brightness(1.1)}
.qj-v2 .qj-home{height:42px;border:0;border-radius:99px;padding:0 18px;cursor:pointer;color:#fff;font-size:13px;font-weight:600;
  background:rgba(255,255,255,.14)}
.qj-v2 .qj-home:hover{background:rgba(255,255,255,.24)}
.qj-v2 .qj-recents{display:flex;justify-content:center;margin-top:14px}
.qj-v2 .qj-recents:empty{display:none}
.qj-v2 .qj-hist-btn{height:32px;border:0;border-radius:99px;padding:0 14px;background:rgba(255,255,255,.12);color:#fff;font-size:12.5px;font-weight:600}
.qj-v2 .qj-hist-btn:hover,.qj-v2 .qj-hist-btn.is-open{background:rgba(255,255,255,.24)}
.qj-v2 .qj-hist-caret{display:inline-block;margin-left:4px;transition:transform .15s}
.qj-v2 .qj-hist-btn.is-open .qj-hist-caret{transform:rotate(180deg)}
/* Menu déroulant de l'historique */
.qj-v2 .qj-menu{position:absolute;z-index:12;display:flex;flex-direction:column;box-sizing:border-box;padding:6px;border-radius:12px;
  background:#26262f;border:1px solid #3a3a46;box-shadow:0 10px 30px rgba(0,0,0,.5);text-align:left}
.qj-v2 .qj-menu-list{flex:1;min-height:0;overflow:auto}
.qj-v2 .qj-mi{display:flex;align-items:center;gap:6px;height:32px;padding:0 4px 0 10px;border-radius:8px;color:#eee;font-size:13px}
.qj-v2 .qj-mi:hover{background:rgba(255,255,255,.1)}
.qj-v2 .qj-mi-t{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.qj-v2 .qj-mi-x{flex:none;width:24px;height:24px;border:0;border-radius:50%;background:transparent;color:#9a9aa6;font-size:10px;
  display:inline-flex;align-items:center;justify-content:center;padding:0}
.qj-v2 .qj-mi-x:hover{background:#c0392b;color:#fff}
.qj-v2 .qj-menu-clear{flex:none;margin-top:6px;height:32px;border:0;border-top:1px solid #3a3a46;border-radius:0 0 8px 8px;background:transparent;
  color:#ff8a80;font-size:12.5px;font-weight:600}
.qj-v2 .qj-menu-clear:hover{background:rgba(255,95,87,.15)}
/* Curseurs : flèche partout, sauf ce qui se clique, se tape ou se déplace */
.editor-container.qj-v2,.editor-container.qj-v2 *{cursor:default!important}
.qj-v2 .qj-stage,.qj-v2 .qj-stage *,.qj-v2 .qj-menu,.qj-v2 .qj-bar-title{user-select:none;-webkit-user-select:none}
.editor-container.qj-v2 .qj-bar,.editor-container.qj-v2 .qj-bar .qj-bar-title{cursor:grab!important;touch-action:none}
.editor-container.qj-v2 .qj-bar.is-dragging,.editor-container.qj-v2 .qj-bar.is-dragging *{cursor:grabbing!important}
.editor-container.qj-v2.wf-media-fullboard .qj-bar,.editor-container.qj-v2.wf-media-fullboard .qj-bar-title{cursor:default!important}
.editor-container.qj-v2 button,.editor-container.qj-v2 button *,.editor-container.qj-v2 .qj-mi,.editor-container.qj-v2 .qj-mi *{cursor:pointer!important}
.editor-container.qj-v2 .qj-input{cursor:text!important;user-select:text;-webkit-user-select:text}
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
