// =========================================================================
// WIDGET DÉFI CALME 2 (DESSIN) — Le Bureau du Prof
// Un dessin se trace petit à petit au silence (micro) — 3 modes :
//   Crayon   : tous les contours se tracent, puis les couleurs arrivent
//   Peinture : chaque forme est tracée puis coloriée, l'une après l'autre
//   Magie    : les formes apparaissent une par une
// Paramètres identiques au Défi Calme : mode, tolérance, durée,
//   import (SVG), URL (SVG), dessin aléatoire, aperçu, masquer les contrôles.
//
// Dépendances : board, findFreePosition(), makeDraggable(),
//   makeDraggableRotate(), bringToFront(), snapshotNow(), saveBoard()
// =========================================================================

// ── CSS ───────────────────────────────────────────────────────────────────
(function () {
    const s = document.createElement('style');
    s.textContent = `
        .widget[data-type="deficalme2"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        /* ── Thème clair (body.menu-light) ── */
        body.menu-light .dc2-container {
            background: #f0f2f5;
            box-shadow: 0 8px 32px rgba(0,0,0,0.15);
            color: #1a1a1a;
        }
        body.menu-light .dc2-controls {
            background: #e2e6ea;
            border-top: 1px solid rgba(0,0,0,0.1);
        }
        body.menu-light .dc2-label { opacity: 0.55; color: #1a1a1a; }
        body.menu-light .dc2-mode-wrap { background: rgba(0,0,0,0.07); }
        body.menu-light .dc2-mode-btn { border-color: rgba(0,0,0,0.12); color: rgba(0,0,0,0.5); }
        body.menu-light .dc2-time-pill { background: rgba(0,0,0,0.07); border-color: rgba(0,0,0,0.12); }
        body.menu-light .dc2-time-val { color: #1a1a1a; }
        body.menu-light .dc2-url-input {
            background: rgba(0,0,0,0.06);
            border-color: rgba(0,0,0,0.15);
            color: #1a1a1a;
        }
        body.menu-light .dc2-url-input::placeholder { color: rgba(0,0,0,0.35); }
        body.menu-light .dc2-resize-handle {
            background: linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.2) 50%);
        }

        .dc2-container {
            background: #121212;
            border-radius: 5px;
            display: flex;
            flex-direction: column;
            width: 600px;
            overflow: hidden;
            box-shadow: 0 8px 32px rgba(0,0,0,0.5);
            font-family: 'Segoe UI', system-ui, sans-serif;
            color: #fff;
            position: relative;
            user-select: none;
        }

        /* ── Zone dessin (feuille de papier) ── */
        .dc2-image-zone {
            position: relative;
            width: 100%;
            aspect-ratio: 16 / 9;
            background: #fdfcf8;
            overflow: hidden;
            flex-shrink: 0;
        }
        .dc2-svg {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            display: block;
        }
        .dc2-pen {
            pointer-events: none;
            transition: opacity 0.2s;
        }

        .dc2-msg-start {
            position: absolute;
            inset: 0;
            z-index: 10;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 1rem;
            font-size: 0.85rem;
            font-weight: 700;
            pointer-events: none;
            color: #2d2a32;
            opacity: 0.55;
        }

        /* ── Barre micro (en bas) ── */
        .dc2-mic-bar-wrap {
            position: absolute;
            bottom: 0; left: 0; right: 0;
            height: 5px;
            background: rgba(0,0,0,0.08);
            z-index: 8;
        }
        .dc2-mic-bar-fill {
            height: 100%;
            width: 0%;
            background: #3b82f6;
            transition: width 0.08s;
        }

        /* ── Barre progression (à droite) ── */
        .dc2-prog-bar-wrap {
            position: absolute;
            top: 0; right: 0; bottom: 0;
            width: 10px;
            background: rgba(0,0,0,0.08);
            z-index: 8;
            display: flex;
            flex-direction: column-reverse;
        }
        .dc2-prog-bar-fill {
            width: 100%;
            height: 0%;
            background: #3b82f6;
            transition: height 0.15s;
        }
        .dc2-percent-badge {
            position: absolute;
            top: 6px;
            right: 15px;
            font-size: 14px;
            font-weight: 900;
            color: #fff;
            opacity: 0.9;
            z-index: 9;
            text-shadow: 0 1px 3px rgba(0,0,0,1);
        }

        /* ── Panneau contrôles ── */
        .dc2-controls {
            padding: 8px 12px 10px;
            display: flex;
            flex-direction: column;
            gap: 7px;
            background: #1a1a1a;
            border-top: 1px solid rgba(255,255,255,0.07);
        }
        .dc2-row {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
        }
        .dc2-group {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-shrink: 0;
        }
        .dc2-label {
            font-size: 9px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            opacity: 0.4;
            flex-shrink: 0;
        }

        .dc2-mode-wrap {
            display: flex;
            background: rgba(255,255,255,0.06);
            border-radius: 8px;
            padding: 3px;
            gap: 3px;
        }
        .dc2-mode-btn {
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            cursor: pointer;
            border: 1px solid rgba(255,255,255,0.1);
            background: transparent;
            color: rgba(255,255,255,0.5);
            transition: all 0.15s;
        }
        .dc2-mode-btn.active {
            background: #3b82f6;
            color: #fff;
            border-color: #3b82f6;
        }

        .dc2-time-pill {
            display: flex;
            align-items: center;
            gap: 6px;
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 50px;
            padding: 3px 10px;
        }
        .dc2-time-val {
            font-size: 12px;
            font-weight: 900;
            min-width: 42px;
            text-align: center;
        }
        .dc2-time-btn {
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: #3b82f6;
            border: none;
            color: #fff;
            font-size: 13px;
            font-weight: 900;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.15s;
            user-select: none;
        }
        .dc2-time-btn:active { transform: scale(0.88); }

        /* Boutons action flottants (sur le dessin, en bas à gauche) */
        .dc2-action-row {
            position: absolute;
            bottom: 8px;
            left: 15px;
            z-index: 15;
            display: flex;
            gap: 6px;
        }
        .dc2-float-action-btn {
            background: rgba(0,0,0,0.0);
            border: 1px solid rgba(0,0,0,0.25);
            color: rgba(0,0,0,0.55);
            font-size: 9px;
            font-weight: 900;
            padding: 5px 10px;
            border-radius: 6px;
            cursor: pointer;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            transition: all 0.2s;
        }
        .dc2-float-action-btn:hover {
            background: rgba(0,0,0,0.8);
            border-color: rgba(255,255,255,0.8);
            color: #fff;
        }
        .dc2-float-action-btn:active { transform: scale(0.96); }
        .dc2-float-action-btn.dc2-stop:hover { border-color: #ef4444; color: #ef4444; }
        .dc2-float-action-btn.dc2-hidden { display: none !important; }
        .dc2-float-action-btn.dc2-start,
        .dc2-float-action-btn.dc2-start:hover {
            background: #3b82f6 !important;
            border-color: #3b82f6 !important;
            color: #fff !important;
        }
        .dc2-float-action-btn.dc2-start:hover { opacity: 0.88; }
        .dc2-float-action-btn.dc2-new,
        .dc2-float-action-btn.dc2-new:hover {
            background: #10b981 !important;
            border-color: #10b981 !important;
            color: #fff !important;
        }
        .dc2-float-action-btn.dc2-new:hover { opacity: 0.88; }

        .dc2-url-input {
            flex: 1;
            background: rgba(255,255,255,0.07);
            border: 1px solid rgba(255,255,255,0.15);
            border-radius: 7px;
            color: #fff;
            font-size: 10px;
            padding: 4px 8px;
            outline: none;
            min-width: 0;
        }
        .dc2-url-input::placeholder { color: rgba(255,255,255,0.35); }
        .dc2-url-input:focus { border-color: #3b82f6; }
        .dc2-url-btn {
            padding: 4px 10px;
            border-radius: 7px;
            background: #3b82f6;
            border: none;
            color: #fff;
            font-size: 10px;
            font-weight: 800;
            cursor: pointer;
            white-space: nowrap;
        }

        .dc2-resize-handle {
            position: absolute;
            right: 0; bottom: 0;
            width: 18px; height: 18px;
            cursor: se-resize;
            background: linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.25) 50%);
            border-radius: 0 0 16px 0;
            opacity: 0;
            transition: opacity 0.2s;
            z-index: 20;
        }
        .dc2-container:hover .dc2-resize-handle { opacity: 1; }
    `;
    document.head.appendChild(s);
})();

// ── Constantes ────────────────────────────────────────────────────────────
const DC2_CONFIG = {
    volumeMultiplier: 3,
    baseThreshold: 60,
    sensitivityFactor: 0.55,
    timeAdjustUnit: 15,
    minTimeSeconds: 5,
    maxTimeSeconds: 3600,
    penColor: '#2d2a32',
    crayonStrokeShare: 85   // % de la durée consacré aux contours en mode Crayon
};

// ── Bibliothèque de dessins (viewBox 160 × 90, ordre = ordre de tracé) ───
const DC2_DRAWINGS = [
    {
        name: 'Montagne et lac',
        svg: `
        <rect x="2" y="2" width="156" height="86" rx="3" fill="#cfe8f7"/>
        <circle cx="128" cy="20" r="9" fill="#ffd23f"/>
        <path d="M60 14 q3 -3 6 0 q3 -3 6 0" fill="none"/>
        <path d="M44 20 q2.5 -2.5 5 0 q2.5 -2.5 5 0" fill="none"/>
        <path d="M2 62 L40 22 L62 44 L84 18 L120 58 L158 40 L158 66 L2 66 Z" fill="#8aa1b8"/>
        <path d="M33 29 L40 22 L47 29 L43.5 27 L40 31 L36.5 27 Z" fill="#ffffff"/>
        <path d="M77 25 L84 18 L91 26 L87.5 24 L84 28 L80.5 24 Z" fill="#ffffff"/>
        <path d="M2 66 L158 66 L158 85 Q158 88 155 88 L5 88 Q2 88 2 85 Z" fill="#5fa8d3"/>
        <path d="M20 73 L48 73" fill="none" stroke="#ffffff"/>
        <path d="M66 80 L104 80" fill="none" stroke="#ffffff"/>
        <path d="M124 74 L146 74" fill="none" stroke="#ffffff"/>
        <path d="M8 66 L15 49 L22 66 Z" fill="#2f7d4a"/>
        <path d="M19 66 L27 44 L35 66 Z" fill="#3b8f57"/>
        <path d="M94 70 L116 70 L112 75 L98 75 Z" fill="#c0533a"/>
        <path d="M105 70 L105 56" fill="none"/>
        <path d="M105.6 57 L105.6 68.5 L114 68.5 Z" fill="#ffffff"/>`
    },
    {
        name: 'Fusée dans l\'espace',
        svg: `
        <rect x="2" y="2" width="156" height="86" rx="3" fill="#1e2a4a"/>
        <path d="M0 -3.5 L1 -1 L3.6 -1 L1.6 0.7 L2.3 3.3 L0 1.8 L-2.3 3.3 L-1.6 0.7 L-3.6 -1 L-1 -1 Z" transform="translate(112 14)" fill="#fff7b0"/>
        <path d="M0 -3.5 L1 -1 L3.6 -1 L1.6 0.7 L2.3 3.3 L0 1.8 L-2.3 3.3 L-1.6 0.7 L-3.6 -1 L-1 -1 Z" transform="translate(140 40)" fill="#fff7b0"/>
        <path d="M0 -3.5 L1 -1 L3.6 -1 L1.6 0.7 L2.3 3.3 L0 1.8 L-2.3 3.3 L-1.6 0.7 L-3.6 -1 L-1 -1 Z" transform="translate(18 66)" fill="#fff7b0"/>
        <path d="M0 -3.5 L1 -1 L3.6 -1 L1.6 0.7 L2.3 3.3 L0 1.8 L-2.3 3.3 L-1.6 0.7 L-3.6 -1 L-1 -1 Z" transform="translate(60 12)" fill="#fff7b0"/>
        <circle cx="30" cy="26" r="12" fill="#e8a33d"/>
        <ellipse cx="30" cy="26" rx="21" ry="5" fill="none" stroke="#f6d38a"/>
        <circle cx="134" cy="70" r="11" fill="#d9d9d9"/>
        <circle cx="130" cy="66" r="2.5" fill="#bdbdbd"/>
        <circle cx="138" cy="74" r="2" fill="#bdbdbd"/>
        <g transform="rotate(30 85 52)">
            <path d="M85 20 C96 31 98 52 93 68 L77 68 C72 52 74 31 85 20 Z" fill="#f2f2f2"/>
            <path d="M85 20 C88.5 23 90.5 27 91.5 31 L78.5 31 C79.5 27 81.5 23 85 20 Z" fill="#e04b4b"/>
            <circle cx="85" cy="43" r="5" fill="#6ec1e4"/>
            <path d="M77.5 56 L68 72 L77.5 68 Z" fill="#e04b4b"/>
            <path d="M92.5 56 L102 72 L92.5 68 Z" fill="#e04b4b"/>
            <path d="M79 68 L85 84 L91 68 Z" fill="#ffb02e"/>
        </g>`
    },
    {
        name: 'Maison et arbre',
        svg: `
        <rect x="2" y="2" width="156" height="86" rx="3" fill="#d8f0ff"/>
        <circle cx="22" cy="18" r="8" fill="#ffd23f"/>
        <path d="M100 20 C100 14 108 12 111 16 C114 10 124 12 124 18 C130 18 130 26 124 26 L102 26 C96 26 96 20 100 20 Z" fill="#ffffff"/>
        <path d="M2 64 C40 56 110 56 158 62 L158 85 Q158 88 155 88 L5 88 Q2 88 2 85 Z" fill="#8cc96b"/>
        <rect x="80" y="26" width="7" height="12" fill="#a0503c"/>
        <path d="M83 22 C79 18 87 15 83 11 C79 7 86 5 84 2" fill="none"/>
        <rect x="46" y="40" width="44" height="30" fill="#f4d6a0"/>
        <path d="M40 41 L68 20 L96 41 Z" fill="#c0533a"/>
        <rect x="62" y="52" width="11" height="18" fill="#8a5a3b"/>
        <circle cx="70.5" cy="61.5" r="0.9" fill="#2d2a32"/>
        <rect x="50" y="46" width="9" height="9" fill="#bfe6ff"/>
        <path d="M54.5 46 L54.5 55 M50 50.5 L59 50.5" fill="none"/>
        <rect x="77" y="46" width="9" height="9" fill="#bfe6ff"/>
        <path d="M81.5 46 L81.5 55 M77 50.5 L86 50.5" fill="none"/>
        <rect x="124" y="50" width="6" height="20" fill="#8a5a3b"/>
        <circle cx="127" cy="40" r="13" fill="#3f9b4f"/>
        <circle cx="118" cy="47" r="8" fill="#48a85a"/>
        <circle cx="136" cy="47" r="8" fill="#48a85a"/>
        <circle cx="122" cy="36" r="1.8" fill="#e04b4b"/>
        <circle cx="132" cy="42" r="1.8" fill="#e04b4b"/>
        <path d="M14 78 L14 72 M24 80 L24 73 M34 79 L34 72" fill="none"/>
        <circle cx="14" cy="71" r="2.2" fill="#ff7aa8"/>
        <circle cx="24" cy="72" r="2.2" fill="#ffd23f"/>
        <circle cx="34" cy="71" r="2.2" fill="#b47aff"/>`
    },
    {
        name: 'Sous la mer',
        svg: `
        <rect x="2" y="2" width="156" height="86" rx="3" fill="#2a7fb8"/>
        <path d="M2 74 C40 68 90 78 158 70 L158 85 Q158 88 155 88 L5 88 Q2 88 2 85 Z" fill="#f0d9a0"/>
        <path d="M18 76 C12 64 24 58 18 44 C28 56 22 66 26 76 Z" fill="#3aa35a"/>
        <path d="M140 74 C134 62 146 56 140 40 C150 54 144 64 148 74 Z" fill="#2f9150"/>
        <path d="M128 76 C124 68 132 64 129 54 C136 62 132 70 134 76 Z" fill="#3aa35a"/>
        <ellipse cx="70" cy="40" rx="16" ry="9" fill="#ff8c42"/>
        <path d="M86 40 L98 31 L98 49 Z" fill="#ff8c42"/>
        <path d="M66 31.5 L72 26 L76 32 Z" fill="#f2702a"/>
        <circle cx="61" cy="38" r="2.2" fill="#ffffff"/>
        <circle cx="60.6" cy="38" r="1" fill="#2d2a32"/>
        <path d="M74 33 C77 37 77 43 74 47" fill="none"/>
        <ellipse cx="112" cy="22" rx="9" ry="5" fill="#ffe14d"/>
        <path d="M103 22 L96 17 L96 27 Z" fill="#ffe14d"/>
        <circle cx="116" cy="21" r="1.2" fill="#2d2a32"/>
        <circle cx="50" cy="26" r="2" fill="none" stroke="#dff3ff"/>
        <circle cx="46" cy="18" r="1.4" fill="none" stroke="#dff3ff"/>
        <circle cx="51" cy="11" r="2.4" fill="none" stroke="#dff3ff"/>
        <path d="M0 -6 L1.8 -1.9 L6 -1.9 L2.7 1 L3.9 5.5 L0 3 L-3.9 5.5 L-2.7 1 L-6 -1.9 L-1.8 -1.9 Z" transform="translate(66 76)" fill="#ff5a5f"/>
        <path d="M92 80 C92 73 102 73 102 80 Z" fill="#ffc0cb"/>`
    },
    {
        name: 'Montgolfière',
        svg: `
        <rect x="2" y="2" width="156" height="86" rx="3" fill="#ffe3c4"/>
        <path d="M20 26 C20 21 27 19 29 23 C32 18 40 20 39 26 Z" fill="#ffffff"/>
        <path d="M120 40 C120 35 127 33 129 37 C132 32 140 34 139 40 Z" fill="#ffffff"/>
        <path d="M2 74 C30 62 60 70 90 66 C120 62 140 70 158 66 L158 85 Q158 88 155 88 L5 88 Q2 88 2 85 Z" fill="#9bc96e"/>
        <path d="M80 10 C102 10 110 30 101 46 L89 60 L71 60 L59 46 C50 30 58 10 80 10 Z" fill="#e85d75"/>
        <path d="M80 10 C69 22 69 44 75 60 L85 60 C91 44 91 22 80 10 Z" fill="#ffd23f"/>
        <path d="M80 10 C77 24 77 44 80 60" fill="none"/>
        <path d="M71 60 L74 68 M89 60 L86 68" fill="none"/>
        <rect x="73" y="68" width="14" height="9" rx="1" fill="#a0703f"/>
        <path d="M73 72 L87 72" fill="none"/>
        <path d="M30 14 q2.5 -2.5 5 0 q2.5 -2.5 5 0" fill="none"/>`
    },
    {
        name: 'Château fort',
        svg: `
        <rect x="2" y="2" width="156" height="86" rx="3" fill="#cfe8f7"/>
        <path d="M66 16 C66 11 73 9 75 13 C78 8 86 10 85 16 Z" fill="#ffffff"/>
        <path d="M2 74 L158 74 L158 85 Q158 88 155 88 L5 88 Q2 88 2 85 Z" fill="#5fa8d3"/>
        <path d="M2 68 C40 64 120 64 158 68 L158 75 L2 75 Z" fill="#8cc96b"/>
        <rect x="50" y="42" width="60" height="28" fill="#cfc8bb"/>
        <path d="M50 42 L50 37 L56 37 L56 42 L62 42 L62 37 L68 37 L68 42 L74 42 L74 37 L80 37 L80 42 L86 42 L86 37 L92 37 L92 42 L98 42 L98 37 L104 37 L104 42 L110 42" fill="none"/>
        <rect x="32" y="28" width="18" height="42" fill="#b9b2a6"/>
        <path d="M30 28 L30 21 L34.5 21 L34.5 24 L39 24 L39 21 L43 21 L43 24 L47.5 24 L47.5 21 L52 21 L52 28 Z" fill="#b9b2a6"/>
        <rect x="110" y="28" width="18" height="42" fill="#b9b2a6"/>
        <path d="M108 28 L108 21 L112.5 21 L112.5 24 L117 24 L117 21 L121 21 L121 24 L125.5 24 L125.5 21 L130 21 L130 28 Z" fill="#b9b2a6"/>
        <path d="M38 44 L38 39 C38 35 44 35 44 39 L44 44 Z" fill="#2d2a32"/>
        <path d="M116 44 L116 39 C116 35 122 35 122 39 L122 44 Z" fill="#2d2a32"/>
        <path d="M71 70 L71 58 C71 50 89 50 89 58 L89 70 Z" fill="#6b4a2f"/>
        <path d="M75 53 L75 70 M80 51.5 L80 70 M85 53 L85 70 M71 60 L89 60 M71 65 L89 65" fill="none"/>
        <path d="M41 21 L41 9" fill="none"/>
        <path d="M41 9 L50 12 L41 15 Z" fill="#e04b4b"/>
        <path d="M119 21 L119 9" fill="none"/>
        <path d="M119 9 L128 12 L119 15 Z" fill="#3b82f6"/>
        <path d="M71 70 L66 80 L94 80 L89 70 Z" fill="#a0703f"/>`
    },
    {
        name: 'Phare au bord de mer',
        svg: `
        <rect x="2" y="2" width="156" height="86" rx="3" fill="#bfe3f5"/>
        <path d="M2 62 C30 58 60 64 90 60 C120 56 140 62 158 60 L158 85 Q158 88 155 88 L5 88 Q2 88 2 85 Z" fill="#3f8fc4"/>
        <path d="M60 80 C58 72 66 68 74 70 C80 64 94 66 98 72 C106 72 110 78 106 82 L62 82 Z" fill="#8a8a8a"/>
        <path d="M72 74 L76 30 L90 30 L94 74 Z" fill="#ffffff"/>
        <path d="M75.1 40 L90.9 40 L91.6 48 L74.4 48 Z" fill="#e04b4b"/>
        <path d="M73.5 58 L92.5 58 L93.3 66 L72.7 66 Z" fill="#e04b4b"/>
        <path d="M80 74 L80 68 C80 65 86 65 86 68 L86 74 Z" fill="#6b4a2f"/>
        <rect x="73" y="27" width="20" height="3" fill="#555555"/>
        <rect x="77" y="17" width="12" height="10" fill="#ffe680"/>
        <path d="M75 17 L83 9 L91 17 Z" fill="#e04b4b"/>
        <path d="M89 21 L132 12 L132 30 Z" fill="#fff3a0" fill-opacity="0.7"/>
        <path d="M77 21 L34 12 L34 30 Z" fill="#fff3a0" fill-opacity="0.7"/>
        <path d="M14 70 q4 -3 8 0 q4 -3 8 0" fill="none" stroke="#ffffff"/>
        <path d="M118 76 q4 -3 8 0 q4 -3 8 0" fill="none" stroke="#ffffff"/>
        <path d="M128 66 q4 -3 8 0" fill="none" stroke="#ffffff"/>
        <path d="M112 40 q3 -3 6 0 q3 -3 6 0" fill="none"/>
        <path d="M30 42 q2.5 -2.5 5 0 q2.5 -2.5 5 0" fill="none"/>`
    },
    {
        name: 'Bonhomme de neige',
        svg: `
        <rect x="2" y="2" width="156" height="86" rx="3" fill="#cfe3f2"/>
        <path d="M2 68 C40 60 120 60 158 66 L158 85 Q158 88 155 88 L5 88 Q2 88 2 85 Z" fill="#ffffff"/>
        <path d="M18 66 L28 40 L38 66 Z" fill="#2f7d4a"/>
        <path d="M22 54 L28 40 L34 54 L31 52 L28 55 L25 52 Z" fill="#ffffff"/>
        <path d="M128 64 L138 36 L148 64 Z" fill="#3b8f57"/>
        <path d="M132 50 L138 36 L144 50 L141 48 L138 51 L135 48 Z" fill="#ffffff"/>
        <circle cx="80" cy="66" r="16" fill="#ffffff"/>
        <circle cx="80" cy="44" r="12" fill="#ffffff"/>
        <circle cx="80" cy="27" r="9" fill="#ffffff"/>
        <path d="M68 44 L52 35 M56.5 37.5 L53 32" fill="none"/>
        <path d="M92 44 L108 35 M103.5 37.5 L107 32" fill="none"/>
        <path d="M70 35 C75 38.5 85 38.5 90 35 L90 38.5 C85 42 75 42 70 38.5 Z" fill="#e04b4b"/>
        <path d="M84 39 L88 50 L84 51 L81 40 Z" fill="#e04b4b"/>
        <rect x="70" y="17" width="20" height="2.5" fill="#2d2a32"/>
        <rect x="74" y="6" width="12" height="11" fill="#2d2a32"/>
        <rect x="74" y="13" width="12" height="2.5" fill="#3b82f6"/>
        <circle cx="76.5" cy="25" r="1.1" fill="#2d2a32"/>
        <circle cx="83.5" cy="25" r="1.1" fill="#2d2a32"/>
        <path d="M80 27.5 L89 29.5 L80 30.5 Z" fill="#ff8c1a"/>
        <path d="M76 32 C78 34 82 34 84 32" fill="none"/>
        <circle cx="80" cy="45" r="1.3" fill="#2d2a32"/>
        <circle cx="80" cy="51" r="1.3" fill="#2d2a32"/>
        <circle cx="80" cy="62" r="1.3" fill="#2d2a32"/>
        <circle cx="50" cy="14" r="1.3" fill="#ffffff"/>
        <circle cx="112" cy="20" r="1.3" fill="#ffffff"/>
        <circle cx="60" cy="56" r="1.3" fill="#ffffff"/>
        <circle cx="116" cy="50" r="1.3" fill="#ffffff"/>
        <circle cx="14" cy="24" r="1.3" fill="#ffffff"/>`
    },
    {
        name: 'Papillon et fleurs',
        svg: `
        <rect x="2" y="2" width="156" height="86" rx="3" fill="#dff2ff"/>
        <circle cx="142" cy="16" r="8" fill="#ffd23f"/>
        <path d="M2 70 C40 64 110 66 158 70 L158 85 Q158 88 155 88 L5 88 Q2 88 2 85 Z" fill="#8cc96b"/>
        <path d="M30 70 L30 52" fill="none"/>
        <path d="M30 62 C25 58 21 60 20 62 C24 64 27 64 30 62 Z" fill="#5bb04a"/>
        <circle cx="30" cy="44" r="4" fill="#ff7aa8"/>
        <circle cx="37" cy="48.5" r="4" fill="#ff7aa8"/>
        <circle cx="34" cy="56" r="4" fill="#ff7aa8"/>
        <circle cx="26" cy="56" r="4" fill="#ff7aa8"/>
        <circle cx="23" cy="48.5" r="4" fill="#ff7aa8"/>
        <circle cx="30" cy="50.5" r="3.5" fill="#ffd23f"/>
        <path d="M54 72 L54 58" fill="none"/>
        <circle cx="54" cy="51" r="3.5" fill="#b47aff"/>
        <circle cx="60" cy="55" r="3.5" fill="#b47aff"/>
        <circle cx="57" cy="61" r="3.5" fill="#b47aff"/>
        <circle cx="51" cy="61" r="3.5" fill="#b47aff"/>
        <circle cx="48" cy="55" r="3.5" fill="#b47aff"/>
        <circle cx="54" cy="56.5" r="3" fill="#ffffff"/>
        <path d="M130 72 L130 58" fill="none"/>
        <path d="M130 66 C135 62 139 64 140 66 C136 68 133 68 130 66 Z" fill="#5bb04a"/>
        <circle cx="130" cy="54" r="5.5" fill="#ffb02e"/>
        <circle cx="130" cy="54" r="2.5" fill="#c0533a"/>
        <path d="M40 30 C52 20 64 40 80 34" fill="none"/>
        <path d="M95 38 C85 20 68 22 72 35 C74 42 88 42 95 38 Z" fill="#b47aff"/>
        <path d="M95 38 C105 20 122 22 118 35 C116 42 102 42 95 38 Z" fill="#b47aff"/>
        <path d="M95 40 C86 42 77 52 85 55 C91 57 95 47 95 40 Z" fill="#ff7aa8"/>
        <path d="M95 40 C104 42 113 52 105 55 C99 57 95 47 95 40 Z" fill="#ff7aa8"/>
        <circle cx="82" cy="32" r="2.5" fill="#ffffff"/>
        <circle cx="108" cy="32" r="2.5" fill="#ffffff"/>
        <ellipse cx="95" cy="41" rx="1.8" ry="9" fill="#2d2a32"/>
        <path d="M94.5 33 C92.5 28 90.5 26.5 88 25.5 M95.5 33 C97.5 28 99.5 26.5 102 25.5" fill="none"/>`
    },
    {
        name: 'Île tropicale',
        svg: `
        <rect x="2" y="2" width="156" height="86" rx="3" fill="#bfe9f7"/>
        <circle cx="26" cy="20" r="9" fill="#ffd23f"/>
        <path d="M2 56 L158 56 L158 85 Q158 88 155 88 L5 88 Q2 88 2 85 Z" fill="#2fa3c7"/>
        <path d="M28 68 C44 52 106 52 124 68 Z" fill="#f2d58a"/>
        <path d="M70 64 C72 48 76 36 84 26 L87.5 28 C80 38 76.5 50 75.5 64 Z" fill="#a0703f"/>
        <path d="M85 26 C75 17 61 19 55 28 C66 24 76 25 85 26 Z" fill="#3aa35a"/>
        <path d="M85 26 C92 15 107 15 113 24 C103 21 94 23 85 26 Z" fill="#3aa35a"/>
        <path d="M85 26 C79 30 72 38 69 47 C76 39 81 33 85 26 Z" fill="#2f9150"/>
        <path d="M85 26 C94 28 103 36 105 45 C98 37 91 31 85 26 Z" fill="#2f9150"/>
        <circle cx="83" cy="30" r="2.3" fill="#6b4a2f"/>
        <circle cx="87.5" cy="30.5" r="2.3" fill="#6b4a2f"/>
        <path d="M128 50 L144 50 L141 54 L131 54 Z" fill="#c0533a"/>
        <path d="M136 50 L136 38" fill="none"/>
        <path d="M136.6 39 L136.6 48.5 L143 48.5 Z" fill="#ffffff"/>
        <path d="M10 74 q4 -3 8 0 q4 -3 8 0" fill="none" stroke="#ffffff"/>
        <path d="M128 78 q4 -3 8 0 q4 -3 8 0" fill="none" stroke="#ffffff"/>
        <path d="M62 82 q4 -3 8 0" fill="none" stroke="#ffffff"/>
        <path d="M100 66 C102 63 106 63 108 66 Z" fill="#ff5a5f"/>
        <path d="M60 14 q3 -3 6 0 q3 -3 6 0" fill="none"/>`
    }
];

// ── Création du widget ────────────────────────────────────────────────────
function createDeficalme2Widget() {
    snapshotNow();
    const pos = findFreePosition();
    const SVG_NS = 'http://www.w3.org/2000/svg';

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'deficalme2';
    widget.dataset.transparent = 'true';
    widget.style.cssText = `left:100px; top:${pos.y}px; overflow:visible; flex-direction:row;`;
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
        <div class="widget-ctx-menu"></div>
    `;

    // ── Container principal ───────────────────────────────────────────────
    const container = document.createElement('div');
    container.className = 'dc2-container';

    // ── Zone dessin ───────────────────────────────────────────────────────
    const imageZone = document.createElement('div');
    imageZone.className = 'dc2-image-zone';

    const drawSvg = document.createElementNS(SVG_NS, 'svg');
    drawSvg.setAttribute('class', 'dc2-svg');
    drawSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    const msgStart = document.createElement('div');
    msgStart.className = 'dc2-msg-start';
    msgStart.innerHTML = '🤫 Restez silencieux<br>pour faire apparaître le dessin…';

    const micBarWrap = document.createElement('div');
    micBarWrap.className = 'dc2-mic-bar-wrap';
    const micBarFill = document.createElement('div');
    micBarFill.className = 'dc2-mic-bar-fill';
    micBarWrap.appendChild(micBarFill);

    const progBarWrap = document.createElement('div');
    progBarWrap.className = 'dc2-prog-bar-wrap';
    const progBarFill = document.createElement('div');
    progBarFill.className = 'dc2-prog-bar-fill';
    progBarWrap.appendChild(progBarFill);

    const percentBadge = document.createElement('div');
    percentBadge.className = 'dc2-percent-badge';
    percentBadge.textContent = '0%';

    imageZone.appendChild(drawSvg);
    imageZone.appendChild(msgStart);
    imageZone.appendChild(micBarWrap);
    imageZone.appendChild(progBarWrap);
    imageZone.appendChild(percentBadge);
    container.appendChild(imageZone);

    // ── Panneau contrôles ─────────────────────────────────────────────────
    const controls = document.createElement('div');
    controls.className = 'dc2-controls';

    // Ligne 1 : Mode + Tolérance + Durée
    const row1 = document.createElement('div');
    row1.className = 'dc2-row';
    row1.style.justifyContent = 'space-between';

    const modeLabel = document.createElement('span');
    modeLabel.className = 'dc2-label';
    modeLabel.textContent = 'Mode';

    const modeWrap = document.createElement('div');
    modeWrap.className = 'dc2-mode-wrap';
    const modes = [
        { key: 'crayon',   label: 'Crayon',   title: 'Les contours se tracent, puis les couleurs arrivent' },
        { key: 'peinture', label: 'Peinture', title: 'Chaque forme est tracée puis coloriée' },
        { key: 'magie',    label: 'Magie',    title: 'Les formes apparaissent une par une' }
    ];
    const modeBtns = {};
    modes.forEach(m => {
        const btn = document.createElement('button');
        btn.className = 'dc2-mode-btn' + (m.key === 'crayon' ? ' active' : '');
        btn.textContent = m.label;
        btn.title = m.title;
        btn.dataset.mode = m.key;
        modeWrap.appendChild(btn);
        modeBtns[m.key] = btn;
    });

    function makePill(initial) {
        const pill = document.createElement('div');
        pill.className = 'dc2-time-pill';
        const minus = document.createElement('button');
        minus.className = 'dc2-time-btn';
        minus.textContent = '−';
        const val = document.createElement('span');
        val.className = 'dc2-time-val';
        val.textContent = initial;
        const plus = document.createElement('button');
        plus.className = 'dc2-time-btn';
        plus.textContent = '+';
        pill.appendChild(minus);
        pill.appendChild(val);
        pill.appendChild(plus);
        return { pill, minus, val, plus };
    }

    const sensLabel = document.createElement('span');
    sensLabel.className = 'dc2-label';
    sensLabel.textContent = 'Tolérance';
    const sens = makePill('40');

    const durLabel = document.createElement('span');
    durLabel.className = 'dc2-label';
    durLabel.textContent = 'Durée';
    const dur = makePill('10:00');

    const groupMode = document.createElement('div');
    groupMode.className = 'dc2-group';
    groupMode.style.flex = '1';
    groupMode.style.justifyContent = 'flex-start';
    groupMode.appendChild(modeLabel);
    groupMode.appendChild(modeWrap);

    const groupSens = document.createElement('div');
    groupSens.className = 'dc2-group';
    groupSens.style.flex = '1';
    groupSens.style.justifyContent = 'center';
    groupSens.appendChild(sensLabel);
    groupSens.appendChild(sens.pill);

    const groupDur = document.createElement('div');
    groupDur.className = 'dc2-group';
    groupDur.style.flex = '1';
    groupDur.style.justifyContent = 'flex-end';
    groupDur.appendChild(durLabel);
    groupDur.appendChild(dur.pill);

    row1.appendChild(groupMode);
    row1.appendChild(groupSens);
    row1.appendChild(groupDur);

    // Ligne 2 : Dessin (import SVG / URL / aléatoire / aperçu / transparence)
    const row3 = document.createElement('div');
    row3.className = 'dc2-row';

    const imgLabel = document.createElement('span');
    imgLabel.className = 'dc2-label';
    imgLabel.textContent = 'Dessin';

    const urlInput = document.createElement('input');
    urlInput.className = 'dc2-url-input';
    urlInput.type = 'text';

    const importFileInput = document.createElement('input');
    importFileInput.type = 'file';
    importFileInput.accept = '.svg,image/svg+xml';
    importFileInput.style.display = 'none';

    const btnImport = document.createElement('button');
    btnImport.className = 'dc2-url-btn';
    btnImport.style.background = '#059669';
    btnImport.textContent = '📁';
    btnImport.title = 'Importer un dessin SVG depuis votre appareil';

    const randBtn = document.createElement('button');
    randBtn.className = 'dc2-url-btn';
    randBtn.style.background = '#6366f1';
    randBtn.textContent = '🎲';
    randBtn.title = 'Autre dessin';

    const btnApercu = document.createElement('button');
    btnApercu.className = 'dc2-url-btn';
    btnApercu.style.background = '#6366f1';
    btnApercu.textContent = '👁';
    btnApercu.title = 'Aperçu';

    const btnTransp = document.createElement('button');
    btnTransp.className = 'dc2-url-btn';
    btnTransp.style.background = '#374151';
    btnTransp.title = 'Masquer/afficher le panneau de contrôle';
    btnTransp.textContent = '⬜';

    row3.appendChild(imgLabel);
    row3.appendChild(btnImport);
    row3.appendChild(importFileInput);
    row3.appendChild(urlInput);
    row3.appendChild(randBtn);
    row3.appendChild(btnApercu);
    row3.appendChild(btnTransp);

    // Boutons action flottants
    const btnRow = document.createElement('div');
    btnRow.className = 'dc2-action-row';

    const btnStart = document.createElement('button');
    btnStart.className = 'dc2-float-action-btn dc2-start';
    btnStart.textContent = '▶ Démarrer';

    const btnStop = document.createElement('button');
    btnStop.className = 'dc2-float-action-btn dc2-stop dc2-hidden';
    btnStop.textContent = '■ Stop';

    const btnReset = document.createElement('button');
    btnReset.className = 'dc2-float-action-btn dc2-new dc2-hidden';
    btnReset.textContent = '🔄 Nouveau défi';

    btnRow.appendChild(btnStart);
    btnRow.appendChild(btnStop);
    btnRow.appendChild(btnReset);
    imageZone.appendChild(btnRow);

    controls.appendChild(row1);
    controls.appendChild(row3);

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'dc2-resize-handle';

    container.appendChild(controls);
    container.appendChild(resizeHandle);
    widget.appendChild(container);

    // ═════════════════════════════════════════════════════════════════════
    // LOGIQUE INTERNE
    // ═════════════════════════════════════════════════════════════════════

    let isPlaying = false;
    let progress = 0;
    let lastTime = 0;
    let currentMode = 'crayon';
    let totalSeconds = 600;
    let sensValue = 40;
    let apercuActive = false;
    let drawingIndex = Math.floor(Math.random() * DC2_DRAWINGS.length);

    // Éléments du dessin courant
    let items = [];        // { el, wrap, len, start, w, wStart, fo, cx, cy }
    let totalLen = 0;
    let totalW = 0;
    let penMarker = null;

    let audioContext = null;
    let analyser = null;
    let audioStream = null;

    const clamp01 = v => Math.max(0, Math.min(1, v));

    // ── Temps / tolérance ────────────────────────────────────────────────
    function formatTime(s) {
        return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
    }
    function adjustTime(delta) {
        totalSeconds = Math.max(DC2_CONFIG.minTimeSeconds, Math.min(DC2_CONFIG.maxTimeSeconds, totalSeconds + delta * DC2_CONFIG.timeAdjustUnit));
        dur.val.textContent = formatTime(totalSeconds);
    }
    function adjustSens(delta) {
        sensValue = Math.max(1, Math.min(100, sensValue + delta));
        sens.val.textContent = sensValue;
    }

    // ── Chargement d'un dessin ───────────────────────────────────────────
    function sanitizeSvg(root) {
        root.querySelectorAll('script, style, foreignObject, image, use[href^="http"]').forEach(n => n.remove());
        root.querySelectorAll('*').forEach(n => {
            [...n.attributes].forEach(a => {
                if (/^on/i.test(a.name)) n.removeAttribute(a.name);
                if (/href$/i.test(a.name) && /^\s*javascript:/i.test(a.value)) n.removeAttribute(a.name);
            });
        });
    }

    // content : élément <svg> source (ses enfants sont copiés), viewBox : "x y w h"
    function buildDrawing(sourceSvg, viewBox) {
        drawSvg.innerHTML = '';
        drawSvg.setAttribute('viewBox', viewBox);
        const vb = viewBox.split(/[\s,]+/).map(Number);
        const penW = Math.max(vb[2], vb[3]) / 180;

        const g = document.createElementNS(SVG_NS, 'g');
        g.setAttribute('stroke-linecap', 'round');
        g.setAttribute('stroke-linejoin', 'round');
        [...sourceSvg.childNodes].forEach(n => g.appendChild(document.importNode(n, true)));
        drawSvg.appendChild(g);

        // Pointe du crayon
        penMarker = document.createElementNS(SVG_NS, 'circle');
        penMarker.setAttribute('class', 'dc2-pen');
        penMarker.setAttribute('r', penW * 2.2);
        penMarker.setAttribute('fill', DC2_CONFIG.penColor);
        penMarker.setAttribute('stroke', '#ffffff');
        penMarker.setAttribute('stroke-width', penW * 0.8);
        penMarker.style.opacity = '0';
        drawSvg.appendChild(penMarker);

        const nodes = [...g.querySelectorAll('path, circle, ellipse, rect, line, polyline, polygon')]
            .filter(el => !el.closest('defs, clipPath, mask, pattern, symbol, marker'));

        items = [];
        nodes.forEach(el => {
            const cs = getComputedStyle(el);
            if (cs.stroke === 'none' || !cs.stroke) {
                el.style.stroke = DC2_CONFIG.penColor;
                el.style.strokeWidth = penW;
            }
            const fo = parseFloat(cs.fillOpacity);

            let len = 0;
            try { len = el.getTotalLength(); } catch (e) { len = 0; }
            if (!len || !isFinite(len)) {
                try { const b = el.getBBox(); len = 2 * (b.width + b.height); } catch (e) { len = 1; }
            }
            len = Math.max(len, 0.5);

            // Groupe enveloppe (pour le mode Magie : zoom autour du centre)
            const wrap = document.createElementNS(SVG_NS, 'g');
            el.parentNode.insertBefore(wrap, el);
            wrap.appendChild(el);
            let cx = 0, cy = 0;
            try { const b = wrap.getBBox(); cx = b.x + b.width / 2; cy = b.y + b.height / 2; } catch (e) {}

            items.push({ el, wrap, len, fo: isFinite(fo) ? fo : 1, cx, cy });
        });

        // Positions cumulées
        totalLen = 0;
        items.forEach(it => { it.start = totalLen; totalLen += it.len; });
        const avg = items.length ? totalLen / items.length : 1;
        totalW = 0;
        items.forEach(it => { it.w = Math.max(it.len, avg * 0.35); it.wStart = totalW; totalW += it.w; });

        updateUI();
    }

    function loadBuiltin(index) {
        drawingIndex = index;
        const d = DC2_DRAWINGS[index];
        const tmp = new DOMParser().parseFromString(
            `<svg xmlns="${SVG_NS}" viewBox="0 0 160 90">${d.svg}</svg>`, 'image/svg+xml');
        buildDrawing(tmp.documentElement, '0 0 160 90');
        urlInput.value = '';
        urlInput.placeholder = d.name + ' (ou URL d\'un dessin SVG…)';
    }

    function loadSvgText(text, label) {
        const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
        const root = doc.documentElement;
        if (!root || root.nodeName.toLowerCase() !== 'svg' || doc.querySelector('parsererror')) {
            alert('Ce fichier n\'est pas un dessin SVG lisible. Choisissez un fichier .svg.');
            return false;
        }
        sanitizeSvg(root);
        let vb = root.getAttribute('viewBox');
        if (!vb) {
            const w = parseFloat(root.getAttribute('width')) || 160;
            const h = parseFloat(root.getAttribute('height')) || 90;
            vb = `0 0 ${w} ${h}`;
        }
        buildDrawing(root, vb);
        urlInput.value = label || '';
        return true;
    }

    async function loadFromUrl(url) {
        url = url.trim();
        if (!url) return;
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(res.status);
            const text = await res.text();
            if (loadSvgText(text, url)) resetDefi();
        } catch (e) {
            alert('Impossible de charger ce dessin. Vérifiez que l\'adresse mène à un fichier .svg accessible, ou importez-le avec 📁.');
        }
    }

    // ── Rendu progressif ─────────────────────────────────────────────────
    function setStroke(it, f) {
        const el = it.el;
        if (f >= 1) {
            el.style.strokeDasharray = 'none';
            el.style.strokeDashoffset = '0';
            el.style.strokeOpacity = '';
        } else if (f <= 0) {
            el.style.strokeOpacity = '0';
        } else {
            el.style.strokeOpacity = '';
            el.style.strokeDasharray = `${it.len} ${it.len + 1}`;
            el.style.strokeDashoffset = String(it.len * (1 - f));
        }
    }
    function setFill(it, f) {
        it.el.style.fillOpacity = String(f * it.fo);
    }
    function setWrap(it, f) {
        if (f >= 1) {
            it.wrap.removeAttribute('transform');
            it.wrap.style.opacity = '';
            return;
        }
        // léger rebond à l'apparition
        const s = 0.4 + 0.6 * (1 - Math.pow(1 - f, 3)) + Math.sin(f * Math.PI) * 0.08;
        it.wrap.setAttribute('transform', `translate(${it.cx} ${it.cy}) scale(${s}) translate(${-it.cx} ${-it.cy})`);
        it.wrap.style.opacity = String(f);
    }

    function placePen(it, f) {
        if (!penMarker) return;
        if (!it || !isPlaying || f <= 0 || f >= 1) { penMarker.style.opacity = '0'; return; }
        try {
            const p = it.el.getPointAtLength(it.len * f);
            const m = drawSvg.getScreenCTM().inverse().multiply(it.el.getScreenCTM());
            const pt = drawSvg.createSVGPoint();
            pt.x = p.x; pt.y = p.y;
            const q = pt.matrixTransform(m);
            penMarker.setAttribute('cx', q.x);
            penMarker.setAttribute('cy', q.y);
            penMarker.style.opacity = '1';
        } catch (e) {
            penMarker.style.opacity = '0';
        }
    }

    function renderDrawing(prog) {
        const N = items.length;
        if (!N) return;
        let penItem = null, penF = 0;

        if (currentMode === 'crayon') {
            const share = DC2_CONFIG.crayonStrokeShare;
            const target = clamp01(prog / share) * totalLen;
            const fp = clamp01((prog - share) / (100 - share)) * N;
            items.forEach((it, i) => {
                const f = clamp01((target - it.start) / it.len);
                setWrap(it, 1);
                setStroke(it, f);
                setFill(it, clamp01(fp - i));
                if (f > 0 && f < 1) { penItem = it; penF = f; }
            });
        } else if (currentMode === 'peinture') {
            const target = (prog / 100) * totalW;
            items.forEach(it => {
                const local = clamp01((target - it.wStart) / it.w);
                const fs = clamp01(local / 0.7);
                setWrap(it, 1);
                setStroke(it, fs);
                setFill(it, clamp01((local - 0.6) / 0.4));
                if (fs > 0 && fs < 1) { penItem = it; penF = fs; }
            });
        } else { // magie
            const slot = (prog / 100) * N;
            items.forEach((it, i) => {
                const f = clamp01(slot - i);
                setStroke(it, 1);
                setFill(it, 1);
                setWrap(it, f);
            });
        }
        placePen(penItem, penF);
    }

    // ── Visualisation ─────────────────────────────────────────────────────
    function currentThreshold() {
        return DC2_CONFIG.baseThreshold - (sensValue * DC2_CONFIG.sensitivityFactor);
    }
    function updateMicBar(vol) {
        micBarFill.style.width = Math.min(vol * DC2_CONFIG.volumeMultiplier, 100) + '%';
        micBarFill.style.background = vol < currentThreshold() ? '#22c55e' : '#ef4444';
    }
    function updateProgress(prog) {
        const pStr = Math.floor(prog) + '%';
        percentBadge.textContent = pStr;
        progBarFill.style.height = pStr;
    }
    function updateUI() {
        updateProgress(progress);
        renderDrawing(apercuActive ? 100 : progress);
    }

    // ── Audio ─────────────────────────────────────────────────────────────
    async function initAudio() {
        if (audioContext) return true;
        try {
            audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 1024;
            audioContext.createMediaStreamSource(audioStream).connect(analyser);
            return true;
        } catch (err) {
            alert('🎤 Micro non accessible. Vérifiez les permissions.');
            return false;
        }
    }
    function getVolume() {
        if (!analyser) return 0;
        const arr = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(arr);
        return arr.reduce((a, b) => a + b) / arr.length;
    }
    function stopAudio() {
        if (audioStream) { audioStream.getTracks().forEach(t => t.stop()); audioStream = null; }
        if (audioContext) { audioContext.close(); audioContext = null; }
        analyser = null;
    }

    // ── Jeu ───────────────────────────────────────────────────────────────
    let rafId = null;

    function gameLoop(now) {
        if (!isPlaying) return;
        const delta = (now - lastTime) / 1000;
        lastTime = now;

        const vol = getVolume();
        updateMicBar(vol);

        const speed = 100 / totalSeconds;
        if (vol < currentThreshold()) {
            progress = Math.min(100, progress + speed * delta);
        } else {
            progress = Math.max(0, progress - speed * delta * 2);
        }
        updateUI();

        if (progress >= 100) {
            isPlaying = false;
            rafId = null;
            if (penMarker) penMarker.style.opacity = '0';
            btnStart.classList.add('dc2-hidden');
            btnStop.classList.add('dc2-hidden');
            btnReset.classList.remove('dc2-hidden');
            return;
        }
        rafId = requestAnimationFrame(gameLoop);
    }

    async function toggleStart() {
        if (!isPlaying) {
            const ok = await initAudio();
            if (!ok) return;
            isPlaying = true;
            lastTime = performance.now();
            msgStart.style.display = 'none';
            rafId = requestAnimationFrame(gameLoop);
            btnStart.textContent = '⏸ Pause';
            btnStart.classList.remove('dc2-start');
            btnStop.classList.remove('dc2-hidden');
        } else {
            isPlaying = false;
            if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
            if (penMarker) penMarker.style.opacity = '0';
            btnStart.textContent = '▶ Reprendre';
            btnStart.classList.add('dc2-start');
        }
    }

    function stopDefi() {
        isPlaying = false;
        progress = 0;
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        stopAudio();
        micBarFill.style.width = '0%';
        updateUI();
        btnStart.textContent = '▶ Démarrer';
        btnStart.classList.add('dc2-hidden', 'dc2-start');
        btnStop.classList.add('dc2-hidden');
        btnReset.classList.remove('dc2-hidden');
        msgStart.style.display = 'flex';
    }

    function resetDefi() {
        isPlaying = false;
        progress = 0;
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        stopAudio();
        micBarFill.style.width = '0%';
        if (apercuActive) setApercu(false);
        updateUI();
        btnStart.textContent = '▶ Démarrer';
        btnStart.classList.add('dc2-start');
        btnStart.classList.remove('dc2-hidden');
        btnStop.classList.add('dc2-hidden');
        btnReset.classList.add('dc2-hidden');
        msgStart.style.display = 'flex';
    }

    // ── Mode ──────────────────────────────────────────────────────────────
    function setMode(mode) {
        currentMode = mode;
        Object.values(modeBtns).forEach(b => b.classList.remove('active'));
        modeBtns[mode].classList.add('active');
        updateUI();
    }

    // ── Aperçu ────────────────────────────────────────────────────────────
    function setApercu(on) {
        apercuActive = on;
        btnApercu.textContent = on ? '🙈' : '👁';
        btnApercu.title = on ? 'Cacher l\'aperçu' : 'Aperçu';
        btnApercu.style.background = on ? '#ef4444' : '#6366f1';
        msgStart.style.visibility = on ? 'hidden' : '';
        updateUI();
    }
    btnApercu.addEventListener('click', () => setApercu(!apercuActive));

    // ── Resize ────────────────────────────────────────────────────────────
    resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const startX = e.clientX;
        const startW = container.offsetWidth;
        document.onmousemove = (ev) => {
            const newW = Math.max(320, startW + ev.clientX - startX);
            container.style.width = newW + 'px';
            widget.dataset.widthPercent = (newW / window.innerWidth) * 100;
        };
        document.onmouseup = () => { document.onmousemove = null; saveBoard(); };
    });
    resizeHandle.addEventListener('touchstart', (e) => {
        e.preventDefault(); e.stopPropagation();
        const startX = e.touches[0].clientX;
        const startW = container.offsetWidth;
        function onMove(ev) {
            const newW = Math.max(320, startW + ev.touches[0].clientX - startX);
            container.style.width = newW + 'px';
            widget.dataset.widthPercent = (newW / window.innerWidth) * 100;
        }
        function onEnd() {
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onEnd);
            saveBoard();
        }
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onEnd);
    }, { passive: false });

    // ── Fond transparent / masquer les contrôles ──────────────────────────
    let isTransparent = false;
    btnTransp.addEventListener('click', () => {
        isTransparent = !isTransparent;
        controls.style.display = isTransparent ? 'none' : 'flex';
        container.style.background = isTransparent ? 'transparent' : '';
        container.style.boxShadow = isTransparent ? 'none' : '';
        widget.dataset.transparent = isTransparent ? 'true' : 'false';
        floatBtn.style.display = isTransparent ? 'block' : 'none';
        btnTransp.textContent = isTransparent ? '🔲' : '⬜';
        btnTransp.title = isTransparent ? 'Afficher les contrôles' : 'Fond transparent';
        btnTransp.style.background = isTransparent ? '#ef4444' : '#374151';
        saveBoard();
    });

    const floatBtn = document.createElement('button');
    const styleNormal = `
        display: block; position: absolute; bottom: 8px; right: 15px; z-index: 15;
        background: rgba(0,0,0,0.0); border: 1px solid rgba(0,0,0,0.2);
        color: rgba(0,0,0,0.5); font-size: 8px; font-weight: 800; padding: 4px 8px;
        border-radius: 6px; cursor: pointer;
        text-transform: uppercase; letter-spacing: 0.05em; transition: all 0.2s;
    `;
    const styleHover = `
        display: block; position: absolute; bottom: 8px; right: 15px; z-index: 15;
        background: rgba(0,0,0,0.8); border: 1px solid rgba(255,255,255,0.8);
        color: rgba(255,255,255,0.85); font-size: 8px; font-weight: 800; padding: 4px 8px;
        border-radius: 6px; cursor: pointer;
        text-transform: uppercase; letter-spacing: 0.05em; transition: all 0.2s;
    `;
    floatBtn.style.cssText = styleNormal;
    floatBtn.onmouseover = () => { floatBtn.style.cssText = styleHover; };
    floatBtn.onmouseout = () => { floatBtn.style.cssText = styleNormal; };
    floatBtn.textContent = '🔲 Contrôles';
    floatBtn.addEventListener('click', () => btnTransp.click());
    imageZone.appendChild(floatBtn);

    // ── Boutons de jeu ────────────────────────────────────────────────────
    btnStart.addEventListener('click', () => {
        if (apercuActive) setApercu(false);
        toggleStart();
    });
    btnStop.addEventListener('click', stopDefi);
    btnReset.addEventListener('click', resetDefi);

    Object.values(modeBtns).forEach(btn => {
        btn.addEventListener('click', () => setMode(btn.dataset.mode));
    });

    // Appui long sur + / − (souris et tactile)
    function bindRepeat(btn, fn) {
        btn.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            fn();
            const iv = setInterval(fn, 120);
            window.addEventListener('mouseup', () => clearInterval(iv), { once: true });
        });
        btn.addEventListener('touchstart', (e) => {
            e.stopPropagation();
            fn();
            const iv = setInterval(fn, 120);
            window.addEventListener('touchend', () => clearInterval(iv), { once: true });
        }, { passive: true });
    }
    bindRepeat(dur.minus, () => adjustTime(-1));
    bindRepeat(dur.plus, () => adjustTime(1));
    bindRepeat(sens.minus, () => adjustSens(-1));
    bindRepeat(sens.plus, () => adjustSens(1));

    // ── Choix du dessin ───────────────────────────────────────────────────
    urlInput.addEventListener('mousedown', (e) => e.stopPropagation());
    urlInput.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter') loadFromUrl(urlInput.value);
    });
    randBtn.addEventListener('click', () => {
        let next = drawingIndex;
        if (DC2_DRAWINGS.length > 1) {
            while (next === drawingIndex) next = Math.floor(Math.random() * DC2_DRAWINGS.length);
        }
        loadBuiltin(next);
        resetDefi();
    });
    btnImport.addEventListener('click', (e) => {
        e.stopPropagation();
        importFileInput.click();
    });
    importFileInput.addEventListener('change', () => {
        const file = importFileInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            if (loadSvgText(String(reader.result), file.name)) resetDefi();
        };
        reader.readAsText(file);
        importFileInput.value = '';
    });

    widget.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
        bringToFront(widget);
        widget.focus();
        if (typeof positionActionBar === 'function') positionActionBar(widget);
    });

    // Nettoyage à la suppression du widget
    const observer = new MutationObserver(() => {
        if (!widget.isConnected) {
            isPlaying = false;
            if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
            stopAudio();
            observer.disconnect();
        }
    });

    // ── Init ──────────────────────────────────────────────────────────────
    board.appendChild(widget);
    observer.observe(widget.parentNode || document.body, { childList: true });
    if (typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);
    bringToFront(widget);
    makeDraggable(widget);
    makeDraggableRotate(widget);

    // Le dessin est construit une fois le widget dans la page (mesure des tracés)
    loadBuiltin(drawingIndex);
    saveBoard();
    return widget;
}
