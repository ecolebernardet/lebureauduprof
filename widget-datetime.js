// =========================================================================
// WIDGET DATE & HEURE
// =========================================================================

// ── CSS ───────────────────────────────────────────────────────────────────
(function() {
    const s = document.createElement('style');
    s.textContent = `
        .widget[data-type="date"], .widget[data-type="time"] { min-width: unset; width: auto; }
        .widget[data-type="date"] .editor-container, .widget[data-type="time"] .editor-container { overflow: hidden; display: flex; flex-direction: column; justify-content: center; align-items: center; background: white; resize: none; }
        .widget[data-type="date"] .editor-container { min-width: 150px; min-height: 180px; }
        .widget[data-type="time"] .editor-container { min-width: 120px; min-height: 80px; border: none; }
        .widget[data-type="date"] .editor-container::-webkit-resizer,
        .widget[data-type="time"] .editor-container::-webkit-resizer { background-color: transparent; background-image: none; }
        .calendar-page { width: 100%; height: 100%; display: flex; flex-direction: column; border: 1px solid #ced4da; border-radius: 8px; overflow: visible; background: white; text-align: center; position: relative; padding-top: 15px; box-sizing: border-box; }
        .calendar-header { background: #D17B6B; height: 20%; min-height: 30px; border-bottom: 2px solid #B5634F; margin-bottom: 5px; position: relative; overflow: visible; }
        .calendar-rings-svg { position: absolute; left: 0; width: 100%; pointer-events: none; overflow: visible; }
        .calendar-body { flex-grow: 1; display: flex; flex-direction: column; justify-content: center; padding: 2px 5px; gap: 1px; }
        .calendar-day-name   { font-size: 0.95em; font-weight: 700; color: #333; text-transform: lowercase; line-height: 1.1; }
        .calendar-day-number { font-size: 2.5em; font-weight: 800; color: #2c3e50; line-height: 1em; margin: 0; }
        .calendar-month      { font-size: 1.25em; font-weight: 600; color: #333; line-height: 1.1; }
        .clock-time { font-weight: 800; color: var(--primary-color); font-family: 'marelle', monospace; display: flex; align-items: baseline; justify-content: center; width: 100%; gap: 4px; }
        .clock-seconds { font-size: 0.5em; color: #888; margin-left: 0.1em; }
        .icon-transparency { display: inline-block; width: 16px; height: 16px; border: 1px solid #333; background-color: #fff; background-image: linear-gradient(45deg,#ddd 25%,transparent 25%),linear-gradient(-45deg,#ddd 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ddd 75%),linear-gradient(-45deg,transparent 75%,#ddd 75%); background-size: 8px 8px; background-position: 0 0,0 4px,4px -4px,-4px 0px; vertical-align: middle; border-radius: 2px; }

        /* Panneau paramètres horloge */
        .clock-settings-panel {
            position: absolute; top: 30px; right: 4px; z-index: 100;
            background: white; border: 1px solid #ddd; border-radius: 8px;
            padding: 10px 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            display: none; flex-direction: column; gap: 10px; min-width: 170px;
        }
        .clock-settings-panel.open { display: flex; }
        .clock-settings-panel label { font-size: 11px; color: #555; font-weight: 600; margin-bottom: 2px; display: block; }
        .clock-settings-panel .setting-row { display: flex; flex-direction: column; gap: 3px; }
        .clock-settings-panel .color-row { display: flex; align-items: center; gap: 8px; }
        .clock-settings-panel input[type="color"] { width: 32px; height: 22px; border: 1px solid #ccc; border-radius: 4px; padding: 0; cursor: pointer; }
        .clock-settings-panel .color-presets { display: flex; gap: 4px; flex-wrap: wrap; }
        .clock-settings-panel .color-preset { width: 18px; height: 18px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; transition: border-color 0.15s; }
        .clock-settings-panel .color-preset:hover, .clock-settings-panel .color-preset.active { border-color: #333; }
        .clock-settings-panel .mode-btns { display: flex; gap: 5px; }
        .clock-settings-panel .mode-btn {
            flex: 1; padding: 4px 0; font-size: 11px; border: 1px solid #ccc;
            border-radius: 5px; background: #f5f5f5; cursor: pointer; text-align: center;
            transition: background 0.15s, border-color 0.15s;
        }
        .clock-settings-panel .mode-btn.active { background: #D17B6B; color: white; border-color: #B5634F; }
        .clock-settings-panel .sep { border: none; border-top: 1px solid #eee; margin: 2px 0; }

        /* Horloge analogique */
        .clock-analog { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
        .clock-analog svg { overflow: visible; }
    `;
    document.head.appendChild(s);
})();

// ── Templates ─────────────────────────────────────────────────────────────
(function() {
    const tplDate = document.createElement('template');
    tplDate.id = 'template-date';
    tplDate.innerHTML = `
        <div class="editor-container" style="width:220px;height:260px;overflow:hidden;">
            <div class="calendar-page" style="font-size:16px;">
                <div class="calendar-header">
                    <svg class="calendar-rings-svg" xmlns="http://www.w3.org/2000/svg"></svg>
                </div>
                <div class="calendar-body">
                    <div class="calendar-day-name"></div>
                    <div class="calendar-day-number"></div>
                    <div class="calendar-month"></div>
                </div>
            </div>
        </div>`;
    document.body.appendChild(tplDate);

    const tplTime = document.createElement('template');
    tplTime.id = 'template-time';
    tplTime.innerHTML = `
        <div class="editor-container" style="width:200px;height:100px;display:flex;align-items:center;justify-content:center;overflow:hidden;border:none;">
            <div class="clock-time" style="font-family:'marelle';font-size:25px;width:90%;height:100%;display:flex;align-items:center;justify-content:center;padding:0 16px;box-sizing:border-box;">
                <span class="clock-hm">00:00</span><span class="clock-seconds">00</span>
            </div>
        </div>`;
    document.body.appendChild(tplTime);
})();

// ── Horloge ───────────────────────────────────────────────────────────────
function updateClock() {
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' });
    const timeStr = now.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
    document.querySelectorAll('.agenda-current-date').forEach(el => el.textContent = dateStr);
    document.querySelectorAll('.agenda-current-time').forEach(el => el.textContent = timeStr);
    updateDateTime();
}

function updateDateTime() {
    const now = new Date();
    const days   = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
    const months = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
    document.querySelectorAll('.calendar-day-name').forEach(el   => el.textContent = days[now.getDay()]);
    document.querySelectorAll('.calendar-day-number').forEach(el => el.textContent = now.getDate());
    document.querySelectorAll('.calendar-month').forEach(el      => el.textContent = months[now.getMonth()]);

    const hh = String(now.getHours()).padStart(2,'0');
    const mm = String(now.getMinutes()).padStart(2,'0');
    const ss = String(now.getSeconds()).padStart(2,'0');

    // Mise à jour horloges numériques
    document.querySelectorAll('.clock-hm').forEach(el      => el.textContent = ` ${hh}:${mm} `);
    document.querySelectorAll('.clock-seconds').forEach(el => el.textContent = ss);

    // Mise à jour horloges analogiques
    document.querySelectorAll('.clock-analog-svg').forEach(svg => {
        const h = now.getHours() % 12, m = now.getMinutes(), s = now.getSeconds();
        const secDeg  = s * 6;
        const minDeg  = m * 6 + s * 0.1;
        const hourDeg = h * 30 + m * 0.5;
        const handH   = svg.querySelector('.hand-hour');
        const handM   = svg.querySelector('.hand-min');
        const handS   = svg.querySelector('.hand-sec');
        if (handH) handH.setAttribute('transform', `rotate(${hourDeg}, 50, 50)`);
        if (handM) handM.setAttribute('transform', `rotate(${minDeg}, 50, 50)`);
        if (handS) handS.setAttribute('transform', `rotate(${secDeg}, 50, 50)`);
    });
}

// ── Créer SVG horloge analogique ──────────────────────────────────────────
function buildAnalogSVG(color) {
    color = color || '#2c3e50';
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.classList.add('clock-analog-svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.cssText = 'max-width:100%;max-height:100%;';

    // Cadran
    const circle = document.createElementNS(ns, 'circle');
    circle.setAttribute('cx', '50'); circle.setAttribute('cy', '50'); circle.setAttribute('r', '47');
    circle.setAttribute('fill', 'white'); circle.setAttribute('stroke', color); circle.setAttribute('stroke-width', '2');
    svg.appendChild(circle);

    // Graduations (traits minutes fins + traits heures épais)
    for (let i = 0; i < 60; i++) {
        const isHour = i % 5 === 0;
        const angle = (i * 6 - 90) * Math.PI / 180;
        const r1 = isHour ? 41 : 43, r2 = 46;
        const x1 = 50 + r1 * Math.cos(angle), y1 = 50 + r1 * Math.sin(angle);
        const x2 = 50 + r2 * Math.cos(angle), y2 = 50 + r2 * Math.sin(angle);
        const tick = document.createElementNS(ns, 'line');
        tick.setAttribute('x1', x1); tick.setAttribute('y1', y1);
        tick.setAttribute('x2', x2); tick.setAttribute('y2', y2);
        tick.setAttribute('stroke', color);
        tick.setAttribute('stroke-width', isHour ? '2' : '0.8');
        svg.appendChild(tick);
    }

    // Chiffres des heures 1–12
    const numR = 35;
    for (let h = 1; h <= 12; h++) {
        const angle = (h * 30 - 90) * Math.PI / 180;
        const x = 50 + numR * Math.cos(angle);
        const y = 50 + numR * Math.sin(angle);
        const txt = document.createElementNS(ns, 'text');
        txt.setAttribute('x', x);
        txt.setAttribute('y', y);
        txt.setAttribute('text-anchor', 'middle');
        txt.setAttribute('dominant-baseline', 'central');
        txt.setAttribute('font-size', [3,6,9,12].includes(h) ? '8' : '7');
        txt.setAttribute('font-weight', '600');
        txt.setAttribute('font-family', 'marelle, sans-serif');
        txt.setAttribute('fill', color);
        txt.textContent = h;
        svg.appendChild(txt);
    }

    // Aiguille heures
    const handH = document.createElementNS(ns, 'line');
    handH.classList.add('hand-hour');
    handH.setAttribute('x1', '50'); handH.setAttribute('y1', '50');
    handH.setAttribute('x2', '50'); handH.setAttribute('y2', '24');
    handH.setAttribute('stroke', color); handH.setAttribute('stroke-width', '4');
    handH.setAttribute('stroke-linecap', 'round');
    svg.appendChild(handH);

    // Aiguille minutes
    const handM = document.createElementNS(ns, 'line');
    handM.classList.add('hand-min');
    handM.setAttribute('x1', '50'); handM.setAttribute('y1', '50');
    handM.setAttribute('x2', '50'); handM.setAttribute('y2', '16');
    handM.setAttribute('stroke', color); handM.setAttribute('stroke-width', '3');
    handM.setAttribute('stroke-linecap', 'round');
    svg.appendChild(handM);

    // Aiguille secondes
    const handS = document.createElementNS(ns, 'line');
    handS.classList.add('hand-sec');
    handS.setAttribute('x1', '50'); handS.setAttribute('y1', '56');
    handS.setAttribute('x2', '50'); handS.setAttribute('y2', '12');
    handS.setAttribute('stroke', '#D17B6B'); handS.setAttribute('stroke-width', '1.5');
    handS.setAttribute('stroke-linecap', 'round');
    svg.appendChild(handS);

    // Centre
    const dot = document.createElementNS(ns, 'circle');
    dot.setAttribute('cx', '50'); dot.setAttribute('cy', '50'); dot.setAttribute('r', '3');
    dot.setAttribute('fill', color);
    svg.appendChild(dot);

    return svg;
}

// ── Init widget Heure ─────────────────────────────────────────────────────
function initTimeWidget(widget) {
    const container = widget.querySelector('.editor-container');
    const clockTime = widget.querySelector('.clock-time');
    if (!container || !clockTime) return;

    // État des paramètres (avec valeurs par défaut)
    let clockColor  = widget.dataset.clockColor  || '#2c3e50';
    let clockMode   = widget.dataset.clockMode   || 'digital'; // 'digital' | 'analog'

    // Appliquer couleur initiale
    clockTime.style.color = clockColor;

    const resizeObserver = new ResizeObserver(() => {
        const h = container.offsetHeight, w = container.offsetWidth;
        if (clockMode === 'digital') {
            // sizeByH : hauteur disponible (avec marge)
            const sizeByH = Math.floor(h * 0.45);
            // sizeByW : la largeur doit contenir "HH:MM" (5 chars ~0.6em chacun) + secondes (~0.45em * 2 chars)
            // soit ~3.9em total → size ≈ w / 3.9, avec padding latéral soustrait
            const usableW = w - 44; // soustraire padding
            const sizeByW = Math.floor(usableW / 4.0);
            const size = Math.max(12, Math.min(sizeByH, sizeByW));
            clockTime.style.fontSize = size + 'px';
            const sec = widget.querySelector('.clock-seconds');
            if (sec) sec.style.fontSize = Math.floor(size * 0.45) + 'px';
        }
    });
    resizeObserver.observe(container);
    container.style.resize = 'none';

    // ── Fonction basculement mode ────────────────────────────────────────
    function applyMode(mode) {
        clockMode = mode;
        widget.dataset.clockMode = mode;

        const analog = container.querySelector('.clock-analog');

        if (mode === 'analog') {
            clockTime.style.display = 'none';
            if (!analog) {
                const wrap = document.createElement('div');
                wrap.className = 'clock-analog';
                wrap.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;padding:6px;box-sizing:border-box;';
                wrap.appendChild(buildAnalogSVG(clockColor));
                container.appendChild(wrap);
            } else {
                analog.style.display = 'flex';
            }
            updateDateTime(); // mettre à jour les aiguilles tout de suite
        } else {
            clockTime.style.display = 'flex';
            if (analog) analog.style.display = 'none';
        }
        if (typeof saveBoard === 'function') saveBoard();
    }

    // ── Fonction changement couleur ──────────────────────────────────────
    function applyColor(color) {
        clockColor = color;
        widget.dataset.clockColor = color;
        clockTime.style.color = color;

        // Mettre à jour l'analogique si présent
        const svg = container.querySelector('.clock-analog-svg');
        if (svg) {
            // Recréer le SVG avec la nouvelle couleur
            const wrap = container.querySelector('.clock-analog');
            if (wrap) {
                wrap.innerHTML = '';
                wrap.appendChild(buildAnalogSVG(color));
                updateDateTime();
            }
        }
        if (typeof saveBoard === 'function') saveBoard();
    }

    // Appliquer le mode initial si déjà sauvegardé
    if (clockMode === 'analog') applyMode('analog');

    // ── Poignée de resize ────────────────────────────────────────────────
    const resizeHandle = document.createElement('div');
    resizeHandle.style.cssText = 'position:absolute;right:0;bottom:0;width:18px;height:18px;cursor:se-resize;background:linear-gradient(135deg,transparent 50%,#aaa 50%);border-radius:0 0 4px 0;opacity:0;transition:opacity 0.2s;z-index:10;';
    widget.appendChild(resizeHandle);
    widget.addEventListener('mouseenter', () => resizeHandle.style.opacity = '1');
    widget.addEventListener('mouseleave', () => resizeHandle.style.opacity = '0');
    resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const startX = e.clientX, startY = e.clientY;
        const startW = container.offsetWidth, startH = container.offsetHeight;
        document.onmousemove = (ev) => {
            container.style.width  = Math.max(100, startW + ev.clientX - startX) + 'px';
            container.style.height = Math.max(60,  startH + ev.clientY - startY) + 'px';
        };
        document.onmouseup = () => { document.onmousemove = null; saveBoard(); };
    });
    resizeHandle.addEventListener('touchstart', (e) => {
        e.preventDefault(); e.stopPropagation();
        const t0 = e.touches[0];
        const startX = t0.clientX, startY = t0.clientY;
        const startW = container.offsetWidth, startH = container.offsetHeight;
        function onMove(ev) {
            const t = ev.touches[0];
            container.style.width  = Math.max(100, startW + t.clientX - startX) + 'px';
            container.style.height = Math.max(60,  startH + t.clientY - startY) + 'px';
        }
        function onEnd() {
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend',  onEnd);
            saveBoard();
        }
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend',  onEnd);
    }, { passive: false });

    // ── Bouton transparence ──────────────────────────────────────────────
    const transpBtn = document.createElement('button');
    transpBtn.title = 'Fond transparent';
    transpBtn.style.cssText = 'position:absolute;top:4px;right:54px;background:rgba(255,255,255,0.8);border:1px solid #ddd;border-radius:4px;width:22px;height:22px;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.2s;z-index:10;padding:0;';
    transpBtn.innerHTML = '<span class="icon-transparency"></span>';
    transpBtn.addEventListener('click', () => {
        snapshotNow();
        applyTransparency(widget, widget.dataset.transparent !== 'true');
        saveBoard();
    });
    widget.appendChild(transpBtn);

    // ── Bouton paramètres ────────────────────────────────────────────────
    const settingsBtn = document.createElement('button');
    settingsBtn.title = 'Paramètres de l\'horloge';
    settingsBtn.style.cssText = 'position:absolute;top:4px;right:30px;background:rgba(255,255,255,0.8);border:1px solid #ddd;border-radius:4px;width:22px;height:22px;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.2s;z-index:11;padding:0;font-size:13px;';
    settingsBtn.textContent = '⚙';
    widget.appendChild(settingsBtn);

    // ── Panneau paramètres ───────────────────────────────────────────────
    const PRESETS = ['#2c3e50','#D17B6B','#2980b9','#27ae60','#8e44ad','#e67e22','#e74c3c','#ffffff'];

    const panel = document.createElement('div');
    panel.className = 'clock-settings-panel';
    panel.innerHTML = `
        <div class="setting-row">
            <label>Mode d'affichage</label>
            <div class="mode-btns">
                <button class="mode-btn" data-mode="digital">🔢 Numérique</button>
                <button class="mode-btn" data-mode="analog">🕐 Analogique</button>
            </div>
        </div>
        <hr class="sep">
        <div class="setting-row">
            <label>Couleur des chiffres</label>
            <div class="color-row">
                <input type="color" class="clock-color-picker" value="${clockColor}">
                <div class="color-presets">
                    ${PRESETS.map(c => `<div class="color-preset" data-color="${c}" style="background:${c};${c==='#ffffff'?'border:1px solid #ccc;':''}" title="${c}"></div>`).join('')}
                </div>
            </div>
        </div>
    `;
    widget.appendChild(panel);

    // Mettre à jour l'état visuel des boutons mode
    function refreshModeButtons() {
        panel.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === clockMode);
        });
    }
    refreshModeButtons();

    // Mettre à jour le preset actif
    function refreshPresets(color) {
        panel.querySelectorAll('.color-preset').forEach(p => {
            p.classList.toggle('active', p.dataset.color === color);
        });
        panel.querySelector('.clock-color-picker').value = color.startsWith('#') && color.length === 7 ? color : '#2c3e50';
    }
    refreshPresets(clockColor);

    // Events mode
    panel.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            applyMode(btn.dataset.mode);
            refreshModeButtons();
        });
    });

    // Events couleur — picker
    panel.querySelector('.clock-color-picker').addEventListener('input', (e) => {
        e.stopPropagation();
        applyColor(e.target.value);
        refreshPresets(e.target.value);
    });

    // Events couleur — presets
    panel.querySelectorAll('.color-preset').forEach(p => {
        p.addEventListener('click', (e) => {
            e.stopPropagation();
            applyColor(p.dataset.color);
            refreshPresets(p.dataset.color);
        });
    });

    // Toggle panneau
    settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        panel.classList.toggle('open');
    });

    // Fermer si clic ailleurs
    document.addEventListener('click', () => panel.classList.remove('open'));
    panel.addEventListener('click', e => e.stopPropagation());

    // Visibilité au survol
    widget.addEventListener('mouseenter', () => {
        transpBtn.style.opacity = '1';
        settingsBtn.style.opacity = '1';
    });
    widget.addEventListener('mouseleave', () => {
        transpBtn.style.opacity = '0';
        settingsBtn.style.opacity = '0';
    });
}

// ── Init widget Date ──────────────────────────────────────────────────────
function initDateWidget(widget) {
    const container = widget.querySelector('.editor-container');
    const dayName   = widget.querySelector('.calendar-day-name');
    const dayNumber = widget.querySelector('.calendar-day-number');
    const month     = widget.querySelector('.calendar-month');
    const header    = widget.querySelector('.calendar-header');
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
        const h = container.offsetHeight, w = container.offsetWidth;
        if (header) header.style.height = Math.floor(h * 0.20) + 'px';
        const bodyH = h * 0.75;
        const baseSize = Math.min(w * 0.18, bodyH * 0.14, w / 8);
        const maxLine = bodyH * 0.30;
        if (dayName)   dayName.style.fontSize   = Math.max(10, Math.min(Math.floor(baseSize * 1.0),  maxLine)) + 'px';
        if (dayNumber) dayNumber.style.fontSize = Math.max(20, Math.min(Math.floor(baseSize * 3.2),  maxLine * 1.5)) + 'px';
        if (month)     month.style.fontSize     = Math.max(10, Math.min(Math.floor(baseSize * 1.35), maxLine)) + 'px';

        // Dessiner les piliers en SVG
        const svg = widget.querySelector('.calendar-rings-svg');
        if (svg && header) {
            const hw = header.offsetWidth, hh = header.offsetHeight;
            const overflowTop = Math.floor(hh * 0.7);
            const totalH = hh + overflowTop;
            svg.setAttribute('viewBox', `0 0 ${hw} ${totalH}`);
            svg.setAttribute('height', totalH);
            svg.style.top = -overflowTop + 'px';
            svg.style.height = totalH + 'px';

            const n = 4;
            const margin = hw * 0.15;
            const step = (hw - margin * 2) / (n - 1);
            const pw = Math.max(5, Math.min(10, hw * 0.04));
            const pr = pw / 2;
            const pillarTop = 4;
            const pillarBot = totalH * 0.78;
            const pillarH = pillarBot - pillarTop;
            const circR = Math.max(5, pw * 0.9);

            let svgContent = `<defs>
                <linearGradient id="pillarGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"   stop-color="#aaa"/>
                    <stop offset="40%"  stop-color="#e8e8e8"/>
                    <stop offset="100%" stop-color="#888"/>
                </linearGradient>
            </defs>`;

            for (let i = 0; i < n; i++) {
                const cx = margin + i * step;
                const x  = cx - pr;
                svgContent += `<rect x="${x}" y="${pillarTop}" width="${pw}" height="${pillarH}" rx="${pr}" fill="url(#pillarGrad)"/>`;
                svgContent += `<circle cx="${cx}" cy="${pillarBot}" r="${circR}" fill="#7a2020"/>`;
                svgContent += `<circle cx="${cx}" cy="${pillarBot}" r="${circR * 0.55}" fill="#5a1515"/>`;
            }
            svg.innerHTML = svgContent;
        }
    });
    resizeObserver.observe(container);

    // Poignée de resize
    const resizeHandle = document.createElement('div');
    resizeHandle.style.cssText = 'position:absolute;right:0;bottom:0;width:18px;height:18px;cursor:se-resize;background:linear-gradient(135deg,transparent 50%,#aaa 50%);border-radius:0 0 4px 0;opacity:0;transition:opacity 0.2s;z-index:10;';
    widget.appendChild(resizeHandle);
    widget.addEventListener('mouseenter', () => resizeHandle.style.opacity = '1');
    widget.addEventListener('mouseleave', () => resizeHandle.style.opacity = '0');
    resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const startX = e.clientX, startY = e.clientY;
        const startW = container.offsetWidth, startH = container.offsetHeight;
        document.onmousemove = (ev) => {
            container.style.width  = Math.max(150, startW + ev.clientX - startX) + 'px';
            container.style.height = Math.max(180, startH + ev.clientY - startY) + 'px';
        };
        document.onmouseup = () => { document.onmousemove = null; saveBoard(); };
    });
    resizeHandle.addEventListener('touchstart', (e) => {
        e.preventDefault(); e.stopPropagation();
        const t0 = e.touches[0];
        const startX = t0.clientX, startY = t0.clientY;
        const startW = container.offsetWidth, startH = container.offsetHeight;
        function onMove(ev) {
            const t = ev.touches[0];
            container.style.width  = Math.max(150, startW + t.clientX - startX) + 'px';
            container.style.height = Math.max(180, startH + t.clientY - startY) + 'px';
        }
        function onEnd() {
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend',  onEnd);
            saveBoard();
        }
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend',  onEnd);
    }, { passive: false });

    // Bouton transparence
    const transpBtn = document.createElement('button');
    transpBtn.title = 'Fond transparent';
    transpBtn.style.cssText = 'position:absolute;top:4px;right:30px;background:rgba(255,255,255,0.8);border:1px solid #ddd;border-radius:4px;width:22px;height:22px;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.2s;z-index:10;padding:0;';
    transpBtn.innerHTML = '<span class="icon-transparency"></span>';
    transpBtn.addEventListener('click', () => {
        snapshotNow();
        applyTransparency(widget, widget.dataset.transparent !== 'true');
        saveBoard();
    });
    widget.appendChild(transpBtn);
    widget.addEventListener('mouseenter', () => transpBtn.style.opacity = '1');
    widget.addEventListener('mouseleave', () => transpBtn.style.opacity = '0');
}
