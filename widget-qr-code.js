// =========================================================================
// WIDGET QR CODE — Le Bureau du Prof
// =========================================================================
// Transforme une adresse (site, vidéo, document…) ou un petit texte en un
// grand QR code que les élèves scannent avec leur tablette.
// Dans le style des widgets « Qwant Junior » et « Dictionnaire » :
//   - barre de saisie : le QR code se met à jour pendant la frappe
//   - légende facultative sous le code (ex. « Exercice 3 — page 42 »)
//   - réglages : couleur du code, niveau de correction, légende
//   - 👁 mode projection : cache la saisie pour n'afficher que le code
//   - ⬇ télécharger en image PNG, 📋 copier l'image
//   - dernières adresses dans un menu déroulant, effaçable
//   - barre d'édition avec aide (?)
//   - déplacement en tirant la barre de titre, redimensionnement libre
//   - boutons fenêtre jaune (réduire) / vert (plein écran board) / rouge (fermer)
//   - restauré après l'actualisation du tableau
//   - fonctionne sans connexion : le générateur de QR code est intégré
//
// Utilisation : createWidget('qr-code')
// Le template #template-qr-code est injecté dans le DOM par ce fichier.
// Sauvegarde : window.qrcGetData(widget) / window.qrcSetData(widget, data)
// (appelés par save-load.js)
// =========================================================================

const _QRC_STOP = ' onpointerdown="event.stopPropagation()" onmousedown="event.stopPropagation()" ontouchstart="event.stopPropagation()"';
const _QRC_KEYS = ' onkeyup="event.stopPropagation()" onkeypress="event.stopPropagation()" onpaste="event.stopPropagation()"';
const _QRC_LS_RECENT = 'lbdp-qr-code-recents';
const _QRC_RECENT_MAX = 15;
const _QRC_COLORS = [
    ['#111111', 'Noir'], ['#1f2a44', 'Bleu nuit'], ['#1d6fd1', 'Bleu'], ['#6c3fc5', 'Violet'],
    ['#0f7a4d', 'Vert'], ['#c0392b', 'Rouge'], ['#d35400', 'Orange']
];
const _QRC_ECLS = [['L', 'Faible'], ['M', 'Moyenne'], ['Q', 'Forte'], ['H', 'Très forte']];

document.body.insertAdjacentHTML('beforeend', `
<template id="template-qr-code">
    <div class="editor-container qrc-w" style="height:560px;width:520px;">
        <div class="qrc-bar editor-toolbar" title="Glisser pour déplacer">
            <span class="qrc-bar-title">🔳 QR code</span>
            <div class="qrc-tools"${_QRC_STOP}>
                <button type="button" class="qrc-ib" data-qrc-action="present" title="Mode projection : cacher la saisie">👁</button>
                <button type="button" class="qrc-ib" data-qrc-action="download" title="Télécharger l'image (PNG)">⬇</button>
                <button type="button" class="qrc-ib" data-qrc-action="copy" title="Copier l'image">📋</button>
                <button type="button" class="qrc-ib" data-qrc-action="settings" title="Réglages">⚙</button>
                <button type="button" class="qrc-ib qrc-ib-help" data-qrc-action="help" title="Aide">?</button>
            </div>
            <div class="wf-btns"${_QRC_STOP}>
                <button class="wf-btn wf-btn-min"   title="Réduire"           onclick="toggleMediaCollapse(this.closest('.editor-container'))"></button>
                <button class="wf-btn wf-btn-max"   title="Plein écran board" onclick="toggleMediaBoardFullscreen(this.closest('.editor-container'))"></button>
                <button class="wf-btn wf-btn-close" title="Fermer"            onclick="snapshotNow();this.closest('.widget').remove();saveBoard();"></button>
            </div>
        </div>
        <div class="qrc-stage"${_QRC_STOP}>
            <div class="qrc-top">
                <div class="qrc-search">
                    <div class="qrc-field">
                        <span class="qrc-field-ico">🔗</span>
                        <input type="text" class="qrc-input" spellcheck="false" autocomplete="off"
                               placeholder="Colle une adresse ou tape un texte…"
                               onkeydown="qrcInputKey(event,this)"${_QRC_KEYS} oninput="qrcInputChanged(this)">
                        <button type="button" class="qrc-clear" data-qrc-action="clear" title="Effacer" aria-label="Effacer">✕</button>
                    </div>
                    <span class="qrc-recents"></span>
                </div>
            </div>
            <div class="qrc-view">
                <div class="qrc-card">
                    <div class="qrc-code"></div>
                    <div class="qrc-caption"></div>
                </div>
            </div>
            <div class="qrc-flash"></div>
        </div>
        <div class="qrc-panel qrc-settings" hidden${_QRC_STOP}>
            <div class="qrc-panel-card">
                <div class="qrc-panel-head">
                    <span>⚙ Réglages du QR code</span>
                    <button type="button" class="qrc-ib" data-qrc-action="settings-close" title="Fermer les réglages">✕</button>
                </div>
                <label class="qrc-row-t">Légende sous le code <span class="qrc-muted">(facultatif)</span></label>
                <input type="text" class="qrc-cap-input" maxlength="80" placeholder="Ex. : Exercice 3 — page 42"
                       onkeydown="event.stopPropagation()"${_QRC_KEYS} oninput="qrcCaptionChanged(this)">
                <div class="qrc-row-t">Couleur du code</div>
                <div class="qrc-colors">${_QRC_COLORS.map(([c, n]) =>
                    `<button type="button" class="qrc-color" data-qrc-action="color" data-c="${c}" title="${n}" style="--sw:${c}"></button>`).join('')}</div>
                <div class="qrc-row-t">Correction d'erreurs <span class="qrc-muted">(plus forte = se lit même abîmé, mais code plus dense)</span></div>
                <div class="qrc-seg">${_QRC_ECLS.map(([k, n]) =>
                    `<button type="button" class="qrc-seg-b" data-qrc-action="ecl" data-e="${k}">${n}</button>`).join('')}</div>
                <div class="qrc-info"></div>
            </div>
        </div>
        <div class="qrc-panel qrc-help" hidden${_QRC_STOP}>
            <div class="qrc-panel-card">
                <div class="qrc-panel-head">
                    <span>❓ Comment utiliser le QR code</span>
                    <button type="button" class="qrc-ib" data-qrc-action="help-close" title="Fermer l'aide">✕</button>
                </div>
                <ul class="qrc-help-list">
                    <li><b>Créer un code :</b> colle une adresse internet (site, vidéo, document en ligne…) ou tape un petit texte. Le QR code apparaît tout de suite.</li>
                    <li><b>Scanner :</b> les élèves ouvrent l'appareil photo de leur tablette et le visent vers le code.</li>
                    <li><b>👁 Mode projection :</b> cache la barre de saisie pour n'afficher que le code, en grand. Clique à nouveau pour la retrouver.</li>
                    <li><b>⬇ Télécharger :</b> enregistre le code en image PNG, à coller dans une fiche ou un cahier.</li>
                    <li><b>📋 Copier :</b> copie l'image pour la coller ailleurs (traitement de texte, ENT…).</li>
                    <li><b>⚙ Réglages :</b> ajoute une légende sous le code, change sa couleur ou le niveau de correction.</li>
                    <li><b>🕘 Historique :</b> retrouve les dernières adresses utilisées, et efface-les si besoin.</li>
                    <li><b>Fenêtre :</b> tire la barre du haut pour déplacer le widget, le coin pour l'agrandir. Bouton jaune : réduire, vert : plein écran, rouge : fermer.</li>
                </ul>
                <div class="qrc-help-note">Astuce : plus le texte est court, plus le code est simple et facile à scanner de loin. Une couleur foncée sur fond blanc se lit toujours mieux.</div>
            </div>
        </div>
    </div>
</template>
`);

/* ═════════════════════════════════════════════════════════════════
   GÉNÉRATEUR DE QR CODE (intégré, sans dépendance)
   Mode octets (UTF-8), versions 1 à 40, niveaux L / M / Q / H,
   choix automatique du meilleur masque. Algorithme de la norme ISO 18004.
   ═════════════════════════════════════════════════════════════════ */
const QrcEncoder = (function () {
    const ECC_PER_BLOCK = {
        L: [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
        M: [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
        Q: [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
        H: [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30]
    };
    const NUM_BLOCKS = {
        L: [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
        M: [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
        Q: [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
        H: [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81]
    };
    const FORMAT_BITS = { L: 1, M: 0, Q: 3, H: 2 };

    const rawModules = v => {
        let r = (16 * v + 128) * v + 64;
        if (v >= 2) {
            const n = Math.floor(v / 7) + 2;
            r -= (25 * n - 10) * n - 55;
            if (v >= 7) r -= 36;
        }
        return r;
    };
    const dataCodewords = (v, e) => Math.floor(rawModules(v) / 8) - ECC_PER_BLOCK[e][v] * NUM_BLOCKS[e][v];

    function gfMul(x, y) {
        let z = 0;
        for (let i = 7; i >= 0; i--) {
            z = (z << 1) ^ ((z >>> 7) * 0x11D);
            z ^= ((y >>> i) & 1) * x;
        }
        return z;
    }
    function rsDivisor(deg) {
        const r = [];
        for (let i = 0; i < deg - 1; i++) r.push(0);
        r.push(1);
        let root = 1;
        for (let i = 0; i < deg; i++) {
            for (let j = 0; j < r.length; j++) {
                r[j] = gfMul(r[j], root);
                if (j + 1 < r.length) r[j] ^= r[j + 1];
            }
            root = gfMul(root, 0x02);
        }
        return r;
    }
    function rsRemainder(data, div) {
        const r = div.map(() => 0);
        for (const b of data) {
            const f = b ^ r.shift();
            r.push(0);
            div.forEach((c, i) => { r[i] ^= gfMul(c, f); });
        }
        return r;
    }

    function encode(text, ecl) {
        ecl = FORMAT_BITS.hasOwnProperty(ecl) ? ecl : 'M';
        const bytes = Array.from(new TextEncoder().encode(String(text)));
        // Plus petite version qui peut contenir le texte
        let ver = 0, bits = 0;
        for (let v = 1; v <= 40; v++) {
            const ccBits = v <= 9 ? 8 : 16;
            const need = 4 + ccBits + bytes.length * 8;
            if (need <= dataCodewords(v, ecl) * 8) { ver = v; bits = ccBits; break; }
        }
        if (!ver) return null;   // trop long

        // Flux de bits : mode octets + longueur + données + bourrage
        const bb = [];
        const push = (val, len) => { for (let i = len - 1; i >= 0; i--) bb.push((val >>> i) & 1); };
        push(0x4, 4);
        push(bytes.length, bits);
        bytes.forEach(b => push(b, 8));
        const cap = dataCodewords(ver, ecl) * 8;
        push(0, Math.min(4, cap - bb.length));
        push(0, (8 - bb.length % 8) % 8);
        for (let pad = 0xEC; bb.length < cap; pad ^= 0xEC ^ 0x11) push(pad, 8);
        const data = [];
        for (let i = 0; i < bb.length; i += 8) {
            let b = 0;
            for (let j = 0; j < 8; j++) b = (b << 1) | bb[i + j];
            data.push(b);
        }

        // Correction d'erreurs Reed-Solomon et entrelacement des blocs
        const nb = NUM_BLOCKS[ecl][ver], eccLen = ECC_PER_BLOCK[ecl][ver];
        const raw = Math.floor(rawModules(ver) / 8);
        const nShort = nb - raw % nb, shortLen = Math.floor(raw / nb);
        const div = rsDivisor(eccLen);
        const blocks = [];
        for (let i = 0, k = 0; i < nb; i++) {
            const dat = data.slice(k, k + shortLen - eccLen + (i < nShort ? 0 : 1));
            k += dat.length;
            const ecc = rsRemainder(dat, div);
            if (i < nShort) dat.push(0);
            blocks.push(dat.concat(ecc));
        }
        const all = [];
        for (let i = 0; i < blocks[0].length; i++) {
            blocks.forEach((blk, j) => {
                if (i !== shortLen - eccLen || j >= nShort) all.push(blk[i]);
            });
        }

        // Matrice
        const size = ver * 4 + 17;
        const mod = [], fn = [];
        for (let y = 0; y < size; y++) { mod.push(new Array(size).fill(false)); fn.push(new Array(size).fill(false)); }
        const setF = (x, y, d) => { mod[y][x] = d; fn[y][x] = true; };

        for (let i = 0; i < size; i++) { setF(6, i, i % 2 === 0); setF(i, 6, i % 2 === 0); }
        const finder = (cx, cy) => {
            for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
                const x = cx + dx, y = cy + dy;
                if (x < 0 || y < 0 || x >= size || y >= size) continue;
                const d = Math.max(Math.abs(dx), Math.abs(dy));
                setF(x, y, d !== 2 && d !== 4);
            }
        };
        finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
        // Motifs d'alignement
        const align = [];
        if (ver > 1) {
            const n = Math.floor(ver / 7) + 2;
            const step = ver === 32 ? 26 : Math.ceil((ver * 4 + 4) / (n * 2 - 2)) * 2;
            align.push(6);
            for (let pos = size - 7; align.length < n; pos -= step) align.splice(1, 0, pos);
        }
        const na = align.length;
        for (let i = 0; i < na; i++) for (let j = 0; j < na; j++) {
            if ((i === 0 && j === 0) || (i === 0 && j === na - 1) || (i === na - 1 && j === 0)) continue;
            for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++)
                setF(align[i] + dx, align[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
        }
        const bit = (v, i) => ((v >>> i) & 1) !== 0;
        const drawFormat = mask => {
            const d = FORMAT_BITS[ecl] << 3 | mask;
            let rem = d;
            for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
            const b = (d << 10 | rem) ^ 0x5412;
            for (let i = 0; i <= 5; i++) setF(8, i, bit(b, i));
            setF(8, 7, bit(b, 6)); setF(8, 8, bit(b, 7)); setF(7, 8, bit(b, 8));
            for (let i = 9; i < 15; i++) setF(14 - i, 8, bit(b, i));
            for (let i = 0; i < 8; i++) setF(size - 1 - i, 8, bit(b, i));
            for (let i = 8; i < 15; i++) setF(8, size - 15 + i, bit(b, i));
            setF(8, size - 8, true);
        };
        drawFormat(0);
        if (ver >= 7) {
            let rem = ver;
            for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
            const b = ver << 12 | rem;
            for (let i = 0; i < 18; i++) {
                const v = bit(b, i), a = size - 11 + i % 3, c = Math.floor(i / 3);
                setF(a, c, v); setF(c, a, v);
            }
        }
        // Placement des données en zigzag
        let idx = 0;
        for (let right = size - 1; right >= 1; right -= 2) {
            if (right === 6) right = 5;
            for (let vert = 0; vert < size; vert++) for (let j = 0; j < 2; j++) {
                const x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - vert : vert;
                if (!fn[y][x] && idx < all.length * 8) {
                    mod[y][x] = bit(all[idx >>> 3], 7 - (idx & 7));
                    idx++;
                }
            }
        }
        // Masques
        const maskFn = [
            (x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x, y) => x % 3 === 0, (x, y) => (x + y) % 3 === 0,
            (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => x * y % 2 + x * y % 3 === 0,
            (x, y) => (x * y % 2 + x * y % 3) % 2 === 0, (x, y) => ((x + y) % 2 + x * y % 3) % 2 === 0
        ];
        const applyMask = m => {
            for (let y = 0; y < size; y++) for (let x = 0; x < size; x++)
                if (!fn[y][x] && maskFn[m](x, y)) mod[y][x] = !mod[y][x];
        };
        const penalty = () => {
            let p = 0, dark = 0;
            const get = (x, y) => x >= 0 && y >= 0 && x < size && y < size && mod[y][x];
            const PAT = [true, false, true, true, true, false, true];
            for (let pass = 0; pass < 2; pass++) {
                for (let a = 0; a < size; a++) {
                    const at = b => pass ? get(a, b) : get(b, a);
                    let run = 1;
                    for (let b = 1; b <= size; b++) {
                        if (b < size && at(b) === at(b - 1)) run++;
                        else { if (run >= 5) p += run - 2; run = 1; }
                    }
                    for (let b = -4; b < size; b++) {
                        let ok = true;
                        for (let k = 0; k < 7 && ok; k++) if (at(b + k) !== PAT[k]) ok = false;
                        if (!ok) continue;
                        let before = true, after = true;
                        for (let k = 1; k <= 4; k++) { if (at(b - k)) before = false; if (at(b + 6 + k)) after = false; }
                        if (before || after) p += 40;
                    }
                }
            }
            for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
                if (mod[y][x]) dark++;
                if (x < size - 1 && y < size - 1) {
                    const c = mod[y][x];
                    if (c === mod[y][x + 1] && c === mod[y + 1][x] && c === mod[y + 1][x + 1]) p += 3;
                }
            }
            const total = size * size;
            p += (Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10;
            return p;
        };
        let best = 0, bestP = Infinity;
        for (let m = 0; m < 8; m++) {
            applyMask(m); drawFormat(m);
            const pn = penalty();
            if (pn < bestP) { bestP = pn; best = m; }
            applyMask(m);
        }
        applyMask(best); drawFormat(best);
        return { size, version: ver, ecl, modules: mod };
    }
    return { encode };
})();
window.QrcEncoder = QrcEncoder;

/* ── Outils ─────────────────────────────────────────────────────── */
const _qrcEsc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function _qrcLsGet(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }
function _qrcLsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
const _qrcIsUrl = s => /^(https?:\/\/|www\.)\S+$/i.test(String(s).trim());
function _qrcSave() { if (typeof saveBoard === 'function') try { saveBoard(); } catch (e) {} }

function _qrcFlash(c, text, ms) {
    const f = c && c.querySelector('.qrc-flash');
    if (!f) return;
    f.textContent = text;
    f.classList.remove('is-on'); void f.offsetWidth; f.classList.add('is-on');
    clearTimeout(f._t);
    f._t = setTimeout(() => f.classList.remove('is-on'), ms || 2000);
}
function _qrcNudge(c, msg) {
    const field = c.querySelector('.qrc-field');
    if (field) {
        field.classList.remove('is-bad'); void field.offsetWidth; field.classList.add('is-bad');
        clearTimeout(field._t);
        field._t = setTimeout(() => field.classList.remove('is-bad'), 1200);
    }
    if (msg) _qrcFlash(c, msg);
    if (c.classList.contains('is-present')) return;
    const input = c.querySelector('.qrc-input');
    if (input) try { input.focus({ preventScroll: true }); } catch (e) {}
}

/* ── État du widget ─────────────────────────────────────────────── */
function _qrcState(c) {
    if (!c._qrc) c._qrc = { text: '', caption: '', color: '#111111', ecl: 'M', present: false };
    return c._qrc;
}

/* ── Affichage du code ──────────────────────────────────────────── */
function _qrcSvg(qr, color) {
    const q = 4, n = qr.size + q * 2;
    let d = '';
    for (let y = 0; y < qr.size; y++) {
        let x = 0;
        while (x < qr.size) {
            if (!qr.modules[y][x]) { x++; continue; }
            let w = 1;
            while (x + w < qr.size && qr.modules[y][x + w]) w++;
            d += `M${x + q} ${y + q}h${w}v1h-${w}z`;
            x += w;
        }
    }
    return `<svg class="qrc-svg" viewBox="0 0 ${n} ${n}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" role="img" aria-label="QR code">` +
           `<rect width="${n}" height="${n}" fill="#fff"/><path d="${d}" fill="${_qrcEsc(color)}"/></svg>`;
}
function _qrcRender(c) {
    const st = _qrcState(c);
    const box = c.querySelector('.qrc-code'), cap = c.querySelector('.qrc-caption');
    const card = c.querySelector('.qrc-card');
    if (!box || !cap || !card) return;
    const text = st.text.trim();
    c._qrcQr = null;
    if (!text) {
        card.classList.add('is-empty');
        box.innerHTML = `<div class="qrc-empty"><div class="qrc-empty-ico">🔳</div>
            <div class="qrc-empty-t">Ton QR code apparaîtra ici</div>
            <div class="qrc-empty-s">Colle une adresse internet ou tape un petit texte dans la barre.</div></div>`;
        cap.textContent = '';
        cap.hidden = true;
    } else {
        const qr = QrcEncoder.encode(text, st.ecl);
        if (!qr) {
            card.classList.add('is-empty');
            box.innerHTML = `<div class="qrc-empty"><div class="qrc-empty-ico">⚠️</div>
                <div class="qrc-empty-t">Texte trop long</div>
                <div class="qrc-empty-s">Un QR code ne peut pas contenir autant de caractères. Raccourcis le texte ou choisis une correction plus faible.</div></div>`;
            cap.hidden = true;
        } else {
            card.classList.remove('is-empty');
            c._qrcQr = qr;
            box.innerHTML = _qrcSvg(qr, st.color);
            const shown = st.caption.trim() || (text.length > 60 ? text.slice(0, 57) + '…' : text);
            cap.textContent = shown;
            cap.classList.toggle('is-auto', !st.caption.trim());
            cap.hidden = false;
        }
    }
    _qrcRenderSettings(c);
    _qrcFit(c);
}
// Le code reste carré et occupe le plus de place possible
function _qrcFit(c) {
    const view = c.querySelector('.qrc-view'), code = c.querySelector('.qrc-code'), cap = c.querySelector('.qrc-caption');
    if (!view || !code) return;
    const card = c.querySelector('.qrc-card');
    if (card && card.classList.contains('is-empty')) { code.style.width = code.style.height = ''; return; }
    const cs = getComputedStyle(view);
    const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    const capH = cap && !cap.hidden ? cap.offsetHeight + 10 : 0;
    const availW = view.clientWidth - padX, availH = view.clientHeight - padY;
    let side = Math.max(80, Math.floor(Math.min(availW - 28, availH - 28 - capH)));
    code.style.width = code.style.height = side + 'px';
    // Correction : si la carte dépasse encore (légende, marges), on réduit d'autant
    if (card) {
        const over = Math.max(card.scrollHeight - availH, card.scrollWidth - availW);
        if (over > 0) {
            side = Math.max(80, side - Math.ceil(over));
            code.style.width = code.style.height = side + 'px';
        }
    }
}
function _qrcRenderSettings(c) {
    const st = _qrcState(c);
    c.querySelectorAll('.qrc-color').forEach(b => b.classList.toggle('is-on', b.getAttribute('data-c') === st.color));
    c.querySelectorAll('.qrc-seg-b').forEach(b => b.classList.toggle('is-on', b.getAttribute('data-e') === st.ecl));
    const capIn = c.querySelector('.qrc-cap-input');
    if (capIn && capIn.value !== st.caption) { capIn.value = st.caption; }
    if (capIn) { if (capIn.value) capIn.setAttribute('value', capIn.value); else capIn.removeAttribute('value'); }
    const info = c.querySelector('.qrc-info');
    if (info) {
        const qr = c._qrcQr;
        info.textContent = qr
            ? `${st.text.trim().length} caractère${st.text.trim().length > 1 ? 's' : ''} · code de ${qr.size} × ${qr.size} cases (version ${qr.version})`
            : '';
    }
    c.classList.toggle('is-present', !!st.present);
    const pb = c.querySelector('[data-qrc-action="present"]');
    if (pb) {
        pb.classList.toggle('is-on', !!st.present);
        pb.title = st.present ? 'Afficher la saisie' : 'Mode projection : cacher la saisie';
    }
}

/* ── Saisie ─────────────────────────────────────────────────────── */
function qrcInputKey(e, input) {
    e.stopPropagation();                        // pas de raccourcis du tableau pendant la saisie
    const c = input.closest('.qrc-w');
    if (e.key === 'Enter') {
        e.preventDefault();
        const t = input.value.trim();
        if (!t) { _qrcNudge(c, 'Colle d’abord une adresse ou tape un texte'); return; }
        _qrcAddRecent(t);
        input.blur();
        _qrcFlash(c, '✅ QR code prêt à être scanné');
    } else if (e.key === 'Escape') input.blur();
}
function qrcInputChanged(input) {
    const c = input.closest('.qrc-w');
    const field = input.closest('.qrc-field');
    if (field) { field.classList.toggle('has-text', !!input.value.trim()); field.classList.remove('is-bad'); }
    if (input.value) input.setAttribute('value', input.value); else input.removeAttribute('value');
    if (!c) return;
    _qrcState(c).text = input.value;
    clearTimeout(c._qrcT);
    c._qrcT = setTimeout(() => {
        _qrcRender(c);
        _qrcSave();
        clearTimeout(c._qrcRT);
        // Mémorisé dans l'historique après une petite pause de frappe
        c._qrcRT = setTimeout(() => { const t = input.value.trim(); if (t.length >= 3) _qrcAddRecent(t); }, 2500);
    }, 120);
}
function qrcCaptionChanged(input) {
    const c = input.closest('.qrc-w');
    if (!c) return;
    _qrcState(c).caption = input.value;
    if (input.value) input.setAttribute('value', input.value); else input.removeAttribute('value');
    clearTimeout(c._qrcCT);
    c._qrcCT = setTimeout(() => { _qrcRender(c); _qrcSave(); }, 120);
}
function _qrcSetText(c, t) {
    const input = c.querySelector('.qrc-input');
    if (input) { input.value = t; qrcInputChanged(input); }
    clearTimeout(c._qrcT);
    _qrcState(c).text = t;
    _qrcRender(c);
    _qrcSave();
}

/* ── Image PNG (téléchargement / copie) ─────────────────────────── */
function _qrcCanvas(c) {
    const qr = c._qrcQr, st = _qrcState(c);
    if (!qr) return null;
    const q = 4, n = qr.size + q * 2;
    const scale = Math.max(4, Math.floor(1024 / n));
    const side = n * scale;
    const caption = (st.caption || '').trim();
    const capH = caption ? Math.round(side * 0.13) : 0;
    const cv = document.createElement('canvas');
    cv.width = side; cv.height = side + capH;
    const g = cv.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height);
    g.fillStyle = st.color;
    for (let y = 0; y < qr.size; y++) for (let x = 0; x < qr.size; x++)
        if (qr.modules[y][x]) g.fillRect((x + q) * scale, (y + q) * scale, scale, scale);
    if (caption) {
        let fs = Math.round(capH * 0.55);
        g.font = `700 ${fs}px system-ui,-apple-system,"Segoe UI",sans-serif`;
        while (fs > 10 && g.measureText(caption).width > side - 2 * q * scale) {
            fs -= 2; g.font = `700 ${fs}px system-ui,-apple-system,"Segoe UI",sans-serif`;
        }
        g.fillStyle = '#1f2a44'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(caption, side / 2, side - q * scale * 0.4 + capH / 2);
    }
    return cv;
}
function _qrcFileName(c) {
    const st = _qrcState(c);
    const base = (st.caption.trim() || st.text.trim().replace(/^https?:\/\/(www\.)?/i, ''))
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 40).toLowerCase();
    return 'qr-code' + (base ? '-' + base : '') + '.png';
}
function _qrcDownload(c) {
    const cv = _qrcCanvas(c);
    if (!cv) { _qrcNudge(c, 'Crée d’abord un QR code'); return; }
    const a = document.createElement('a');
    a.href = cv.toDataURL('image/png');
    a.download = _qrcFileName(c);
    document.body.appendChild(a); a.click(); a.remove();
    _qrcFlash(c, '⬇ Image téléchargée');
}
function _qrcCopy(c) {
    const cv = _qrcCanvas(c);
    if (!cv) { _qrcNudge(c, 'Crée d’abord un QR code'); return; }
    if (!navigator.clipboard || typeof ClipboardItem === 'undefined') {
        _qrcFlash(c, '⚠ Copie impossible ici : utilise ⬇ Télécharger', 3000); return;
    }
    cv.toBlob(blob => {
        if (!blob) { _qrcFlash(c, '⚠ Copie impossible'); return; }
        navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
            .then(() => _qrcFlash(c, '📋 Image copiée : colle-la où tu veux'))
            .catch(() => _qrcFlash(c, '⚠ Copie refusée par le navigateur : utilise ⬇ Télécharger', 3500));
    }, 'image/png');
}

/* ── Dernières adresses ─────────────────────────────────────────── */
const _qrcRecentList = () => _qrcLsGet(_QRC_LS_RECENT, []).filter(x => typeof x === 'string').slice(0, _QRC_RECENT_MAX);
function _qrcRenderAll() { document.querySelectorAll('.qrc-w').forEach(_qrcRenderRecents); }
function _qrcAddRecent(t) {
    const list = _qrcRecentList().filter(x => x !== t && !(t.startsWith(x) && x.length < t.length && Date.now() - (_qrcAddRecent._t || 0) < 6000));
    list.unshift(t);
    _qrcAddRecent._t = Date.now();
    _qrcLsSet(_QRC_LS_RECENT, list.slice(0, _QRC_RECENT_MAX));
    _qrcRenderAll();
}
function _qrcRenderRecents(c) {
    const box = c.querySelector('.qrc-recents');
    if (!box) return;
    const list = _qrcRecentList();
    const open = !!c.querySelector('.qrc-menu');
    box.innerHTML = list.length
        ? `<button type="button" class="qrc-hist-btn${open ? ' is-open' : ''}" data-qrc-action="hist-toggle" aria-haspopup="true" aria-expanded="${open}" title="Dernières adresses">🕘 <span class="qrc-hist-caret">▾</span></button>`
        : '';
    if (open) { if (list.length) _qrcMenuBuild(c); else _qrcMenuClose(c); }
}
function _qrcMenuBuild(c) {
    let m = c.querySelector('.qrc-menu');
    if (!m) {
        m = document.createElement('div');
        m.className = 'qrc-menu';
        m.setAttribute('role', 'menu');
        ['pointerdown', 'mousedown', 'touchstart'].forEach(t => m.addEventListener(t, ev => ev.stopPropagation()));
        c.appendChild(m);
    }
    m.innerHTML = '<div class="qrc-menu-t">Dernières adresses</div><div class="qrc-menu-list">' + _qrcRecentList().map(t =>
        `<div class="qrc-mi" role="menuitem" data-qrc-action="recent" data-t="${_qrcEsc(t)}" title="${_qrcEsc(t)}">` +
        `<span class="qrc-mi-ico">${_qrcIsUrl(t) ? '🔗' : '📝'}</span><span class="qrc-mi-t">${_qrcEsc(t.replace(/^https?:\/\/(www\.)?/i, ''))}</span>` +
        `<button type="button" class="qrc-mi-x" data-qrc-action="recent-del" data-t="${_qrcEsc(t)}" title="Retirer de l’historique" aria-label="Retirer">✕</button></div>`).join('') +
        '</div><button type="button" class="qrc-menu-clear" data-qrc-action="hist-clear">🗑 Effacer tout l’historique</button>';
    _qrcMenuPlace(c, m);
}
function _qrcMenuPlace(c, m) {
    const btn = c.querySelector('.qrc-hist-btn');
    if (!btn) return;
    const cr = c.getBoundingClientRect(), br = btn.getBoundingClientRect();
    const s = (c.offsetHeight && cr.height / c.offsetHeight) || 1;
    const H = c.offsetHeight, W = c.offsetWidth;
    const bTop = (br.top - cr.top) / s, bBot = (br.bottom - cr.top) / s;
    const bRight = (br.right - cr.left) / s;
    const w = Math.min(300, W - 16);
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
function _qrcMenuClose(c) {
    const m = c && c.querySelector('.qrc-menu');
    if (m) m.remove();
    const b = c && c.querySelector('.qrc-hist-btn');
    if (b) { b.classList.remove('is-open'); b.setAttribute('aria-expanded', 'false'); }
}
function _qrcMenuToggle(c) {
    if (c.querySelector('.qrc-menu')) { _qrcMenuClose(c); return; }
    document.querySelectorAll('.qrc-w').forEach(o => { if (o !== c) _qrcMenuClose(o); });
    _qrcMenuBuild(c);
    const b = c.querySelector('.qrc-hist-btn');
    if (b) { b.classList.add('is-open'); b.setAttribute('aria-expanded', 'true'); }
}
document.addEventListener('pointerdown', e => {
    const t = e.target;
    if (t && t.closest && (t.closest('.qrc-menu') || t.closest('.qrc-hist-btn'))) return;
    document.querySelectorAll('.qrc-w .qrc-menu').forEach(m => _qrcMenuClose(m.closest('.qrc-w')));
}, true);
document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.qrc-w .qrc-menu').forEach(m => _qrcMenuClose(m.closest('.qrc-w')));
    document.querySelectorAll('.qrc-w .qrc-panel:not([hidden])').forEach(h => { h.hidden = true; });
}, true);

function _qrcPanel(c, which, force) {
    const p = c.querySelector('.qrc-' + which), other = c.querySelector(which === 'help' ? '.qrc-settings' : '.qrc-help');
    if (!p) return;
    p.hidden = force === undefined ? !p.hidden : !force;
    if (!p.hidden && other) other.hidden = true;
    _qrcMenuClose(c);
}

/* ── Clics (délégués : survivent à la sauvegarde / restauration) ─── */
document.addEventListener('click', e => {
    const btn = e.target.closest && e.target.closest('[data-qrc-action]');
    if (!btn) return;
    const c = btn.closest('.qrc-w');
    if (!c) return;
    const st = _qrcState(c);
    switch (btn.getAttribute('data-qrc-action')) {
        case 'clear': {
            _qrcSetText(c, '');
            const input = c.querySelector('.qrc-input');
            if (input) input.focus();
            break;
        }
        case 'present':
            st.present = !st.present;
            _qrcRenderSettings(c);
            _qrcMenuClose(c);
            requestAnimationFrame(() => _qrcFit(c));
            _qrcSave();
            break;
        case 'download': _qrcDownload(c); break;
        case 'copy':     _qrcCopy(c); break;
        case 'settings': _qrcPanel(c, 'settings'); break;
        case 'settings-close': _qrcPanel(c, 'settings', false); break;
        case 'help':     _qrcPanel(c, 'help'); break;
        case 'help-close': _qrcPanel(c, 'help', false); break;
        case 'color':
            st.color = btn.getAttribute('data-c') || '#111111';
            _qrcRender(c); _qrcSave();
            break;
        case 'ecl':
            st.ecl = btn.getAttribute('data-e') || 'M';
            _qrcRender(c); _qrcSave();
            break;
        case 'hist-toggle': _qrcMenuToggle(c); break;
        case 'recent':
            _qrcMenuClose(c);
            _qrcSetText(c, btn.getAttribute('data-t') || '');
            break;
        case 'recent-del': {
            e.stopPropagation();
            const t = btn.getAttribute('data-t');
            _qrcLsSet(_QRC_LS_RECENT, _qrcRecentList().filter(x => x !== t));
            _qrcRenderAll();
            break;
        }
        case 'hist-clear':
            _qrcLsSet(_QRC_LS_RECENT, []);
            document.querySelectorAll('.qrc-w').forEach(_qrcMenuClose);
            _qrcRenderAll();
            _qrcFlash(c, '🗑 Historique effacé');
            break;
    }
});

/* ── Déplacement du widget en tirant la barre de titre ───────────── */
function _qrcDragStart(e) {
    const bar = e.currentTarget, c = bar.closest('.qrc-w');
    if (!c || (e.button !== undefined && e.button !== 0)) return;
    if (e.target.closest('button, .wf-btns, .qrc-tools, input')) return;
    e.stopPropagation();                                    // le tableau ne gère pas ce glisser
    if (c.classList.contains('wf-media-fullboard')) return; // pas de déplacement en plein écran
    e.preventDefault();
    _qrcMenuClose(c);
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
        if (moved) _qrcSave();
    };
    bar.addEventListener('pointermove', move);
    bar.addEventListener('pointerup', end);
    bar.addEventListener('pointercancel', end);
}
function _qrcBindDrag(c) {
    const bar = c.querySelector('.qrc-bar');
    if (!bar || bar._qrcDrag) return;
    bar._qrcDrag = true;
    bar.addEventListener('pointerdown', _qrcDragStart);
    ['mousedown', 'touchstart'].forEach(t => bar.addEventListener(t, ev => {
        if (!ev.target.closest('button, .wf-btns')) ev.stopPropagation();
    }));
}

/* ── Mise en route des widgets (nouveaux ou restaurés) ───────────── */
function _qrcInit(c) {
    if (!c || c._qrcInited || !c.classList.contains('qrc-w')) return;
    c._qrcInited = true;
    const bar = c.querySelector('.qrc-bar');
    if (bar) { bar.classList.add('editor-toolbar'); bar.title = 'Glisser pour déplacer'; }
    c.querySelectorAll('.qrc-menu').forEach(m => m.remove());
    c.querySelectorAll('.qrc-panel').forEach(p => { p.hidden = true; });
    const st = _qrcState(c);
    const input = c.querySelector('.qrc-input');
    if (input) {
        if (!st.text && input.value) st.text = input.value;
        input.value = st.text;
        const field = input.closest('.qrc-field');
        if (field) field.classList.toggle('has-text', !!input.value.trim());
    }
    _qrcBindDrag(c);
    _qrcRenderRecents(c);
    _qrcRender(c);
    if (typeof ResizeObserver === 'function') {
        const view = c.querySelector('.qrc-view');
        if (view) new ResizeObserver(() => _qrcFit(c)).observe(view);
    }
    new MutationObserver(() => _qrcFitFullboard(c)).observe(c, { attributes: true, attributeFilter: ['class'] });
    _qrcFitFullboard(c);
}

/* ── Plein écran sur téléphone : laisser la place des onglets À GAUCHE ──
   Même principe que Qwant Junior et le Dictionnaire : les onglets latéraux
   occupent 40 px à gauche ; le plein écran commence donc à 40 px du bord et
   va jusqu'au bord droit, avec correction si le tableau est décalé ou mis
   à l'échelle. */
const _QRC_PHONE_Q = '(max-width: 768px), (max-height: 500px) and (pointer: coarse)';
const _QRC_TABS_W = 40;
const _QRC_FS_PROPS = ['position', 'inset', 'top', 'right', 'bottom', 'left', 'width', 'height', 'max-width', 'max-height', 'margin', 'transform'];
function _qrcIsPhone() {
    if (typeof window.isPhoneScreen === 'function') return window.isPhoneScreen();
    return !!(window.matchMedia && window.matchMedia(_QRC_PHONE_Q).matches);
}
function _qrcFitFullboard(c) {
    const on = c.classList.contains('wf-media-fullboard') && _qrcIsPhone();
    if (!on) { _qrcUnfit(c); return; }
    if (c._qrcFsBusy) return;
    c._qrcFsBusy = true;
    if (!c._qrcFsFitted) {
        c._qrcFsSaved = {};
        _QRC_FS_PROPS.forEach(p => { c._qrcFsSaved[p] = [c.style.getPropertyValue(p), c.style.getPropertyPriority(p)]; });
    }
    c._qrcFsMine = c._qrcFsMine || {};
    const set = (p, v) => { c.style.setProperty(p, v, 'important'); c._qrcFsMine[p] = c.style.getPropertyValue(p); };
    const vw = window.innerWidth, vh = window.innerHeight;
    set('position', 'fixed'); set('inset', 'auto'); set('margin', '0'); set('transform', 'none');
    set('top', '0px'); set('left', _QRC_TABS_W + 'px');
    set('right', 'auto'); set('bottom', 'auto');
    set('width', (vw - _QRC_TABS_W) + 'px'); set('height', vh + 'px');
    set('max-width', 'none'); set('max-height', 'none');
    c._qrcFsFitted = true;
    const r = c.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
        const sx = r.width / (vw - _QRC_TABS_W), sy = r.height / vh;
        const left = _QRC_TABS_W + (_QRC_TABS_W - r.left) / sx;
        const top  = (0 - r.top) / sy;
        if (Math.abs(r.left - _QRC_TABS_W) > 1 || Math.abs(sx - 1) > 0.01) {
            set('left', left + 'px');
            set('width', ((vw - _QRC_TABS_W) / sx) + 'px');
        }
        if (Math.abs(r.top) > 1 || Math.abs(sy - 1) > 0.01) {
            set('top', top + 'px');
            set('height', (vh / sy) + 'px');
        }
    }
    c._qrcFsBusy = false;
}
function _qrcUnfit(c) {
    if (!c._qrcFsFitted) return;
    const saved = c._qrcFsSaved || {}, mine = c._qrcFsMine || {};
    _QRC_FS_PROPS.forEach(p => {
        if (!(p in mine) || c.style.getPropertyValue(p) !== mine[p]) return;
        const v = saved[p];
        if (v && v[0]) c.style.setProperty(p, v[0], v[1]); else c.style.removeProperty(p);
    });
    c._qrcFsFitted = false; c._qrcFsMine = {}; c._qrcFsSaved = null;
}
window.addEventListener('resize', () => document.querySelectorAll('.qrc-w').forEach(c => {
    if (c.classList.contains('wf-media-fullboard')) { _qrcUnfit(c); _qrcFitFullboard(c); }
    _qrcFit(c);
}));

function _qrcScan(n) {
    if (!n || n.nodeType !== 1) return;
    if (n.matches('.qrc-w')) _qrcInit(n);
    else if (n.querySelectorAll) n.querySelectorAll('.qrc-w').forEach(_qrcInit);
}
new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => {
    if (n.nodeType === 1 && n.closest && n.closest('.qrc-stage, .qrc-bar, .qrc-panel')) return;
    _qrcScan(n);
}))).observe(document.body, { childList: true, subtree: true });

/* ── Sauvegarde / restauration (appelées par save-load.js) ──────── */
window.qrcGetData = function (widget) {
    const c = widget && widget.querySelector('.qrc-w');
    if (!c) return null;
    const st = _qrcState(c);
    return { text: st.text, caption: st.caption, color: st.color, ecl: st.ecl, present: !!st.present };
};
window.qrcSetData = function (widget, d) {
    const c = widget && widget.querySelector('.qrc-w');
    if (!c || !d) return;
    const st = _qrcState(c);
    st.text    = typeof d.text === 'string' ? d.text : '';
    st.caption = typeof d.caption === 'string' ? d.caption : '';
    st.color   = /^#[0-9a-f]{6}$/i.test(d.color || '') ? d.color : '#111111';
    st.ecl     = ['L', 'M', 'Q', 'H'].indexOf(d.ecl) !== -1 ? d.ecl : 'M';
    st.present = !!d.present;
    const input = c.querySelector('.qrc-input');
    if (input) { input.value = st.text; if (st.text) input.setAttribute('value', st.text); }
    if (!c._qrcInited) _qrcInit(c);
    else _qrcRender(c);
    const field = c.querySelector('.qrc-field');
    if (field) field.classList.toggle('has-text', !!st.text.trim());
    // Recalage de la taille une fois le widget posé sur le tableau
    setTimeout(() => _qrcFit(c), 80);
};

window.createQrCodeWidget = function () {
    return typeof createWidget === 'function' ? createWidget('qr-code') : null;
};

/* ── Styles ─────────────────────────────────────────────────────── */
(function () {
    if (document.getElementById('qrc-styles')) return;
    const st = document.createElement('style');
    st.id = 'qrc-styles';
    st.textContent = `
.editor-container.qrc-w{
  --qrc-accent:#6c5ce7;
  container-type:inline-size; position:relative; display:flex; flex-direction:column;
  overflow:hidden; box-sizing:border-box; padding:0; background:#18181c; color:#eee;
  font-family:system-ui,-apple-system,"Segoe UI",sans-serif; font-size:13px;
}
.qrc-w button{font-family:inherit}
.qrc-w :focus-visible{outline:2px solid var(--qrc-accent);outline-offset:2px}
/* Barre du haut */
.qrc-w .qrc-bar{flex:none;position:relative;z-index:10;height:40px;min-height:0;box-sizing:border-box;display:flex;flex-wrap:nowrap;align-items:center;gap:6px;
  padding:0 10px;background:#232329;border-bottom:1px solid #2f2f37;visibility:visible;opacity:1;user-select:none;-webkit-user-select:none}
.qrc-w .qrc-bar-title{flex:1;min-width:0;font-weight:700;font-size:13px;color:#e6e6ea;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.qrc-w .qrc-tools{flex:none;display:flex;align-items:center;gap:2px;margin-right:4px}
.qrc-w .qrc-ib{flex:none;min-width:30px;height:30px;border:0;border-radius:8px;background:transparent;color:#9a9aa6;
  font-size:14px;font-weight:800;line-height:1;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;padding:0 6px}
.qrc-w .qrc-ib:hover{background:rgba(255,255,255,.1);color:#fff}
.qrc-w .qrc-ib.is-on{background:rgba(108,92,231,.35);color:#fff}
.qrc-w .qrc-ib-help{width:26px;min-width:26px;height:26px;border-radius:50%;background:rgba(108,92,231,.25);color:#c3b9ff;margin-left:2px;font-size:13px}
.qrc-w .qrc-ib-help:hover{background:var(--qrc-accent);color:#fff}
/* Zone principale */
.qrc-w .qrc-stage{position:relative;flex:1;min-height:0;display:flex;flex-direction:column;
  background:radial-gradient(circle at 12% 10%,rgba(108,92,231,.40),transparent 45%),radial-gradient(circle at 88% 95%,rgba(232,80,138,.32),transparent 50%),#1c1b2b}
.qrc-w .qrc-top{flex:none;padding:14px 16px 6px}
.qrc-w.is-present .qrc-top{display:none}
.qrc-w .qrc-search{display:flex;align-items:center;gap:8px;max-width:640px;margin:0 auto}
.qrc-w .qrc-field{flex:1;min-width:0;display:flex;align-items:center;height:clamp(42px,8cqw,50px);box-sizing:border-box;padding:0 6px 0 14px;
  background:#fff;border:3px solid transparent;border-radius:99px;box-shadow:0 6px 20px rgba(0,0,0,.35);transition:border-color .15s}
.qrc-w .qrc-field:focus-within{border-color:var(--qrc-accent)}
.qrc-w .qrc-field.is-bad{border-color:#ff5f57;animation:qrc-shake .3s}
@keyframes qrc-shake{25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
.qrc-w .qrc-field-ico{flex:none;font-size:17px;margin-right:8px}
.qrc-w .qrc-input{flex:1;min-width:0;height:100%;border:0;outline:0;background:transparent;color:#222;font:inherit;
  font-size:clamp(15px,3.2cqw,19px);padding:0;user-select:text;-webkit-user-select:text}
.qrc-w .qrc-input::placeholder{color:#9a9aa6}
.qrc-w .qrc-clear{display:none;flex:none;width:30px;height:30px;border:0;border-radius:50%;background:transparent;color:#999;
  font-size:13px;align-items:center;justify-content:center;padding:0}
.qrc-w .qrc-clear:hover{background:#eee;color:#333}
.qrc-w .qrc-field.has-text .qrc-clear{display:inline-flex}
.qrc-w .qrc-recents{flex:none;display:flex}
.qrc-w .qrc-recents:empty{display:none}
.qrc-w .qrc-hist-btn{height:clamp(42px,8cqw,50px);border:0;border-radius:99px;padding:0 14px;background:rgba(255,255,255,.14);color:#fff;font-size:14px;font-weight:700;white-space:nowrap}
.qrc-w .qrc-hist-btn:hover,.qrc-w .qrc-hist-btn.is-open{background:rgba(255,255,255,.26)}
.qrc-w .qrc-hist-caret{display:inline-block;transition:transform .15s}
.qrc-w .qrc-hist-btn.is-open .qrc-hist-caret{transform:rotate(180deg)}
/* Le code */
.qrc-w .qrc-view{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:10px 16px 16px;box-sizing:border-box;overflow:hidden}
.qrc-w .qrc-card{display:flex;flex-direction:column;align-items:center;gap:10px;max-width:100%;max-height:100%;box-sizing:border-box;
  background:#fff;border-radius:18px;padding:14px;box-shadow:0 10px 30px rgba(0,0,0,.4)}
.qrc-w .qrc-code{flex:none;display:flex;align-items:center;justify-content:center}
.qrc-w .qrc-svg{display:block;width:100%;height:100%}
.qrc-w .qrc-caption{flex:none;max-width:100%;color:#1f2a44;font-weight:800;font-size:clamp(14px,4.2cqw,26px);line-height:1.2;text-align:center;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:0 4px}
.qrc-w .qrc-caption.is-auto{color:#7a7a88;font-weight:600;font-size:clamp(12px,2.8cqw,16px)}
.qrc-w .qrc-caption[hidden]{display:none}
.qrc-w .qrc-card.is-empty{padding:26px 22px;max-width:380px}
.qrc-w .qrc-empty{text-align:center;color:#2a2a33}
.qrc-w .qrc-empty-ico{font-size:42px;line-height:1;margin-bottom:8px}
.qrc-w .qrc-empty-t{font-size:18px;font-weight:800;color:#1f2a44}
.qrc-w .qrc-empty-s{margin-top:6px;color:#6b6b78;font-size:13.5px;line-height:1.4}
/* Menu déroulant de l'historique */
.qrc-w .qrc-menu{position:absolute;z-index:12;display:flex;flex-direction:column;box-sizing:border-box;padding:6px;border-radius:12px;
  background:#26262f;border:1px solid #3a3a46;box-shadow:0 10px 30px rgba(0,0,0,.5);text-align:left}
.qrc-w .qrc-menu-t{flex:none;padding:4px 10px 6px;color:#9a9aa6;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px}
.qrc-w .qrc-menu-list{flex:1;min-height:0;overflow:auto}
.qrc-w .qrc-mi{display:flex;align-items:center;gap:6px;height:32px;padding:0 4px 0 8px;border-radius:8px;color:#eee;font-size:13px}
.qrc-w .qrc-mi:hover{background:rgba(255,255,255,.1)}
.qrc-w .qrc-mi-ico{flex:none;font-size:12px}
.qrc-w .qrc-mi-t{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.qrc-w .qrc-mi-x{flex:none;width:24px;height:24px;border:0;border-radius:50%;background:transparent;color:#9a9aa6;font-size:10px;
  display:inline-flex;align-items:center;justify-content:center;padding:0}
.qrc-w .qrc-mi-x:hover{background:#c0392b;color:#fff}
.qrc-w .qrc-menu-clear{flex:none;margin-top:6px;height:32px;border:0;border-top:1px solid #3a3a46;border-radius:0 0 8px 8px;background:transparent;
  color:#ff8a80;font-size:12.5px;font-weight:600}
.qrc-w .qrc-menu-clear:hover{background:rgba(255,95,87,.15)}
/* Panneaux Réglages et Aide */
.qrc-w .qrc-panel{position:absolute;left:0;right:0;top:40px;bottom:0;z-index:14;display:flex;align-items:flex-start;justify-content:center;
  padding:14px;box-sizing:border-box;overflow:auto;background:rgba(10,10,20,.6)}
.qrc-w .qrc-panel[hidden]{display:none}
.qrc-w .qrc-panel-card{width:100%;max-width:520px;box-sizing:border-box;background:#fffdf7;color:#2a2a33;border-radius:16px;padding:12px 16px 14px;box-shadow:0 10px 30px rgba(0,0,0,.45)}
.qrc-w .qrc-panel-head{display:flex;align-items:center;justify-content:space-between;gap:8px;font-weight:800;font-size:15px;color:#1f2a44;margin-bottom:6px}
.qrc-w .qrc-panel-head .qrc-ib{color:#666}
.qrc-w .qrc-panel-head .qrc-ib:hover{background:#eee;color:#222}
.qrc-w .qrc-row-t{display:block;margin:12px 0 6px;font-weight:700;font-size:13px;color:#1f2a44}
.qrc-w .qrc-muted{font-weight:400;color:#7a7a88;font-size:12px}
.qrc-w .qrc-cap-input{width:100%;box-sizing:border-box;height:38px;border:2px solid #e3dfd2;border-radius:10px;padding:0 12px;font:inherit;font-size:14px;color:#222;background:#fff;outline:0;
  user-select:text;-webkit-user-select:text}
.qrc-w .qrc-cap-input:focus{border-color:var(--qrc-accent)}
.qrc-w .qrc-colors{display:flex;flex-wrap:wrap;gap:8px}
.qrc-w .qrc-color{width:32px;height:32px;border-radius:50%;border:3px solid #fff;background:var(--sw);box-shadow:0 0 0 2px #e3dfd2;padding:0}
.qrc-w .qrc-color.is-on{box-shadow:0 0 0 3px var(--qrc-accent)}
.qrc-w .qrc-seg{display:flex;flex-wrap:wrap;gap:4px;background:#f1eee4;border-radius:12px;padding:4px}
.qrc-w .qrc-seg-b{flex:1;min-width:70px;height:32px;border:0;border-radius:9px;background:transparent;color:#5a5a66;font-size:13px;font-weight:700}
.qrc-w .qrc-seg-b:hover{background:rgba(0,0,0,.05)}
.qrc-w .qrc-seg-b.is-on{background:#fff;color:#1f2a44;box-shadow:0 1px 4px rgba(0,0,0,.12)}
.qrc-w .qrc-info{margin-top:12px;font-size:12px;color:#7a7a88}
.qrc-w .qrc-info:empty{display:none}
.qrc-w .qrc-help-list{margin:0;padding-left:18px;font-size:13px;line-height:1.5}
.qrc-w .qrc-help-list li{margin:4px 0}
.qrc-w .qrc-help-note{margin-top:10px;padding:8px 10px;border-radius:10px;background:#eeebff;color:#3d2f99;font-size:12px}
/* Curseurs */
.editor-container.qrc-w,.editor-container.qrc-w *{cursor:default!important}
.qrc-w .qrc-stage,.qrc-w .qrc-stage *,.qrc-w .qrc-menu,.qrc-w .qrc-bar-title,.qrc-w .qrc-panel{user-select:none;-webkit-user-select:none}
.editor-container.qrc-w .qrc-bar,.editor-container.qrc-w .qrc-bar .qrc-bar-title{cursor:grab!important;touch-action:none}
.editor-container.qrc-w .qrc-bar.is-dragging,.editor-container.qrc-w .qrc-bar.is-dragging *{cursor:grabbing!important}
.editor-container.qrc-w.wf-media-fullboard .qrc-bar,.editor-container.qrc-w.wf-media-fullboard .qrc-bar-title{cursor:default!important}
.editor-container.qrc-w button,.editor-container.qrc-w button *,.editor-container.qrc-w .qrc-mi,.editor-container.qrc-w .qrc-mi *{cursor:pointer!important}
.editor-container.qrc-w .qrc-input,.editor-container.qrc-w .qrc-cap-input{cursor:text!important;user-select:text;-webkit-user-select:text}
/* Message temporaire */
.qrc-w .qrc-flash{position:absolute;left:50%;top:10px;transform:translateX(-50%);z-index:13;max-width:calc(100% - 24px);box-sizing:border-box;
  padding:7px 14px;border-radius:12px;background:rgba(0,0,0,.85);color:#fff;font-size:12.5px;font-weight:600;text-align:center;
  pointer-events:none;opacity:0;transition:opacity .25s}
.qrc-w .qrc-flash.is-on{opacity:1}
/* Petits widgets / téléphone */
@container (max-width: 420px){
  .qrc-w .qrc-top{padding:10px 10px 4px}
  .qrc-w .qrc-view{padding:8px 10px 10px}
  .qrc-w .qrc-card{padding:10px;border-radius:14px}
  .qrc-w .qrc-ib{min-width:26px;padding:0 4px}
}
@media print{ .qrc-w .qrc-bar,.qrc-w .qrc-top{display:none} }
`;
    document.head.appendChild(st);
})();

// Widgets déjà présents au chargement du script.
_qrcScan(document.body);
