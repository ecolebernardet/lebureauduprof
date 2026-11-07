// =========================================================================
// OUTIL AMBIANCE SONORE — Le Bureau du Prof
// =========================================================================
// Des ambiances calmes pour les moments de travail autonome :
//   - 🌧️ pluie, 🌲 forêt (vent et oiseaux), 🌊 vagues, 💧 rivière,
//     🎹 musique calme (boîte à musique), 🎐 musique zen (kalimba)
//   - les sons sont FABRIQUÉS par le navigateur (Web Audio) : aucun fichier
//     à télécharger, fonctionne sans internet, la musique ne se répète jamais
//   - on peut MÉLANGER plusieurs ambiances (ex. pluie + musique calme),
//     chacune avec son propre volume, plus un volume général
//   - ⏱ minuteur d'arrêt (5 à 60 min, ou durée libre de 1 à 180 min) avec fondu, et petit carillon
//     à la fin (facultatif) pour signaler la fin du travail
//   - barre d'outils avec aide (?)
//   - déplacement en tirant la barre de titre, redimensionnement libre
//   - boutons fenêtre jaune (réduire) / vert (plein écran board) / rouge (fermer)
//   - restauré après l'actualisation du tableau (ambiances choisies, volumes,
//     minuteur). Les navigateurs interdisent de relancer un son tout seul :
//     après une actualisation, il suffit d'appuyer sur ▶.
//
// Utilisation : createWidget('ambiance-sonore')
// Le template #template-ambiance-sonore est injecté dans le DOM par ce fichier.
// Sauvegarde : window.ambGetData(widget) / window.ambSetData(widget, data)
// (appelés par save-load.js)
// =========================================================================

const _AMB_STOP = ' onpointerdown="event.stopPropagation()" onmousedown="event.stopPropagation()" ontouchstart="event.stopPropagation()"';

const AMB_SOUNDS = [
    { id: 'pluie',    n: 'Pluie',         i: '🌧️', col: '#4a90c2', d: 'Une pluie douce sur le toit' },
    { id: 'foret',    n: 'Forêt',         i: '🌲', col: '#3f9a5a', d: 'Le vent dans les arbres et les oiseaux' },
    { id: 'vagues',   n: 'Vagues',        i: '🌊', col: '#2b8fb3', d: 'La mer qui va et vient sur la plage' },
    { id: 'riviere',  n: 'Rivière',       i: '💧', col: '#2fa3a0', d: 'Un petit ruisseau qui coule' },
    { id: 'musique',  n: 'Musique calme', i: '🎹', col: '#8a63c9', d: 'Des notes douces, comme une boîte à musique' },
    { id: 'zen',      n: 'Musique zen',   i: '🎐', col: '#c0568f', d: 'Des arpèges de kalimba sur une note grave tenue' }
];
const AMB_TIMERS = [0, 5, 10, 15, 20, 30, 45, 60];
const AMB_TIMER_MAX = 180;                     // durée libre : de 1 à 180 minutes

document.body.insertAdjacentHTML('beforeend', `
<template id="template-ambiance-sonore">
    <div class="editor-container amb-w" style="height:600px;width:800px;">
        <div class="amb-bar editor-toolbar" title="Glisser pour déplacer">
            <span class="amb-bar-title">🎧 Ambiance sonore</span>
            <div class="amb-tools"${_AMB_STOP}>
                <button type="button" class="amb-ib amb-ib-help" data-amb-action="help" title="Aide">?</button>
            </div>
            <div class="wf-btns"${_AMB_STOP}>
                <button class="wf-btn wf-btn-min"   title="Réduire"           onclick="toggleMediaCollapse(this.closest('.editor-container'))"></button>
                <button class="wf-btn wf-btn-max"   title="Plein écran board" onclick="toggleMediaBoardFullscreen(this.closest('.editor-container'))"></button>
                <button class="wf-btn wf-btn-close" title="Fermer"            onclick="snapshotNow();this.closest('.widget').remove();saveBoard();"></button>
            </div>
        </div>
        <div class="amb-stage"${_AMB_STOP}>
            <div class="amb-head">
                <button type="button" class="amb-play" data-amb-action="play" title="Lancer / mettre en pause">
                    <span class="amb-play-ico">▶</span>
                </button>
                <div class="amb-head-txt">
                    <div class="amb-status">En pause</div>
                    <div class="amb-vol">
                        <span class="amb-vol-ico">🔈</span>
                        <input type="range" class="amb-master" min="0" max="100" step="1" value="70" title="Volume général" aria-label="Volume général">
                        <span class="amb-vol-ico">🔊</span>
                    </div>
                </div>
                <div class="amb-eq" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
            </div>
            <div class="amb-grid">${AMB_SOUNDS.map(s => `
                <div class="amb-tile" data-amb-action="tile" data-id="${s.id}" style="--tc:${s.col}" role="button" tabindex="0" title="${s.d}">
                    <div class="amb-tile-top"><span class="amb-tile-ico">${s.i}</span><span class="amb-tile-on">✓</span></div>
                    <div class="amb-tile-n">${s.n}</div>
                    <input type="range" class="amb-tvol" data-id="${s.id}" min="0" max="100" step="1" value="70" title="Volume : ${s.n}" aria-label="Volume : ${s.n}">
                </div>`).join('')}
            </div>
            <div class="amb-timer">
                <div class="amb-timer-head">
                    <span class="amb-timer-t">⏱ Arrêt automatique</span>
                    <span class="amb-left"></span>
                    <label class="amb-chime"><input type="checkbox" class="amb-chime-cb" checked> 🔔 Carillon à la fin</label>
                </div>
                <div class="amb-chips">${AMB_TIMERS.map(m =>
                    `<button type="button" class="amb-chip" data-amb-action="timer" data-m="${m}">${m ? m + ' min' : 'Sans fin'}</button>`).join('')}
                    <span class="amb-custom" title="Taper une autre durée, puis Entrée">
                        <span class="amb-custom-t">Autre :</span>
                        <input type="number" class="amb-min" min="1" max="${AMB_TIMER_MAX}" step="1" inputmode="numeric" placeholder="—" aria-label="Autre durée en minutes"
                               onkeydown="ambMinKey(event,this)" onkeyup="event.stopPropagation()" onkeypress="event.stopPropagation()" onpaste="event.stopPropagation()">
                        <span class="amb-custom-u">min</span>
                        <button type="button" class="amb-custom-ok" data-amb-action="timer-custom" title="Valider cette durée">OK</button>
                    </span>
                </div>
                <div class="amb-prog"><span></span></div>
            </div>
            <div class="amb-flash"></div>
        </div>
        <div class="amb-help" hidden${_AMB_STOP}>
            <div class="amb-help-card">
                <div class="amb-help-head">
                    <span>❓ Comment utiliser l’ambiance sonore</span>
                    <button type="button" class="amb-ib" data-amb-action="help-close" title="Fermer l'aide">✕</button>
                </div>
                <ul class="amb-help-list">
                    <li><b>Choisir une ambiance :</b> clique sur une vignette (pluie, forêt, vagues…). Clique à nouveau pour l’arrêter.</li>
                    <li><b>Mélanger :</b> tu peux allumer plusieurs ambiances en même temps, par exemple <b>pluie + musique zen</b>. Chaque vignette allumée a son propre curseur de volume.</li>
                    <li><b>▶ / ❚❚ :</b> lance ou met en pause tous les sons. Le grand curseur règle le volume général.</li>
                    <li><b>⏱ Arrêt automatique :</b> choisis une durée, ou tape-la dans la case <b>Autre</b> (de 1 à ${AMB_TIMER_MAX} minutes) puis appuie sur Entrée ou <b>OK</b>. Les sons baissent doucement à la fin, puis s’arrêtent. Le <b>🔔 carillon</b> signale à la classe que le temps de travail est terminé.</li>
                    <li><b>Après une actualisation</b> du tableau, tes ambiances et réglages sont gardés : appuie simplement sur ▶ (les navigateurs interdisent de relancer un son tout seul).</li>
                    <li><b>Fenêtre :</b> tire la barre du haut pour déplacer l’outil, le coin pour l’agrandir. Bouton jaune : réduire (le son continue), vert : plein écran, rouge : fermer (le son s’arrête).</li>
                </ul>
                <div class="amb-help-note">Les sons sont fabriqués par l’ordinateur, en direct : ils fonctionnent sans internet et la musique ne se répète jamais à l’identique.</div>
            </div>
        </div>
    </div>
</template>
`);

/* ═════════════════════════════════════════════════════════════════
   MOTEUR SONORE (Web Audio)
   Chaque ambiance est un petit « générateur » :
     build(ctx, out) → { tick(t0, t1), stop() }
   tick() programme les sons ponctuels (gouttes, oiseaux, notes…) entre
   les instants t0 et t1 ; il est appelé plusieurs fois par seconde.
   ═════════════════════════════════════════════════════════════════ */
const AmbEngine = (function () {
    const rnd = (a, b) => a + Math.random() * (b - a);
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

    // Bruits blanc, rose et brun (une fois par contexte audio)
    const buffers = new WeakMap();
    function noise(ctx) {
        let b = buffers.get(ctx);
        if (b) return b;
        const len = Math.floor(ctx.sampleRate * 6);
        const mk = () => ctx.createBuffer(1, len, ctx.sampleRate);
        const white = mk(), pink = mk(), brown = mk();
        const w = white.getChannelData(0), p = pink.getChannelData(0), br = brown.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
        for (let i = 0; i < len; i++) {
            const x = Math.random() * 2 - 1;
            w[i] = x;
            b0 = 0.99886 * b0 + x * 0.0555179; b1 = 0.99332 * b1 + x * 0.0750759; b2 = 0.96900 * b2 + x * 0.1538520;
            b3 = 0.86650 * b3 + x * 0.3104856; b4 = 0.55000 * b4 + x * 0.5329522; b5 = -0.7616 * b5 - x * 0.0168980;
            p[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + x * 0.5362) * 0.11; b6 = x * 0.115926;
            last = (last + 0.02 * x) / 1.02; br[i] = last * 3.5;
        }
        // Raccord doux entre la fin et le début de la boucle
        [white, pink, brown].forEach(buf => {
            const d = buf.getChannelData(0), f = Math.floor(ctx.sampleRate * 0.05);
            for (let i = 0; i < f; i++) { const k = i / f; d[len - f + i] = d[len - f + i] * (1 - k) + d[i] * k; }
        });
        b = { white, pink, brown };
        buffers.set(ctx, b);
        return b;
    }
    // Source de bruit en boucle, placée dans l'espace (gauche / droite)
    function loopNoise(ctx, kind, pan, keep) {
        const s = ctx.createBufferSource();
        s.buffer = noise(ctx)[kind];
        s.loop = true;
        s.start(ctx.currentTime, rnd(0, 5));
        keep.push(s);
        if (pan && ctx.createStereoPanner) {
            const p = ctx.createStereoPanner();
            p.pan.value = pan;
            s.connect(p);
            return p;
        }
        return s;
    }
    function filt(ctx, type, f, q) {
        const n = ctx.createBiquadFilter();
        n.type = type; n.frequency.value = f; if (q != null) n.Q.value = q;
        return n;
    }
    function gain(ctx, v) { const g = ctx.createGain(); g.gain.value = v; return g; }
    function chain(...nodes) { for (let i = 0; i < nodes.length - 1; i++) nodes[i].connect(nodes[i + 1]); return nodes[nodes.length - 1]; }
    function panner(ctx, v) {
        if (!ctx.createStereoPanner) return gain(ctx, 1);
        const p = ctx.createStereoPanner(); p.pan.value = v; return p;
    }
    // Petit « grain » de bruit (goutte, crépitement…)
    function burst(ctx, dest, t, dur, ftype, f, q, peak, pan) {
        const s = ctx.createBufferSource();
        s.buffer = noise(ctx).white;
        const fl = filt(ctx, ftype, f, q), g = gain(ctx, 0), p = panner(ctx, pan);
        chain(s, fl, g, p, dest);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(peak, t + Math.min(0.004, dur / 3));
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        s.start(t, rnd(0, 5), dur + 0.02);
        s.onended = () => { try { p.disconnect(); } catch (e) {} };
    }
    function stopAll(keep) {
        keep.forEach(n => { try { n.stop(); } catch (e) {} try { n.disconnect(); } catch (e) {} });
        keep.length = 0;
    }

    const BUILD = {
        /* 🌧️ Pluie : un fond de bruit rose filtré + des milliers de gouttes */
        pluie(ctx, out) {
            const keep = [];
            const bed = gain(ctx, 0.5);
            [-0.6, 0.6].forEach(pn => chain(loopNoise(ctx, 'pink', pn, keep), filt(ctx, 'highpass', 350), filt(ctx, 'lowpass', 6500), bed));
            const patter = gain(ctx, 0.12);
            chain(loopNoise(ctx, 'white', 0, keep), filt(ctx, 'bandpass', 2600, 0.6), patter);
            bed.connect(out); patter.connect(out);
            let next = ctx.currentTime;
            return {
                tick(t0, t1) {
                    if (next < t0 - 0.2) next = t0;
                    while (next < t1) {
                        burst(ctx, out, next, rnd(0.015, 0.05), 'bandpass', rnd(1400, 5200), rnd(2, 6), rnd(0.03, 0.2), rnd(-0.9, 0.9));
                        next += rnd(0.012, 0.06);
                    }
                },
                stop() { stopAll(keep); }
            };
        },

        /* 🌲 Forêt : le vent dans les feuilles et des chants d'oiseaux */
        foret(ctx, out) {
            const keep = [];
            const wind = gain(ctx, 0.35), leaves = gain(ctx, 0.04);
            chain(loopNoise(ctx, 'brown', -0.3, keep), filt(ctx, 'lowpass', 450), wind, out);
            chain(loopNoise(ctx, 'pink', 0.3, keep), filt(ctx, 'highpass', 2800), leaves, out);
            const birds = gain(ctx, 0.11);
            chain(birds, filt(ctx, 'lowpass', 9000), out);
            let nextGust = ctx.currentTime, nextBird = ctx.currentTime + rnd(0.3, 1.5);
            const note = (t, f0, f1, dur, pan, vib) => {
                const o = ctx.createOscillator(), g = gain(ctx, 0), p = panner(ctx, pan);
                o.type = 'sine';
                o.frequency.setValueAtTime(f0, t);
                o.frequency.exponentialRampToValueAtTime(f1, t + dur);
                if (vib) {
                    const l = ctx.createOscillator(), lg = gain(ctx, f0 * 0.03);
                    l.frequency.value = rnd(18, 30); chain(l, lg, o.frequency); l.start(t); l.stop(t + dur + 0.02);
                }
                chain(o, g, p, birds);
                g.gain.setValueAtTime(0.0001, t);
                g.gain.exponentialRampToValueAtTime(1, t + 0.012);
                g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
                o.start(t); o.stop(t + dur + 0.02);
                o.onended = () => { try { p.disconnect(); } catch (e) {} };
            };
            const song = t => {
                const pan = rnd(-0.85, 0.85), kind = Math.random();
                if (kind < 0.4) {                     // petits gazouillis
                    const f = rnd(2600, 4200), n = Math.floor(rnd(3, 7));
                    for (let k = 0; k < n; k++) note(t + k * rnd(0.11, 0.16), f * rnd(0.9, 1.05), f * rnd(1.25, 1.5), rnd(0.06, 0.09), pan);
                } else if (kind < 0.75) {             // sifflement qui descend
                    const f = rnd(2400, 3400);
                    note(t, f, f * 0.78, 0.28, pan, true);
                    note(t + 0.38, f * 0.95, f * 0.7, 0.32, pan, true);
                } else {                              // trille rapide
                    const f = rnd(3800, 5000), n = Math.floor(rnd(8, 15));
                    for (let k = 0; k < n; k++) note(t + k * 0.055, f * (k % 2 ? 1.08 : 1), f * (k % 2 ? 1.12 : 1.04), 0.035, pan);
                }
            };
            return {
                tick(t0, t1) {
                    if (nextGust < t1) {              // le vent monte et redescend
                        wind.gain.setTargetAtTime(rnd(0.18, 0.5), Math.max(t0, nextGust), 1.6);
                        leaves.gain.setTargetAtTime(rnd(0.02, 0.07), Math.max(t0, nextGust), 1.2);
                        nextGust = Math.max(t0, nextGust) + rnd(3, 6);
                    }
                    if (nextBird < t0 - 0.5) nextBird = t0 + rnd(0.5, 2);
                    while (nextBird < t1) { song(nextBird); nextBird += rnd(1.3, 5.5); }
                },
                stop() { stopAll(keep); }
            };
        },

        /* 🌊 Vagues : un bruit grave qui enfle puis se retire, avec l'écume */
        vagues(ctx, out) {
            const keep = [];
            const lp = filt(ctx, 'lowpass', 400, 0.4), body = gain(ctx, 0.15);
            [-0.5, 0.5].forEach(pn => chain(loopNoise(ctx, 'brown', pn, keep), lp));
            chain(lp, body, out);
            const foam = gain(ctx, 0.0);
            chain(loopNoise(ctx, 'white', 0, keep), filt(ctx, 'highpass', 2200), foam, out);
            let next = ctx.currentTime + 0.05;
            const wave = (t, dur) => {
                const peak = rnd(0.55, 0.95), up = dur * rnd(0.38, 0.5);
                body.gain.setValueAtTime(0.12, t);
                body.gain.linearRampToValueAtTime(peak, t + up);
                body.gain.linearRampToValueAtTime(0.12, t + dur);
                lp.frequency.setValueAtTime(320, t);
                lp.frequency.exponentialRampToValueAtTime(rnd(1300, 2000), t + up);
                lp.frequency.exponentialRampToValueAtTime(320, t + dur);
                foam.gain.setValueAtTime(0.0, t);
                foam.gain.linearRampToValueAtTime(0.0, t + up * 0.7);
                foam.gain.linearRampToValueAtTime(rnd(0.05, 0.1), t + up * 1.15);
                foam.gain.linearRampToValueAtTime(0.0, t + dur * 0.92);
            };
            return {
                tick(t0, t1) {
                    if (next < t0) next = t0 + 0.05;
                    // on programme la vague suivante un peu à l'avance
                    while (next < t1 + 1.5) { const d = rnd(6.5, 11); wave(next, d); next += d; }
                },
                stop() { stopAll(keep); }
            };
        },

        /* 💧 Rivière : des bruits filtrés qui bougent sans cesse, et des bulles */
        riviere(ctx, out) {
            const keep = [];
            const b1 = filt(ctx, 'bandpass', 900, 1.1), b2 = filt(ctx, 'bandpass', 2300, 1.4);
            const g1 = gain(ctx, 0.5), g2 = gain(ctx, 0.3), low = gain(ctx, 0.35);
            chain(loopNoise(ctx, 'white', -0.4, keep), b1, g1, out);
            chain(loopNoise(ctx, 'pink', 0.4, keep), b2, g2, out);
            chain(loopNoise(ctx, 'brown', 0, keep), filt(ctx, 'lowpass', 320), low, out);
            let nextMove = ctx.currentTime, nextBub = ctx.currentTime + 0.2;
            return {
                tick(t0, t1) {
                    while (nextMove < t1) {
                        const t = Math.max(t0, nextMove);
                        b1.frequency.setTargetAtTime(rnd(650, 1300), t, 0.06);
                        b2.frequency.setTargetAtTime(rnd(1700, 3200), t, 0.05);
                        g1.gain.setTargetAtTime(rnd(0.35, 0.6), t, 0.08);
                        nextMove = t + rnd(0.08, 0.22);
                    }
                    if (nextBub < t0 - 0.3) nextBub = t0;
                    while (nextBub < t1) {
                        const o = ctx.createOscillator(), g = gain(ctx, 0), p = panner(ctx, rnd(-0.7, 0.7));
                        const f = rnd(350, 700), d = rnd(0.03, 0.07);
                        o.frequency.setValueAtTime(f, nextBub);
                        o.frequency.exponentialRampToValueAtTime(f * rnd(1.8, 2.6), nextBub + d);
                        chain(o, g, p, out);
                        g.gain.setValueAtTime(0.0001, nextBub);
                        g.gain.exponentialRampToValueAtTime(rnd(0.02, 0.06), nextBub + 0.006);
                        g.gain.exponentialRampToValueAtTime(0.0001, nextBub + d);
                        o.start(nextBub); o.stop(nextBub + d + 0.02);
                        o.onended = () => { try { p.disconnect(); } catch (e) {} };
                        nextBub += rnd(0.08, 0.5);
                    }
                },
                stop() { stopAll(keep); }
            };
        },

        /* 🎶 Musique zen : une note grave tenue (bourdon) très douce et des
           arpèges de kalimba dans la gamme pentatonique de ré */
        zen(ctx, out) {
            const keep = [];
            const bus = gain(ctx, 1);
            const dry = gain(ctx, 0.7), wet = gain(ctx, 0.42);
            const delay = ctx.createDelay(2); delay.delayTime.value = 0.6;
            const fb = gain(ctx, 0.45), dlp = filt(ctx, 'lowpass', 1800);
            chain(bus, dry, out);
            chain(bus, delay, dlp, wet, out);
            chain(dlp, fb, delay);
            // Bourdon : ré grave + la, qui « respirent » lentement
            const drone = gain(ctx, 0.0), dlpf = filt(ctx, 'lowpass', 700);
            chain(drone, dlpf, out);
            [[38, 'sine', 0.5], [45, 'sine', 0.32], [50, 'triangle', 0.12]].forEach(([m, type, a]) => {
                const o = ctx.createOscillator(), g = gain(ctx, a);
                o.type = type; o.frequency.value = mtof(m); o.detune.value = rnd(-4, 4);
                chain(o, g, drone); o.start(); keep.push(o);
            });
            const lfo = ctx.createOscillator(), lfoG = gain(ctx, 0.025);
            lfo.frequency.value = 0.07; chain(lfo, lfoG, drone.gain); lfo.start(); keep.push(lfo);
            drone.gain.setValueAtTime(0, ctx.currentTime);
            drone.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 4);
            // Ré – Si mineur – Sol – La, et la gamme pentatonique de ré
            const CHORDS = [[50, 57, 62, 66, 69], [47, 54, 59, 62, 66], [43, 50, 55, 59, 62], [45, 52, 57, 61, 64]];
            const SCALE = [62, 64, 66, 69, 71, 74, 76, 78, 81];
            const STEP = 0.62;                                   // durée d'une note (lent)
            let ci = 0, step = 0, nextT = ctx.currentTime + 1.5, pattern = [];
            const kalimba = (t, m, v, pan) => {
                const p = panner(ctx, pan);
                chain(p, bus);
                [[1, 1, 'sine', 2.4], [1, 0.35, 'triangle', 1.1], [4.02, 0.06, 'sine', 0.22]].forEach(([mul, amp, type, dec]) => {
                    const o = ctx.createOscillator(), g = gain(ctx, 0);
                    o.type = type; o.frequency.value = mtof(m) * mul;
                    chain(o, g, p);
                    g.gain.setValueAtTime(0.0001, t);
                    g.gain.exponentialRampToValueAtTime(v * amp, t + 0.006);
                    g.gain.exponentialRampToValueAtTime(0.0001, t + dec);
                    o.start(t); o.stop(t + dec + 0.05);
                });
                setTimeout(() => { try { p.disconnect(); } catch (e) {} }, (t - ctx.currentTime + 2.6) * 1000);
            };
            // Une phrase = 16 pas : un arpège qui monte et redescend, avec des silences
            const newPattern = () => {
                const ch = CHORDS[ci % CHORDS.length];
                const up = ch.concat([ch[1] + 12]);
                const shapes = [
                    [0, 1, 2, 3, 4, 5, 4, 3, -1, 2, 1, -1, 0, -1, -1, -1],
                    [0, 2, 4, 5, 4, 2, -1, -1, 1, 3, 5, 3, -1, 1, -1, -1],
                    [0, -1, 2, 3, -1, 4, 3, 2, 0, -1, 1, -1, 2, -1, -1, -1]
                ];
                pattern = pick(shapes).map(k => k < 0 ? null : up[k]);
                // parfois, une petite mélodie par-dessus
                if (Math.random() < 0.5) {
                    const at = Math.floor(rnd(8, 14));
                    pattern[at] = pick(SCALE.filter(n => ch.map(c => c % 12).indexOf(n % 12) !== -1)) + 12;
                }
                ci++;
            };
            return {
                tick(t0, t1) {
                    if (nextT < t0 - 0.5) nextT = t0 + 0.2;
                    while (nextT < t1) {
                        if (step % 16 === 0) newPattern();
                        const m = pattern[step % 16];
                        if (m != null) kalimba(nextT, m, m > 74 ? rnd(0.06, 0.09) : rnd(0.1, 0.15), rnd(-0.4, 0.4));
                        step++;
                        nextT += STEP * (Math.random() < 0.08 ? 1.5 : 1);   // léger rubato
                    }
                },
                stop() {
                    const now = ctx.currentTime;
                    drone.gain.cancelScheduledValues(now);
                    stopAll(keep);
                    setTimeout(() => { [bus, dry, wet, delay, fb, dlp, drone, dlpf, lfoG].forEach(n => { try { n.disconnect(); } catch (e) {} }); }, 3000);
                }
            };
        },

        /* 🎵 Musique calme : des accords doux et des notes de boîte à musique,
           tirées au hasard dans une gamme où toutes les notes vont ensemble */
        musique(ctx, out) {
            const keep = [];
            const bus = gain(ctx, 1);
            const dry = gain(ctx, 0.75), wet = gain(ctx, 0.35);
            const delay = ctx.createDelay(2); delay.delayTime.value = 0.42;
            const fb = gain(ctx, 0.38), dlp = filt(ctx, 'lowpass', 2200);
            chain(bus, dry, out);
            chain(bus, delay, dlp, wet, out);
            chain(dlp, fb, delay);
            const padBus = gain(ctx, 1);
            chain(padBus, filt(ctx, 'lowpass', 900), bus);
            // Do – La mineur – Fa – Sol (accords en notes MIDI)
            const CHORDS = [[48, 55, 60, 64], [45, 52, 57, 60], [41, 48, 53, 57], [43, 50, 55, 59]];
            const SCALE = [60, 62, 64, 67, 69, 72, 74, 76, 79];   // gamme pentatonique de do
            let ci = 0, nextChord = ctx.currentTime + 0.05, nextNote = ctx.currentTime + 1.2;
            const pad = (t, notes, dur) => {
                notes.forEach((m, k) => {
                    const o = ctx.createOscillator(), g = gain(ctx, 0);
                    o.type = k % 2 ? 'sine' : 'triangle';
                    o.frequency.value = mtof(m);
                    o.detune.value = rnd(-6, 6);
                    chain(o, g, padBus);
                    g.gain.setValueAtTime(0.0001, t);
                    g.gain.linearRampToValueAtTime(0.045, t + 2.5);
                    g.gain.setValueAtTime(0.045, t + dur - 0.2);
                    g.gain.linearRampToValueAtTime(0.0001, t + dur + 2.5);
                    o.start(t); o.stop(t + dur + 2.6);
                    o.onended = () => { try { g.disconnect(); } catch (e) {} };
                });
            };
            const bell = (t, m, v) => {
                [[1, 1, 'sine'], [2, 0.25, 'sine'], [3.01, 0.08, 'triangle']].forEach(([mul, amp, type]) => {
                    const o = ctx.createOscillator(), g = gain(ctx, 0);
                    o.type = type; o.frequency.value = mtof(m) * mul;
                    chain(o, g, bus);
                    const dec = mul === 1 ? 2.8 : 1.2;
                    g.gain.setValueAtTime(0.0001, t);
                    g.gain.exponentialRampToValueAtTime(v * amp, t + 0.015);
                    g.gain.exponentialRampToValueAtTime(0.0001, t + dec);
                    o.start(t); o.stop(t + dec + 0.05);
                    o.onended = () => { try { g.disconnect(); } catch (e) {} };
                });
            };
            return {
                tick(t0, t1) {
                    if (nextChord < t0 - 1) nextChord = t0;
                    while (nextChord < t1 + 0.5) {
                        pad(nextChord, CHORDS[ci % CHORDS.length], 8);
                        ci++; nextChord += 8;
                    }
                    if (nextNote < t0 - 0.5) nextNote = t0 + 0.3;
                    while (nextNote < t1) {
                        if (Math.random() > 0.15) {
                            const chord = CHORDS[(ci - 1 + CHORDS.length) % CHORDS.length].map(m => m % 12);
                            const good = SCALE.filter(m => chord.indexOf(m % 12) !== -1);
                            const m = Math.random() < 0.7 ? pick(good) : pick(SCALE);
                            bell(nextNote, m, rnd(0.08, 0.14));
                            if (Math.random() < 0.18) bell(nextNote + 0.75, pick(good), rnd(0.05, 0.09));
                        }
                        nextNote += pick([0.75, 1.5, 1.5, 2.25, 3]);
                    }
                },
                stop() {
                    stopAll(keep);
                    setTimeout(() => { [bus, dry, wet, delay, fb, dlp, padBus].forEach(n => { try { n.disconnect(); } catch (e) {} }); }, 3000);
                }
            };
        }
    };

    // Niveau de base de chaque ambiance (pour qu'elles s'équilibrent entre elles)
    const LEVEL = { pluie: 0.8, foret: 0.9, vagues: 0.85, riviere: 0.7, musique: 1.35, zen: 1.2 };

    // Carillon de fin : trois notes de cloche qui descendent
    function chime(ctx, dest) {
        const t = ctx.currentTime + 0.05;
        [[76, 0], [72, 0.6], [67, 1.2]].forEach(([m, dt]) => {
            [[1, 0.3], [2.76, 0.08], [5.4, 0.03]].forEach(([mul, amp]) => {
                const o = ctx.createOscillator(), g = ctx.createGain();
                o.frequency.value = mtof(m) * mul;
                o.connect(g); g.connect(dest);
                g.gain.setValueAtTime(0.0001, t + dt);
                g.gain.exponentialRampToValueAtTime(amp, t + dt + 0.01);
                g.gain.exponentialRampToValueAtTime(0.0001, t + dt + 3);
                o.start(t + dt); o.stop(t + dt + 3.1);
            });
        });
    }
    return { BUILD, LEVEL, chime };
})();
window.AmbEngine = AmbEngine;

/* ── Contexte audio partagé par tous les widgets ────────────────── */
function _ambCtx() {
    if (!window._ambAudioCtx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        window._ambAudioCtx = new AC();
    }
    return window._ambAudioCtx;
}

/* ── Outils ─────────────────────────────────────────────────────── */
function _ambSave() { if (typeof saveBoard === 'function') try { saveBoard(); } catch (e) {} }
const _ambFmt = s => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = String(Math.floor(s % 60)).padStart(2, '0');
    return h ? h + ':' + String(m).padStart(2, '0') + ':' + sec : m + ':' + sec;
};
const _ambCurve = v => Math.pow(Math.max(0, Math.min(100, v)) / 100, 2);   // volume « à l'oreille »
function _ambFlash(c, text, ms) {
    const f = c && c.querySelector('.amb-flash');
    if (!f) return;
    f.textContent = text;
    f.classList.remove('is-on'); void f.offsetWidth; f.classList.add('is-on');
    clearTimeout(f._t);
    f._t = setTimeout(() => f.classList.remove('is-on'), ms || 2200);
}

/* ── État du widget ─────────────────────────────────────────────── */
function _ambState(c) {
    if (!c._amb) {
        const vols = {};
        AMB_SOUNDS.forEach(s => { vols[s.id] = 70; });
        c._amb = { on: ['pluie'], vols, master: 70, timer: 0, chime: true, playing: false, left: 0, endAt: 0 };
    }
    return c._amb;
}

/* ── Lecture ────────────────────────────────────────────────────── */
function _ambEngine(c) {
    if (c._ambEng) return c._ambEng;
    const ctx = _ambCtx();
    if (!ctx) return null;
    const master = ctx.createGain();
    master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    master.connect(comp); comp.connect(ctx.destination);
    c._ambEng = { ctx, master, comp, live: {}, iv: null };
    return c._ambEng;
}
function _ambStartSound(c, id) {
    const eng = _ambEngine(c), st = _ambState(c);
    if (!eng || eng.live[id] || !AmbEngine.BUILD[id]) return;
    const out = eng.ctx.createGain();
    out.gain.value = 0;
    out.connect(eng.master);
    const gen = AmbEngine.BUILD[id](eng.ctx, out);
    const now = eng.ctx.currentTime;
    out.gain.setValueAtTime(0, now);
    out.gain.linearRampToValueAtTime(_ambCurve(st.vols[id]) * AmbEngine.LEVEL[id], now + 1.5);
    eng.live[id] = { gen, out };
    gen.tick(now, now + 0.35);
}
function _ambStopSound(c, id, fade) {
    const eng = c._ambEng;
    const s = eng && eng.live[id];
    if (!s) return;
    delete eng.live[id];
    const now = eng.ctx.currentTime, f = fade == null ? 0.8 : fade;
    s.out.gain.cancelScheduledValues(now);
    s.out.gain.setValueAtTime(s.out.gain.value, now);
    s.out.gain.linearRampToValueAtTime(0, now + f);
    setTimeout(() => { s.gen.stop(); try { s.out.disconnect(); } catch (e) {} }, f * 1000 + 150);
}
function _ambPlay(c) {
    const st = _ambState(c);
    const eng = _ambEngine(c);
    if (!eng) { _ambFlash(c, '🔇 Le son n’est pas disponible dans ce navigateur'); return; }
    if (!st.on.length) st.on = ['pluie'];
    if (eng.ctx.state === 'suspended') eng.ctx.resume();
    st.playing = true;
    const now = eng.ctx.currentTime;
    eng.master.gain.cancelScheduledValues(now);
    eng.master.gain.setValueAtTime(eng.master.gain.value, now);
    eng.master.gain.linearRampToValueAtTime(_ambCurve(st.master), now + 0.8);
    st.on.forEach(id => _ambStartSound(c, id));
    clearInterval(eng.iv);
    eng.iv = setInterval(() => _ambTick(c), 120);
    if (st.timer) {
        if (!(st.left > 0)) st.left = st.timer * 60;
        st.endAt = Date.now() + st.left * 1000;
    }
    _ambRender(c);
}
function _ambPause(c, fade) {
    const st = _ambState(c), eng = c._ambEng;
    if (st.timer && st.endAt) st.left = Math.max(0, (st.endAt - Date.now()) / 1000);
    st.playing = false; st.endAt = 0;
    if (eng) {
        const f = fade == null ? 0.8 : fade, now = eng.ctx.currentTime;
        eng.master.gain.cancelScheduledValues(now);
        eng.master.gain.setValueAtTime(eng.master.gain.value, now);
        eng.master.gain.linearRampToValueAtTime(0, now + f);
        clearTimeout(eng.stopT);
        eng.stopT = setTimeout(() => {
            if (st.playing) return;
            Object.keys(eng.live).forEach(id => _ambStopSound(c, id, 0.05));
            clearInterval(eng.iv); eng.iv = null;
        }, f * 1000 + 100);
    }
    _ambRender(c);
}
// Programme les sons à venir et fait avancer le minuteur
function _ambTick(c) {
    const eng = c._ambEng, st = _ambState(c);
    if (!eng) return;
    if (!document.contains(c)) { _ambDestroy(c); return; }
    const now = eng.ctx.currentTime;
    Object.keys(eng.live).forEach(id => { try { eng.live[id].gen.tick(now, now + 0.35); } catch (e) {} });
    if (st.playing && st.timer && st.endAt) {
        const left = Math.max(0, (st.endAt - Date.now()) / 1000);
        st.left = left;
        _ambRenderTimer(c);
        if (left <= 0) _ambTimerEnd(c);
    }
}
function _ambTimerEnd(c) {
    const st = _ambState(c), eng = c._ambEng;
    st.endAt = 0;
    _ambPause(c, 8);                                        // fondu de 8 secondes
    if (st.chime && eng) setTimeout(() => AmbEngine.chime(eng.ctx, eng.comp), 7500);
    st.left = st.timer * 60;
    _ambFlash(c, '⏰ Temps écoulé : le travail est terminé !', 6000);
    _ambRender(c);
}
function _ambDestroy(c) {
    const eng = c._ambEng;
    if (!eng) return;
    clearInterval(eng.iv); clearTimeout(eng.stopT);
    Object.keys(eng.live).forEach(id => { try { eng.live[id].gen.stop(); eng.live[id].out.disconnect(); } catch (e) {} });
    eng.live = {};
    try { eng.master.disconnect(); eng.comp.disconnect(); } catch (e) {}
    c._ambEng = null;
    if (c._amb) c._amb.playing = false;
}

/* ── Affichage ──────────────────────────────────────────────────── */
function _ambRenderTimer(c) {
    const st = _ambState(c);
    const left = c.querySelector('.amb-left'), prog = c.querySelector('.amb-prog span');
    if (!left || !prog) return;
    if (!st.timer) { left.textContent = ''; prog.style.transform = 'scaleX(0)'; return; }
    const rem = st.left > 0 ? st.left : st.timer * 60;
    left.textContent = (st.playing ? 'Arrêt dans ' : 'Durée : ') + _ambFmt(Math.ceil(rem));
    prog.style.transform = 'scaleX(' + (rem / (st.timer * 60)).toFixed(4) + ')';
}
function _ambRender(c) {
    const st = _ambState(c);
    const first = AMB_SOUNDS.find(s => st.on.indexOf(s.id) !== -1);
    c.style.setProperty('--amb-c', first ? first.col : '#5a5f6b');
    c.classList.toggle('is-playing', !!st.playing);
    const ico = c.querySelector('.amb-play-ico');
    if (ico) ico.textContent = st.playing ? '❚❚' : '▶';
    const pb = c.querySelector('.amb-play');
    if (pb) pb.title = st.playing ? 'Mettre en pause' : 'Lancer les sons';
    const names = AMB_SOUNDS.filter(s => st.on.indexOf(s.id) !== -1).map(s => s.i + ' ' + s.n);
    const status = c.querySelector('.amb-status');
    if (status) status.textContent = st.playing
        ? (names.length ? names.join(' + ') : 'Choisis une ambiance')
        : (names.length ? 'En pause — ' + names.join(' + ') : 'Choisis une ambiance ci-dessous');
    c.querySelectorAll('.amb-tile').forEach(t => {
        const on = st.on.indexOf(t.getAttribute('data-id')) !== -1;
        t.classList.toggle('is-on', on);
        t.setAttribute('aria-pressed', on);
    });
    c.querySelectorAll('.amb-tvol').forEach(r => { const v = st.vols[r.getAttribute('data-id')]; if (+r.value !== v) r.value = v; });
    const m = c.querySelector('.amb-master'); if (m && +m.value !== st.master) m.value = st.master;
    c.querySelectorAll('.amb-chip').forEach(b => b.classList.toggle('is-on', +b.getAttribute('data-m') === st.timer));
    const custom = st.timer && AMB_TIMERS.indexOf(st.timer) === -1;
    const cu = c.querySelector('.amb-custom'); if (cu) cu.classList.toggle('is-on', !!custom);
    const mi = c.querySelector('.amb-min');
    if (mi && document.activeElement !== mi) mi.value = custom ? st.timer : '';
    const cb = c.querySelector('.amb-chime-cb'); if (cb) cb.checked = !!st.chime;
    const ch = c.querySelector('.amb-chime'); if (ch) ch.classList.toggle('is-off', !st.timer);
    _ambRenderTimer(c);
}

/* ── Réglage du minuteur (boutons ou durée libre) ──────────────── */
function _ambSetTimer(c, m) {
    const st = _ambState(c);
    st.timer = m;
    st.left = st.timer * 60;
    st.endAt = st.playing && st.timer ? Date.now() + st.left * 1000 : 0;
    _ambRender(c); _ambSave();
    if (st.timer) _ambFlash(c, '⏱ Arrêt automatique dans ' + st.timer + ' min' + (st.playing ? '' : ' (dès que tu lances les sons)'));
    else _ambFlash(c, '⏱ Sans arrêt automatique');
}
function _ambApplyCustom(c) {
    const inp = c.querySelector('.amb-min');
    if (!inp) return;
    const v = Math.round(parseFloat(String(inp.value).replace(',', '.')));
    if (!(v >= 1)) {
        inp.classList.remove('is-bad'); void inp.offsetWidth; inp.classList.add('is-bad');
        _ambFlash(c, 'Tape un nombre de minutes entre 1 et ' + AMB_TIMER_MAX);
        return;
    }
    const m = Math.min(AMB_TIMER_MAX, v);
    inp.blur();
    _ambSetTimer(c, m);
    if (m !== v) _ambFlash(c, '⚠ Durée maximale : ' + AMB_TIMER_MAX + ' minutes (3 heures)', 3500);
}
function ambMinKey(e, inp) {
    e.stopPropagation();                        // pas de raccourcis du tableau pendant la saisie
    if (e.key === 'Enter') { e.preventDefault(); const c = inp.closest('.amb-w'); if (c) _ambApplyCustom(c); }
    else if (e.key === 'Escape') inp.blur();
}

/* ── Clics et curseurs (délégués : survivent à la sauvegarde) ───── */
document.addEventListener('click', e => {
    const btn = e.target.closest && e.target.closest('[data-amb-action]');
    if (!btn) return;
    const c = btn.closest('.amb-w');
    if (!c) return;
    const st = _ambState(c);
    switch (btn.getAttribute('data-amb-action')) {
        case 'play':
            if (st.playing) _ambPause(c); else _ambPlay(c);
            _ambSave();
            break;
        case 'tile': {
            if (e.target.closest('input')) return;              // le curseur de volume ne bascule pas la vignette
            const id = btn.getAttribute('data-id');
            const i = st.on.indexOf(id);
            if (i !== -1) {
                st.on.splice(i, 1);
                if (st.playing) _ambStopSound(c, id);
                if (st.playing && !st.on.length) _ambPause(c);
            } else {
                st.on.push(id);
                if (st.playing) _ambStartSound(c, id); else _ambPlay(c);
            }
            _ambRender(c); _ambSave();
            break;
        }
        case 'timer':        _ambSetTimer(c, +btn.getAttribute('data-m') || 0); break;
        case 'timer-custom': _ambApplyCustom(c); break;
        case 'help': { const h = c.querySelector('.amb-help'); if (h) h.hidden = !h.hidden; break; }
        case 'help-close': { const h = c.querySelector('.amb-help'); if (h) h.hidden = true; break; }
    }
});
document.addEventListener('input', e => {
    const r = e.target;
    if (!r.closest) return;
    const c = r.closest('.amb-w');
    if (!c) return;
    const st = _ambState(c), eng = c._ambEng;
    if (r.classList.contains('amb-master')) {
        st.master = +r.value;
        if (eng && st.playing) eng.master.gain.setTargetAtTime(_ambCurve(st.master), eng.ctx.currentTime, 0.05);
    } else if (r.classList.contains('amb-tvol')) {
        const id = r.getAttribute('data-id');
        st.vols[id] = +r.value;
        const s = eng && eng.live[id];
        if (s) s.out.gain.setTargetAtTime(_ambCurve(st.vols[id]) * AmbEngine.LEVEL[id], eng.ctx.currentTime, 0.05);
    } else return;
    clearTimeout(c._ambSaveT);
    c._ambSaveT = setTimeout(_ambSave, 400);
});
document.addEventListener('change', e => {
    const cb = e.target.closest && e.target.closest('.amb-chime-cb');
    if (!cb) return;
    const c = cb.closest('.amb-w');
    if (!c) return;
    _ambState(c).chime = cb.checked;
    _ambSave();
});
document.addEventListener('keydown', e => {
    // Entrée / Espace sur une vignette : comme un clic
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('amb-tile')) {
        e.preventDefault(); e.stopPropagation(); e.target.click(); return;
    }
    if (e.key === 'Escape') document.querySelectorAll('.amb-w .amb-help:not([hidden])').forEach(h => { h.hidden = true; });
}, true);

/* ── Déplacement du widget en tirant la barre de titre ───────────── */
function _ambDragStart(e) {
    const bar = e.currentTarget, c = bar.closest('.amb-w');
    if (!c || (e.button !== undefined && e.button !== 0)) return;
    if (e.target.closest('button, .wf-btns, .amb-tools, input')) return;
    e.stopPropagation();                                    // le tableau ne gère pas ce glisser
    if (c.classList.contains('wf-media-fullboard')) return; // pas de déplacement en plein écran
    e.preventDefault();
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
        if (moved) _ambSave();
    };
    bar.addEventListener('pointermove', move);
    bar.addEventListener('pointerup', end);
    bar.addEventListener('pointercancel', end);
}
function _ambBindDrag(c) {
    const bar = c.querySelector('.amb-bar');
    if (!bar || bar._ambDrag) return;
    bar._ambDrag = true;
    bar.addEventListener('pointerdown', _ambDragStart);
    ['mousedown', 'touchstart'].forEach(t => bar.addEventListener(t, ev => {
        if (!ev.target.closest('button, .wf-btns')) ev.stopPropagation();
    }));
}

/* ── Mise en route des widgets (nouveaux ou restaurés) ───────────── */
function _ambInit(c) {
    if (!c || c._ambInited || !c.classList.contains('amb-w')) return;
    c._ambInited = true;
    const bar = c.querySelector('.amb-bar');
    if (bar) { bar.classList.add('editor-toolbar'); bar.title = 'Glisser pour déplacer'; }
    const help = c.querySelector('.amb-help');
    if (help) help.hidden = true;
    _ambBindDrag(c);
    _ambRender(c);
    new MutationObserver(() => _ambFitFullboard(c)).observe(c, { attributes: true, attributeFilter: ['class'] });
    _ambFitFullboard(c);
    // Téléphone et tablette : un nouveau widget s'ouvre directement en plein écran (bouton vert)
    if (!window.isInitialLoading && !window.isRestoringState && _ambIsPhoneOrTablet()) {
        requestAnimationFrame(() => requestAnimationFrame(() => {
            if (!c.isConnected || c.classList.contains('wf-media-fullboard')) return;
            const b = c.querySelector('.wf-btn-max');
            if (b) b.click();
        }));
    }
}

/* ── Plein écran (bouton vert) sur téléphone : laisser la place des onglets à gauche ── */
const _AMB_PHONE_Q = '(max-width: 768px), (max-height: 500px) and (pointer: coarse)';
const _AMB_TABS_W = 40;
const _AMB_FS_PROPS = ['position', 'inset', 'top', 'right', 'bottom', 'left', 'width', 'height', 'max-width', 'max-height', 'margin', 'transform'];
function _ambIsPhone() {
    if (typeof window.isPhoneScreen === 'function') return window.isPhoneScreen();
    return !!(window.matchMedia && window.matchMedia(_AMB_PHONE_Q).matches);
}
// Téléphone OU tablette (ouverture automatique en plein écran)
function _ambIsPhoneOrTablet() {
    if (typeof isMobileBoardMode === 'function') { try { if (isMobileBoardMode()) return true; } catch (e) {} }
    if (typeof isTabletBoardMode === 'function') { try { if (isTabletBoardMode()) return true; } catch (e) {} }
    if (typeof window.isPhoneScreen === 'function' && window.isPhoneScreen()) return true;
    return !!(window.matchMedia && window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse), (pointer: coarse) and (min-width: 601px) and (min-height: 501px)').matches);
}
function _ambFitFullboard(c) {
    const on = c.classList.contains('wf-media-fullboard') && _ambIsPhone();
    if (!on) { _ambUnfit(c); return; }
    if (c._ambFsBusy) return;
    c._ambFsBusy = true;
    if (!c._ambFsFitted) {
        c._ambFsSaved = {};
        _AMB_FS_PROPS.forEach(p => { c._ambFsSaved[p] = [c.style.getPropertyValue(p), c.style.getPropertyPriority(p)]; });
    }
    c._ambFsMine = c._ambFsMine || {};
    const set = (p, v) => { c.style.setProperty(p, v, 'important'); c._ambFsMine[p] = c.style.getPropertyValue(p); };
    const vw = window.innerWidth, vh = window.innerHeight;
    set('position', 'fixed'); set('inset', 'auto'); set('margin', '0'); set('transform', 'none');
    set('top', '0px'); set('left', _AMB_TABS_W + 'px');
    set('right', 'auto'); set('bottom', 'auto');
    set('width', (vw - _AMB_TABS_W) + 'px'); set('height', vh + 'px');
    set('max-width', 'none'); set('max-height', 'none');
    c._ambFsFitted = true;
    const r = c.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
        const sx = r.width / (vw - _AMB_TABS_W), sy = r.height / vh;
        if (Math.abs(r.left - _AMB_TABS_W) > 1 || Math.abs(sx - 1) > 0.01) {
            set('left', (_AMB_TABS_W + (_AMB_TABS_W - r.left) / sx) + 'px');
            set('width', ((vw - _AMB_TABS_W) / sx) + 'px');
        }
        if (Math.abs(r.top) > 1 || Math.abs(sy - 1) > 0.01) {
            set('top', ((0 - r.top) / sy) + 'px');
            set('height', (vh / sy) + 'px');
        }
    }
    c._ambFsBusy = false;
}
function _ambUnfit(c) {
    if (!c._ambFsFitted) return;
    const saved = c._ambFsSaved || {}, mine = c._ambFsMine || {};
    _AMB_FS_PROPS.forEach(p => {
        if (!(p in mine) || c.style.getPropertyValue(p) !== mine[p]) return;
        const v = saved[p];
        if (v && v[0]) c.style.setProperty(p, v[0], v[1]); else c.style.removeProperty(p);
    });
    c._ambFsFitted = false; c._ambFsMine = {}; c._ambFsSaved = null;
}
window.addEventListener('resize', () => document.querySelectorAll('.amb-w.wf-media-fullboard').forEach(c => { _ambUnfit(c); _ambFitFullboard(c); }));

function _ambScan(n) {
    if (!n || n.nodeType !== 1) return;
    if (n.matches('.amb-w')) _ambInit(n);
    else if (n.querySelectorAll) n.querySelectorAll('.amb-w').forEach(_ambInit);
}
new MutationObserver(ms => ms.forEach(m => {
    m.addedNodes.forEach(n => {
        if (n.nodeType === 1 && n.closest && n.closest('.amb-stage, .amb-bar, .amb-help')) return;
        _ambScan(n);
    });
    // Widget fermé (ou tableau vidé) : on coupe le son
    m.removedNodes.forEach(n => {
        if (n.nodeType !== 1) return;
        const list = n.matches && n.matches('.amb-w') ? [n] : (n.querySelectorAll ? Array.from(n.querySelectorAll('.amb-w')) : []);
        list.forEach(c => setTimeout(() => { if (!document.contains(c)) _ambDestroy(c); }, 0));
    });
})).observe(document.body, { childList: true, subtree: true });

/* ── Sauvegarde / restauration (appelées par save-load.js) ──────── */
window.ambGetData = function (widget) {
    const c = widget && widget.querySelector('.amb-w');
    if (!c) return null;
    const st = _ambState(c);
    const left = st.playing && st.endAt ? Math.max(0, (st.endAt - Date.now()) / 1000) : st.left;
    return { on: st.on.slice(), vols: Object.assign({}, st.vols), master: st.master, timer: st.timer, chime: !!st.chime, left: Math.round(left || 0) };
};
window.ambSetData = function (widget, d) {
    const c = widget && widget.querySelector('.amb-w');
    if (!c || !d) return;
    const st = _ambState(c);
    const ids = AMB_SOUNDS.map(s => s.id);
    if (Array.isArray(d.on)) st.on = d.on.filter(id => ids.indexOf(id) !== -1);
    if (d.vols) ids.forEach(id => { if (d.vols[id] != null) st.vols[id] = Math.max(0, Math.min(100, +d.vols[id] || 0)); });
    if (d.master != null) st.master = Math.max(0, Math.min(100, +d.master || 0));
    const tm = Math.round(+d.timer || 0);
    st.timer = tm >= 1 && tm <= AMB_TIMER_MAX ? tm : 0;
    st.chime = d.chime !== false;
    st.left = st.timer && d.left > 0 ? Math.min(d.left, st.timer * 60) : st.timer * 60;
    st.playing = false;                                   // les navigateurs n'autorisent pas la relance automatique
    if (!c._ambInited) _ambInit(c); else _ambRender(c);
};

window.createAmbianceSonoreWidget = function () {
    return typeof createWidget === 'function' ? createWidget('ambiance-sonore') : null;
};

/* ── Styles ─────────────────────────────────────────────────────── */
(function () {
    if (document.getElementById('amb-styles')) return;
    const st = document.createElement('style');
    st.id = 'amb-styles';
    st.textContent = `
.editor-container.amb-w{
  --amb-c:#4a90c2; --amb-gold:#f5b301;
  container-type:inline-size; position:relative; display:flex; flex-direction:column;
  overflow:hidden; box-sizing:border-box; padding:0; background:#18181c; color:#eee;
  font-family:system-ui,-apple-system,"Segoe UI",sans-serif; font-size:13px;
}
.amb-w button{font-family:inherit}
.amb-w :focus-visible{outline:2px solid var(--amb-gold);outline-offset:2px}
/* Barre du haut */
.amb-w .amb-bar{flex:none;position:relative;z-index:10;height:40px;min-height:0;box-sizing:border-box;display:flex;flex-wrap:nowrap;align-items:center;gap:6px;
  padding:0 10px;background:#232329;border-bottom:1px solid #2f2f37;visibility:visible;opacity:1;user-select:none;-webkit-user-select:none}
.amb-w .amb-bar-title{flex:1;min-width:0;font-weight:700;font-size:13px;color:#e6e6ea;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.amb-w .amb-tools{flex:none;display:flex;align-items:center;gap:2px;margin-right:4px}
.amb-w .amb-ib{flex:none;min-width:30px;height:30px;border:0;border-radius:8px;background:transparent;color:#9a9aa6;
  font-size:13px;font-weight:800;line-height:1;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;padding:0 6px}
.amb-w .amb-ib:hover{background:rgba(255,255,255,.1);color:#fff}
.amb-w .amb-ib-help{width:26px;min-width:26px;height:26px;border-radius:50%;background:rgba(245,179,1,.22);color:#ffd970}
.amb-w .amb-ib-help:hover{background:var(--amb-gold);color:#222}
/* Zone principale */
.amb-w .amb-stage{position:relative;flex:1;min-height:0;overflow:auto;display:flex;flex-direction:column;gap:12px;padding:14px;box-sizing:border-box;
  background:radial-gradient(circle at 12% 8%,color-mix(in srgb,var(--amb-c) 50%,transparent),transparent 55%),
             radial-gradient(circle at 90% 100%,color-mix(in srgb,var(--amb-c) 30%,transparent),transparent 55%),#16171f;
  transition:background .6s}
.amb-w .amb-head{flex:none;display:flex;align-items:center;gap:14px;padding:12px 14px;border-radius:18px;
  background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.08)}
.amb-w .amb-play{flex:none;width:58px;height:58px;border:0;border-radius:50%;background:var(--amb-gold);color:#2a2000;font-size:24px;
  display:flex;align-items:center;justify-content:center;box-shadow:0 6px 18px rgba(245,179,1,.4);padding:0}
.amb-w .amb-play:hover{filter:brightness(1.06)}
.amb-w.is-playing .amb-play{background:#fff;color:#2a2a33;box-shadow:0 0 0 6px color-mix(in srgb,var(--amb-c) 45%,transparent)}
.amb-w .amb-play-ico{display:block;line-height:1;transform:translateX(1px)}
.amb-w.is-playing .amb-play-ico{font-size:18px;letter-spacing:-2px;transform:translateX(-1px)}
.amb-w .amb-head-txt{flex:1;min-width:0}
.amb-w .amb-status{font-weight:800;font-size:14.5px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.amb-w .amb-vol{display:flex;align-items:center;gap:8px;margin-top:8px}
.amb-w .amb-vol-ico{flex:none;font-size:14px;opacity:.8}
.amb-w input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:6px;border-radius:99px;background:rgba(255,255,255,.22);outline-offset:4px;margin:0}
.amb-w input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:#fff;border:3px solid var(--amb-gold);cursor:pointer}
.amb-w input[type=range]::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:#fff;border:3px solid var(--amb-gold);cursor:pointer}
.amb-w .amb-eq{flex:none;display:flex;align-items:flex-end;gap:3px;height:30px;width:30px}
.amb-w .amb-eq i{flex:1;height:20%;border-radius:2px;background:rgba(255,255,255,.35)}
.amb-w.is-playing .amb-eq i{background:var(--amb-gold);animation:amb-eq 1s ease-in-out infinite alternate}
.amb-w.is-playing .amb-eq i:nth-child(2){animation-duration:.7s;animation-delay:-.3s}
.amb-w.is-playing .amb-eq i:nth-child(3){animation-duration:1.2s;animation-delay:-.5s}
.amb-w.is-playing .amb-eq i:nth-child(4){animation-duration:.85s;animation-delay:-.2s}
.amb-w.is-playing .amb-eq i:nth-child(5){animation-duration:1.05s;animation-delay:-.7s}
@keyframes amb-eq{from{height:15%}to{height:100%}}
/* Vignettes */
.amb-w .amb-grid{flex:1 0 auto;display:grid;grid-template-columns:repeat(3,1fr);grid-auto-rows:minmax(96px,1fr);gap:10px}
.amb-w .amb-tile{position:relative;display:flex;flex-direction:column;gap:6px;padding:12px 12px 10px;border-radius:16px;box-sizing:border-box;
  background:rgba(255,255,255,.06);border:2px solid rgba(255,255,255,.08);cursor:pointer;transition:background .2s,border-color .2s,transform .1s}
.amb-w .amb-tile:hover{background:rgba(255,255,255,.1)}
.amb-w .amb-tile:active{transform:scale(.98)}
.amb-w .amb-tile.is-on{background:color-mix(in srgb,var(--tc) 32%,transparent);border-color:var(--tc)}
.amb-w .amb-tile-top{display:flex;align-items:flex-start;justify-content:space-between}
.amb-w .amb-tile-ico{font-size:clamp(30px,6.2cqw,54px);line-height:1}
.amb-w.is-playing .amb-tile.is-on .amb-tile-ico{animation:amb-bob 2.4s ease-in-out infinite}
@keyframes amb-bob{50%{transform:translateY(-3px) scale(1.06)}}
.amb-w .amb-tile-on{width:20px;height:20px;border-radius:50%;background:var(--tc);color:#fff;font-size:11px;font-weight:900;
  display:flex;align-items:center;justify-content:center;opacity:0;transform:scale(.6);transition:all .2s}
.amb-w .amb-tile.is-on .amb-tile-on{opacity:1;transform:none}
.amb-w .amb-tile-n{font-weight:800;font-size:clamp(13.5px,2.3cqw,18px);color:#fff;margin-top:auto}
.amb-w .amb-tvol{visibility:hidden}
.amb-w .amb-tile.is-on .amb-tvol{visibility:visible}
.amb-w .amb-tile .amb-tvol::-webkit-slider-thumb{border-color:var(--tc);width:15px;height:15px}
.amb-w .amb-tile .amb-tvol::-moz-range-thumb{border-color:var(--tc)}
/* Minuteur */
.amb-w .amb-timer{flex:none;padding:12px 14px;border-radius:16px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.08)}
.amb-w .amb-timer-head{display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px}
.amb-w .amb-timer-t{font-weight:800;color:#fff;font-size:13.5px}
.amb-w .amb-left{font-weight:800;color:var(--amb-gold);font-variant-numeric:tabular-nums}
.amb-w .amb-chime{margin-left:auto;display:flex;align-items:center;gap:6px;color:#d8d8e0;font-size:12.5px;cursor:pointer}
.amb-w .amb-chime.is-off{opacity:.45}
.amb-w .amb-chime input{width:15px;height:15px;accent-color:#d49a00;margin:0}
.amb-w .amb-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.amb-w .amb-chip{height:30px;border:0;border-radius:99px;padding:0 12px;background:rgba(255,255,255,.1);color:#e6e6ea;font-size:12.5px;font-weight:800}
.amb-w .amb-chip:hover{background:rgba(255,255,255,.18)}
.amb-w .amb-chip.is-on{background:var(--amb-gold);color:#2a2000}
.amb-w .amb-custom{display:inline-flex;align-items:center;gap:5px;height:30px;padding:0 4px 0 10px;border-radius:99px;background:rgba(255,255,255,.1)}
.amb-w .amb-custom.is-on{background:var(--amb-gold)}
.amb-w .amb-custom-t,.amb-w .amb-custom-u{color:#e6e6ea;font-size:12.5px;font-weight:800}
.amb-w .amb-custom.is-on .amb-custom-t,.amb-w .amb-custom.is-on .amb-custom-u{color:#2a2000}
.amb-w .amb-min{width:52px;height:22px;box-sizing:border-box;border:0;border-radius:6px;padding:0 6px;background:#fff;color:#222;
  font:inherit;font-size:13px;font-weight:800;text-align:center;outline:0;-moz-appearance:textfield;user-select:text;-webkit-user-select:text}
.amb-w .amb-min::-webkit-outer-spin-button,.amb-w .amb-min::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
.amb-w .amb-min:focus{box-shadow:0 0 0 2px var(--amb-gold)}
.amb-w .amb-min.is-bad{animation:amb-shake .3s;box-shadow:0 0 0 2px #ff5f57}
@keyframes amb-shake{25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
.amb-w .amb-custom-ok{height:22px;border:0;border-radius:6px;padding:0 8px;background:rgba(0,0,0,.35);color:#fff;font-size:11.5px;font-weight:900}
.amb-w .amb-custom-ok:hover{background:rgba(0,0,0,.55)}
.amb-w .amb-prog{height:5px;margin-top:10px;border-radius:99px;background:rgba(255,255,255,.12);overflow:hidden}
.amb-w .amb-prog span{display:block;height:100%;width:100%;background:var(--amb-gold);transform-origin:left;transform:scaleX(0);transition:transform .3s linear}
/* Aide */
.amb-w .amb-help{position:absolute;left:0;right:0;top:40px;bottom:0;z-index:14;display:flex;align-items:flex-start;justify-content:center;
  padding:14px;box-sizing:border-box;overflow:auto;background:rgba(10,10,20,.6)}
.amb-w .amb-help[hidden]{display:none}
.amb-w .amb-help-card{width:100%;max-width:540px;box-sizing:border-box;background:#fffdf7;color:#2a2a33;border-radius:16px;padding:12px 16px 14px;box-shadow:0 10px 30px rgba(0,0,0,.45)}
.amb-w .amb-help-head{display:flex;align-items:center;justify-content:space-between;gap:8px;font-weight:800;font-size:15px;color:#1f2a44;margin-bottom:6px}
.amb-w .amb-help-head .amb-ib{color:#666}
.amb-w .amb-help-head .amb-ib:hover{background:#eee;color:#222}
.amb-w .amb-help-list{margin:0;padding-left:18px;font-size:13px;line-height:1.5}
.amb-w .amb-help-list li{margin:4px 0}
.amb-w .amb-help-note{margin-top:10px;padding:8px 10px;border-radius:10px;background:#fff3c4;color:#6b5000;font-size:12px}
/* Curseurs */
.editor-container.amb-w,.editor-container.amb-w *{cursor:default!important}
.amb-w .amb-stage,.amb-w .amb-stage *,.amb-w .amb-bar-title{user-select:none;-webkit-user-select:none}
.editor-container.amb-w .amb-bar,.editor-container.amb-w .amb-bar .amb-bar-title{cursor:grab!important;touch-action:none}
.editor-container.amb-w .amb-bar.is-dragging,.editor-container.amb-w .amb-bar.is-dragging *{cursor:grabbing!important}
.editor-container.amb-w.wf-media-fullboard .amb-bar,.editor-container.amb-w.wf-media-fullboard .amb-bar-title{cursor:default!important}
.editor-container.amb-w .amb-bar:active,.editor-container.amb-w .amb-bar:active .amb-bar-title{cursor:grabbing!important}
.editor-container.amb-w.wf-media-fullboard .amb-bar:active,.editor-container.amb-w.wf-media-fullboard .amb-bar:active .amb-bar-title{cursor:default!important}
.editor-container.amb-w button,.editor-container.amb-w button *,.editor-container.amb-w .amb-tile,.editor-container.amb-w .amb-tile *,
.editor-container.amb-w label,.editor-container.amb-w input{cursor:pointer!important}
.editor-container.amb-w input.amb-min{cursor:text!important}
.amb-w input[type=range]{touch-action:none}
/* Message temporaire */
.amb-w .amb-flash{position:absolute;left:50%;top:10px;transform:translateX(-50%);z-index:13;max-width:calc(100% - 24px);box-sizing:border-box;
  padding:7px 14px;border-radius:12px;background:rgba(0,0,0,.85);color:#fff;font-size:12.5px;font-weight:600;text-align:center;
  pointer-events:none;opacity:0;transition:opacity .25s}
.amb-w .amb-flash.is-on{opacity:1}
/* Widget étroit */
@container (max-width: 470px){
  .amb-w .amb-grid{grid-template-columns:repeat(2,1fr)}
  .amb-w .amb-eq{display:none}
  .amb-w .amb-stage{padding:10px;gap:10px}
  .amb-w .amb-chime{margin-left:0}
}
@container (max-width: 300px){
  .amb-w .amb-bar-title{font-size:0}
  .amb-w .amb-bar-title::before{content:"🎧";font-size:15px}
}
@media print{ .amb-w .amb-bar{display:none} }
`;
    document.head.appendChild(st);
})();

// Widgets déjà présents au chargement du script.
_ambScan(document.body);
