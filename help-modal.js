// =========================================================================
// MODALE D'AIDE — Le Bureau du Prof
// =========================================================================

(function () {
  const html = `
<div id="help-modal-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.72);z-index:20010;justify-content:center;align-items:center;padding:20px;">
<div style="background:#fff;border-radius:18px;width:100%;max-width:900px;max-height:92vh;display:flex;flex-direction:column;box-shadow:0 24px 80px rgba(0,0,0,0.5);overflow:hidden;">

  <!-- EN-TÊTE -->
  <div style="background:linear-gradient(135deg,#2B7FFF 0%,#8E51FF 100%);color:white;padding:22px 28px;display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-shrink:0;">
    <div>
      <div style="font-size:1.4em;font-weight:800;">📋 Aide complète — Le Bureau du Prof</div>
      <div style="font-size:0.85em;opacity:0.85;margin-top:4px;">Cliquez sur une section dans le menu à gauche pour naviguer.</div>
    </div>
    <button onclick="closeHelpModal()" style="background:rgba(255,255,255,0.2);border:none;border-radius:50%;width:36px;height:36px;color:white;font-size:20px;cursor:pointer;flex-shrink:0;">×</button>
  </div>

  <!-- CORPS -->
  <div style="display:flex;flex:1;overflow:hidden;">

    <!-- SIDEBAR -->
    <nav id="help-sidebar" style="width:220px;flex-shrink:0;background:#f4f6f9;border-right:1px solid #e5e8ee;overflow-y:auto;padding:14px 0;">
      <div style="padding:4px 16px 6px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#999;">Vue d'ensemble</div>
      <div class="help-nav" data-s="h-intro"         onclick="helpShow(this)" style="border-left-color:#2B7FFF;background:#e8edf5;color:#2B7FFF;font-weight:700;">🏠 Introduction</div>
      <div class="help-nav" data-s="h-explorer"       onclick="helpShow(this)">🗺️ Explorer le bureau</div>
      <div class="help-nav" data-s="h-activites"      onclick="helpShow(this)">🎲 Activités</div>
      <div class="help-nav" data-s="h-outils"         onclick="helpShow(this)">🧰 Outils</div>
      <div class="help-nav" data-s="h-widgets-panel"  onclick="helpShow(this)">📦 Widgets</div>
      <div class="help-nav" data-s="h-images"         onclick="helpShow(this)">🖼️ Images</div>
      <div class="help-nav" data-s="h-stickers"       onclick="helpShow(this)">🤓 Stickers</div>
      <div class="help-nav" data-s="h-pdf-lib"        onclick="helpShow(this)">📋 Bibliothèque PDF</div>
      <div class="help-nav" data-s="h-ecran"          onclick="helpShow(this)">🖥️ Écran</div>
      <div class="help-nav" data-s="h-controles"      onclick="helpShow(this)">🎛️ Contrôles des widgets</div>
      <div class="help-nav" data-s="h-presentation"   onclick="helpShow(this)">📽️ Mode présentation</div>
      <div style="height:1px;background:#e0e4ea;margin:8px 18px;"></div>
      <div style="padding:4px 16px 6px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#999;">Annotation</div>
      <div class="help-nav" data-s="h-texte"        onclick="helpShow(this)">🖊️ Texte &amp; Format</div>
      <div class="help-nav" data-s="h-dessin"       onclick="helpShow(this)">✏️ Barre de dessin</div>
      <div style="height:1px;background:#e0e4ea;margin:8px 18px;"></div>
      <div style="padding:4px 16px 6px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#999;">Système</div>
      <div class="help-nav" data-s="h-projets"      onclick="helpShow(this)">📁 Projets</div>
      <div class="help-nav" data-s="h-scenes"       onclick="helpShow(this)">🗂️ Tableaux (scènes)</div>
      <div class="help-nav" data-s="h-sauvegarde"   onclick="helpShow(this)">💾 Sauvegarde</div>
      <div style="height:1px;background:#e0e4ea;margin:8px 18px;"></div>
      <div class="help-nav" data-s="h-apropos"      onclick="helpShow(this)">ℹ️ À propos</div>
    </nav>

    <!-- CONTENU -->
    <div style="flex:1;overflow-y:auto;padding:28px 32px;">

      <!-- INTRODUCTION -->
      <div id="h-intro" class="help-section" style="display:block;">
        <div style="font-size:1.4em;font-weight:800;color:#1a1a2e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e8ee;">🏠 Bienvenue sur Le Bureau du Prof</div>
        <p style="font-size:16px;color:#444;line-height:1.65;margin-bottom:10px;">Le Bureau du Prof est un <strong>tableau de bord interactif</strong> conçu pour les enseignants.<br>Il permet d'afficher simultanément des widgets (heure, date, devoirs, météo…), des activités (la monnaie, le calcul mental, la conjugaison, l'écriture seyes...) ou des outils (le plan de la classe, le tirage au sort, la création d'équipes équilibrées...).<br>Le Bureau du Prof permet aussi de dessiner librement, d'annoter des PDF, d'organiser son travail en projets et tableaux, et de tout sauvegarder.<br>Il est particulièrement utile pour les enseignants qui utilisent un <strong>TBI</strong> ou un <strong>VPI</strong> au quotidien.</p>
        <p style="font-size:16px;color:#444;line-height:1.65;margin-bottom:16px;">Le tableau respecte un <strong>format 16:9</strong> et s'adapte automatiquement à la taille de votre écran ou vidéoprojecteur.</p>
        <img src="pics/le-bureau-du-prof5.jpeg" alt="Aperçu du Bureau du Prof" style="width:80%;border-radius:10px;box-shadow:0 4px 18px rgba(0,0,0,0.13);display:block; margin: 0 auto;">
      </div>

      <!-- EXPLORER LE BUREAU -->
      <div id="h-explorer" class="help-section">
        <div style="font-size:1.15em;font-weight:800;color:#1a1a2e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e8ee;">🗺️ Explorer le bureau</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:18px;">Il existe deux façons d'accéder aux fonctions du bureau, complémentaires et toujours visibles.</p>

        <!-- FAB -->
        <div style="display:flex;align-items:flex-start;gap:14px;background:#f8f9fb;border:1px solid #e5e8ee;border-radius:12px;padding:16px 18px;margin-bottom:14px;">
          <div style="font-size:2em;flex-shrink:0;line-height:1;">＋</div>
          <div>
            <div style="font-size:0.97em;font-weight:700;color:#1a1a2e;margin-bottom:5px;">Le bouton menu (bas à gauche)</div>
            <p style="font-size:13px;color:#444;line-height:1.6;margin:0;">Ouvre un menu organisé en trois rubriques : <strong>Contenu</strong> (widgets et outils pédagogiques), <strong>Annotation</strong> (dessin, formes, stickers…) et <strong>Système</strong> (fichiers, affichage, aide). Les entrées avec <strong>›</strong> ouvrent un sous-menu au survol.</p>
          </div>
        </div>

        <!-- ONGLETS -->
        <div style="display:flex;align-items:flex-start;gap:14px;background:#f8f9fb;border:1px solid #e5e8ee;border-radius:12px;padding:16px 18px;margin-bottom:18px;">
          <div style="font-size:2em;flex-shrink:0;line-height:1;">◀</div>
          <div>
            <div style="font-size:0.97em;font-weight:700;color:#1a1a2e;margin-bottom:5px;">Les onglets latéraux (bord gauche du bureau)</div>
            <p style="font-size:13px;color:#444;line-height:1.6;margin:0 0 10px 0;">8 onglets sont ancrés sur le côté gauche. Cliquer sur l'un d'eux ouvre un <strong>panneau coulissant</strong> depuis la gauche. Cliquer à nouveau (ou sur le bureau) le referme.</p>
            <table style="width:100%;border-collapse:collapse;font-size:12.5px;">
              <tr><th style="background:#f0f3f9;text-align:left;padding:6px 10px;font-weight:700;border-bottom:2px solid #dde2ea;">Onglet</th><th style="background:#f0f3f9;text-align:left;padding:6px 10px;font-weight:700;border-bottom:2px solid #dde2ea;">Ce qu'il contient</th></tr>
              <tr><td style="padding:6px 10px;border-bottom:1px solid #eef0f3;">🎲 <strong>Activités</strong></td><td style="padding:6px 10px;border-bottom:1px solid #eef0f3;color:#444;">Tirage au sort, calcul mental, ordre alphabétique, défi calme…</td></tr>
              <tr><td style="padding:6px 10px;border-bottom:1px solid #eef0f3;">🧰 <strong>Outils</strong></td><td style="padding:6px 10px;border-bottom:1px solid #eef0f3;color:#444;">Minuteur, chrono, sonomètre, radar de bruit, monnaie, OutilsProfs</td></tr>
              <tr><td style="padding:6px 10px;border-bottom:1px solid #eef0f3;">📦 <strong>Widgets</strong></td><td style="padding:6px 10px;border-bottom:1px solid #eef0f3;color:#444;">Heure, date, météo, devoirs, planning, texte</td></tr>
              <tr><td style="padding:6px 10px;border-bottom:1px solid #eef0f3;">🤓 <strong>Stickers</strong></td><td style="padding:6px 10px;border-bottom:1px solid #eef0f3;color:#444;">Emojis déposables sur le bureau</td></tr>
              <tr><td style="padding:6px 10px;border-bottom:1px solid #eef0f3;">🖼️ <strong>Images</strong></td><td style="padding:6px 10px;border-bottom:1px solid #eef0f3;color:#444;">Importer une image locale ou coller depuis le presse-papier</td></tr>
              <tr><td style="padding:6px 10px;border-bottom:1px solid #eef0f3;">📋 <strong>PDF</strong></td><td style="padding:6px 10px;border-bottom:1px solid #eef0f3;color:#444;">Bibliothèque de vos fichiers PDF chargés</td></tr>
              <tr><td style="padding:6px 10px;border-bottom:1px solid #eef0f3;">📁 <strong>Projets</strong></td><td style="padding:6px 10px;border-bottom:1px solid #eef0f3;color:#444;">Accès rapide à vos projets et tableaux</td></tr>
              <tr><td style="padding:6px 10px;">📽️ <strong>Présentation</strong></td><td style="padding:6px 10px;color:#444;">Active / quitte le mode présentation (interface masquée)</td></tr>
            </table>
          </div>
        </div>

        <div style="background:#eef7ff;border-left:4px solid #2B7FFF;border-radius:0 8px 8px 0;padding:10px 14px;font-size:12.5px;color:#1a4d8f;">💡 Les deux accès sont équivalents — utilisez les onglets pour un accès rapide d'un clic, le bouton <strong>＋</strong> pour naviguer entre toutes les catégories.</div>
      </div>

      <!-- ACTIVITÉS -->
      <div id="h-activites" class="help-section">
        <div style="font-size:1.15em;font-weight:800;color:#1a1a2e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e8ee;">🎲 Activités</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:16px;">Les activités sont accessibles via l'onglet <strong>🎲 Activités</strong> sur le bord gauche du bureau. Chaque activité s'ouvre comme un widget sur le bureau et possède son propre <strong>bouton d'aide ❓</strong> pour en détailler le fonctionnement.</p>

        <div style="font-size:0.9em;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">🔢 Mathématiques</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;">
          <div style="background:#f8f9fb;border:1px solid #e5e8ee;border-radius:8px;padding:10px 12px;"><div style="font-weight:700;font-size:13px;color:#222;">💶 Monnaie</div><div style="font-size:12px;color:#666;margin-top:2px;">Calculer avec les pièces et les billets</div></div>
          <div style="background:#f8f9fb;border:1px solid #e5e8ee;border-radius:8px;padding:10px 12px;"><div style="font-weight:700;font-size:13px;color:#222;">🔟 Tableau de numération</div><div style="font-size:12px;color:#666;margin-top:2px;">Manipuler le tableau de numération décimale</div></div>
          <div style="background:#f8f9fb;border:1px solid #e5e8ee;border-radius:8px;padding:10px 12px;"><div style="font-weight:700;font-size:13px;color:#222;">🧮 Calcul mental</div><div style="font-size:12px;color:#666;margin-top:2px;">S'entraîner au calcul mental</div></div>
          <div style="background:#f8f9fb;border:1px solid #e5e8ee;border-radius:8px;padding:10px 12px;"><div style="font-weight:700;font-size:13px;color:#222;">🔢 Le compte est bon</div><div style="font-size:12px;color:#666;margin-top:2px;">Viser un nombre cible avec les opérations</div></div>
          <div style="background:#f8f9fb;border:1px solid #e5e8ee;border-radius:8px;padding:10px 12px;"><div style="font-weight:700;font-size:13px;color:#222;">🕐 Heures et durées</div><div style="font-size:12px;color:#666;margin-top:2px;">Lire l'heure ou calculer une durée</div></div>
          <div style="background:#f8f9fb;border:1px solid #e5e8ee;border-radius:8px;padding:10px 12px;"><div style="font-weight:700;font-size:13px;color:#222;">🕰️ Horloge interactive</div><div style="font-size:12px;color:#666;margin-top:2px;">Manipuler les aiguilles pour régler l'heure</div></div>
          <div style="background:#f8f9fb;border:1px solid #e5e8ee;border-radius:8px;padding:10px 12px;"><div style="font-weight:700;font-size:13px;color:#222;">📐 Conversion</div><div style="font-size:12px;color:#666;margin-top:2px;">S'entraîner aux conversions de mesures</div></div>
          <div style="background:#f8f9fb;border:1px solid #e5e8ee;border-radius:8px;padding:10px 12px;"><div style="font-weight:700;font-size:13px;color:#222;">🍕 Fractions</div><div style="font-size:12px;color:#666;margin-top:2px;">Manipuler des fractions avec des figures partageables</div></div>
          <div style="background:#f8f9fb;border:1px solid #e5e8ee;border-radius:8px;padding:10px 12px;"><div style="font-weight:700;font-size:13px;color:#222;">🧊 Solides 3D</div><div style="font-size:12px;color:#666;margin-top:2px;">Manipuler des solides en 3 dimensions</div></div>
          <div style="background:#f8f9fb;border:1px solid #e5e8ee;border-radius:8px;padding:10px 12px;"><div style="font-weight:700;font-size:13px;color:#222;">🎰 Loto des multiplications</div><div style="font-size:12px;color:#666;margin-top:2px;">Jeu de loto pour mémoriser les tables de multiplication</div></div>
          <div style="background:#f8f9fb;border:1px solid #e5e8ee;border-radius:8px;padding:10px 12px;"><div style="font-weight:700;font-size:13px;color:#222;">📏 Tracés géométriques</div><div style="font-size:12px;color:#666;margin-top:2px;">Utiliser la règle, l'équerre et le compas pour tracer</div></div>
          <div style="background:#f8f9fb;border:1px solid #e5e8ee;border-radius:8px;padding:10px 12px;"><div style="font-weight:700;font-size:13px;color:#222;">🔲 Reproduction quadrillage</div><div style="font-size:12px;color:#666;margin-top:2px;">Dessiner un modèle à reproduire sur un quadrillage</div></div>
          <div style="background:#f8f9fb;border:1px solid #e5e8ee;border-radius:8px;padding:10px 12px;"><div style="font-weight:700;font-size:13px;color:#222;">🔁 Symétrie axiale</div><div style="font-size:12px;color:#666;margin-top:2px;">Dessiner une figure et son symétrique par rapport à un axe</div></div>
        </div>

        <div style="font-size:0.9em;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">📖 Français</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;">
          <div style="background:#f8f9fb;border:1px solid #e5e8ee;border-radius:8px;padding:10px 12px;"><div style="font-weight:700;font-size:13px;color:#222;">🔤 Ordre alphabétique</div><div style="font-size:12px;color:#666;margin-top:2px;">Classer des mots dans l'ordre alphabétique</div></div>
          <div style="background:#f8f9fb;border:1px solid #e5e8ee;border-radius:8px;padding:10px 12px;"><div style="font-weight:700;font-size:13px;color:#222;">✏️ Conjugaison</div><div style="font-size:12px;color:#666;margin-top:2px;">Test de conjugaison (présent, imparfait, futur)</div></div>
          <div style="background:#f8f9fb;border:1px solid #e5e8ee;border-radius:8px;padding:10px 12px;"><div style="font-weight:700;font-size:13px;color:#222;">🏷️ Nature grammaticale</div><div style="font-size:12px;color:#666;margin-top:2px;">Classer les mots selon leur nature</div></div>
          <div style="background:#f8f9fb;border:1px solid #e5e8ee;border-radius:8px;padding:10px 12px;"><div style="font-weight:700;font-size:13px;color:#222;">📝 Écriture Séyès</div><div style="font-size:12px;color:#666;margin-top:2px;">Écrire directement sur un lignage Séyès</div></div>
          <div style="background:#f8f9fb;border:1px solid #e5e8ee;border-radius:8px;padding:10px 12px;"><div style="font-weight:700;font-size:13px;color:#222;">🔍 Mots mêlés</div><div style="font-size:12px;color:#666;margin-top:2px;">Générer et jouer à une grille interactive de mots mêlés</div></div>
        </div>

        <div style="font-size:0.9em;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">🎨 Arts & Sciences</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:20px;">
          <div style="background:#f8f9fb;border:1px solid #e5e8ee;border-radius:8px;padding:10px 12px;"><div style="font-weight:700;font-size:13px;color:#222;">🎨 Mélange de couleurs</div><div style="font-size:12px;color:#666;margin-top:2px;">Mélanger les couleurs primaires pour en créer de nouvelles</div></div>
          <div style="background:#f8f9fb;border:1px solid #e5e8ee;border-radius:8px;padding:10px 12px;"><div style="font-weight:700;font-size:13px;color:#222;">🎹 Clavier de piano</div><div style="font-size:12px;color:#666;margin-top:2px;">Jouer les notes sur 3 octaves pour découvrir les sons</div></div>
        </div>

        <div style="font-size:0.97em;font-weight:700;color:#2B7FFF;margin-bottom:8px;">⬜ Les 3 boutons de chaque activité</div>
        <p style="font-size:13px;color:#444;line-height:1.6;margin-bottom:10px;">Chaque activité affiche trois boutons dans sa barre d'en-tête :</p>
        <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:10px;">
          <div style="display:flex;align-items:center;gap:12px;background:#f8f9fb;border:1px solid #e5e8ee;border-radius:8px;padding:10px 14px;">
            <div style="width:28px;height:18px;background:#f0c040;border-radius:4px;flex-shrink:0;"></div>
            <div><span style="font-weight:700;font-size:13px;color:#222;">Réduire</span> <span style="font-size:12.5px;color:#444;">— réduit l'activité à une mini-barre flottante qu'on peut déplacer. Cliquer dessus la rouvre en plein.</span></div>
          </div>
          <div style="display:flex;align-items:center;gap:12px;background:#f8f9fb;border:1px solid #e5e8ee;border-radius:8px;padding:10px 14px;">
            <div style="width:28px;height:18px;background:#3aaa5c;border-radius:4px;flex-shrink:0;"></div>
            <div><span style="font-weight:700;font-size:13px;color:#222;">Plein écran board</span> <span style="font-size:12.5px;color:#444;">— étend l'activité pour occuper tout le bureau, par-dessus les autres widgets.</span></div>
          </div>
          <div style="display:flex;align-items:center;gap:12px;background:#f8f9fb;border:1px solid #e5e8ee;border-radius:8px;padding:10px 14px;">
            <div style="width:28px;height:18px;background:#ff5f56;border-radius:4px;flex-shrink:0;"></div>
            <div><span style="font-weight:700;font-size:13px;color:#222;">Fermer</span> <span style="font-size:12.5px;color:#444;">— ferme et supprime l'activité du bureau.</span></div>
          </div>
        </div>
        <div style="background:#eef7ff;border-left:4px solid #2B7FFF;border-radius:0 8px 8px 0;padding:10px 14px;font-size:12.5px;color:#1a4d8f;">💡 En mode réduit, l'activité reste active en arrière-plan. Vous pouvez continuer à annoter le bureau et la rouvrir d'un clic.</div>
      </div>

      <!-- OUTILS -->
      <div id="h-outils" class="help-section">
        <div style="font-size:1.15em;font-weight:800;color:#1a1a2e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e8ee;">🧰 Outils</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:16px;">Les outils sont accessibles via l'onglet <strong>🧰 Outils</strong> sur le bord gauche du bureau. Chaque outil s'ouvre comme un widget sur le bureau et possède son propre <strong>bouton d'aide ❓</strong> pour en détailler le fonctionnement.</p>

        <div style="font-size:0.9em;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">🚸 Gestion de la classe</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;">
          <div style="background:#f8f9fb;border:1px solid #e5e8ee;border-radius:8px;padding:10px 12px;"><div style="font-weight:700;font-size:13px;color:#222;">🎲 Tirage au sort</div><div style="font-size:12px;color:#666;margin-top:2px;">Tirer au sort un prénom d'élève</div></div>
          <div style="background:#f8f9fb;border:1px solid #e5e8ee;border-radius:8px;padding:10px 12px;"><div style="font-weight:700;font-size:13px;color:#222;">👥 Équipes équilibrées</div><div style="font-size:12px;color:#666;margin-top:2px;">Créer des équipes équilibrées</div></div>
          <div style="background:#f8f9fb;border:1px solid #e5e8ee;border-radius:8px;padding:10px 12px;"><div style="font-weight:700;font-size:13px;color:#222;">⏱️ Minuteur & Chrono</div><div style="font-size:12px;color:#666;margin-top:2px;">Gérer le temps des activités</div></div>
          <div style="background:#f8f9fb;border:1px solid #e5e8ee;border-radius:8px;padding:10px 12px;"><div style="font-weight:700;font-size:13px;color:#222;">🏫 Plan de la classe</div><div style="font-size:12px;color:#666;margin-top:2px;">Créer et éditer le plan de la classe</div></div>
          <div style="background:#f8f9fb;border:1px solid #e5e8ee;border-radius:8px;padding:10px 12px;"><div style="font-weight:700;font-size:13px;color:#222;">📊 Sondage</div><div style="font-size:12px;color:#666;margin-top:2px;">Créer et voter pour un sondage express</div></div>
        </div>

        <div style="font-size:0.9em;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">📢 Gestion du bruit</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;">
          <div style="background:#f8f9fb;border:1px solid #e5e8ee;border-radius:8px;padding:10px 12px;"><div style="font-weight:700;font-size:13px;color:#222;">🧘 Défi Calme</div><div style="font-size:12px;color:#666;margin-top:2px;">Rester silencieux pour révéler une image</div></div>
          <div style="background:#f8f9fb;border:1px solid #e5e8ee;border-radius:8px;padding:10px 12px;"><div style="font-weight:700;font-size:13px;color:#222;">📡 Radar de Bruit</div><div style="font-size:12px;color:#666;margin-top:2px;">Visualiser le bruit ambiant en temps réel</div></div>
          <div style="background:#f8f9fb;border:1px solid #e5e8ee;border-radius:8px;padding:10px 12px;"><div style="font-weight:700;font-size:13px;color:#222;">🔊 Sonomètre</div><div style="font-size:12px;color:#666;margin-top:2px;">Mesurer et afficher le niveau sonore en dB</div></div>
        </div>

        <div style="font-size:0.9em;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">🪛 Outils divers</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;">
          <div style="background:#f8f9fb;border:1px solid #e5e8ee;border-radius:8px;padding:10px 12px;"><div style="font-weight:700;font-size:13px;color:#222;"><img src="https://outilsprofs.fr/outilsprofs_icone.png" style="width:14px;height:14px;object-fit:contain;border-radius:3px;vertical-align:middle;margin-right:4px;">OutilsProfs</div><div style="font-size:12px;color:#666;margin-top:2px;">Accès aux outils pédagogiques outilsprofs.fr</div></div>
        </div>

        <div style="background:#fff8e1;border-left:4px solid #f0c040;border-radius:0 8px 8px 0;padding:10px 14px;font-size:12.5px;color:#7a5c00;">💡 Le Radar de Bruit et le Sonomètre nécessitent l'autorisation d'accès au microphone dans le navigateur.</div>
      </div>

      <!-- WIDGETS PANEL -->
      <div id="h-widgets-panel" class="help-section">
        <div style="font-size:1.15em;font-weight:800;color:#1a1a2e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e8ee;">📦 Widgets</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:16px;">Les widgets sont accessibles via l'onglet <strong>📦 Widgets</strong> sur le bord gauche du bureau. Chaque widget s'ouvre comme une fenêtre flottante indépendante : déplaçable, redimensionnable et rotatif.</p>

        <div style="font-size:0.9em;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">📦 Médias & Info</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;">
          <div style="background:#f8f9fb;border:1px solid #e5e8ee;border-radius:8px;padding:10px 12px;"><div style="font-weight:700;font-size:13px;color:#222;">📄 PDF</div><div style="font-size:12px;color:#666;margin-top:2px;">Afficher et annoter un document PDF</div></div>
          <div style="background:#f8f9fb;border:1px solid #e5e8ee;border-radius:8px;padding:10px 12px;"><div style="font-weight:700;font-size:13px;color:#222;">💻 Fenêtre Web</div><div style="font-size:12px;color:#666;margin-top:2px;">Intégrer n'importe quel site web</div></div>
          <div style="background:#f8f9fb;border:1px solid #e5e8ee;border-radius:8px;padding:10px 12px;"><div style="font-weight:700;font-size:13px;color:#222;">🎬 YouTube</div><div style="font-size:12px;color:#666;margin-top:2px;">Intégrer une vidéo YouTube</div></div>
        </div>

        <div style="font-size:0.9em;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">🕒 Temps & Météo</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;">
          <div style="background:#f8f9fb;border:1px solid #e5e8ee;border-radius:8px;padding:10px 12px;"><div style="font-weight:700;font-size:13px;color:#222;">📅 Date du jour</div><div style="font-size:12px;color:#666;margin-top:2px;">Affiche la date en temps réel</div></div>
          <div style="background:#f8f9fb;border:1px solid #e5e8ee;border-radius:8px;padding:10px 12px;"><div style="font-weight:700;font-size:13px;color:#222;">🕒 Heure actuelle</div><div style="font-size:12px;color:#666;margin-top:2px;">Affiche l'heure en temps réel</div></div>
          <div style="background:#f8f9fb;border:1px solid #e5e8ee;border-radius:8px;padding:10px 12px;"><div style="font-weight:700;font-size:13px;color:#222;">⛅ Météo locale</div><div style="font-size:12px;color:#666;margin-top:2px;">Affiche la météo de votre ville</div></div>
        </div>

        <div style="font-size:0.9em;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">📋 Organisation & Annotation</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;">
          <div style="background:#f8f9fb;border:1px solid #e5e8ee;border-radius:8px;padding:10px 12px;"><div style="font-weight:700;font-size:13px;color:#222;">✍️ Texte</div><div style="font-size:12px;color:#666;margin-top:2px;">Zone de texte libre avec mise en forme</div></div>
          <div style="background:#f8f9fb;border:1px solid #e5e8ee;border-radius:8px;padding:10px 12px;"><div style="font-weight:700;font-size:13px;color:#222;">📝 Devoirs à noter</div><div style="font-size:12px;color:#666;margin-top:2px;">Éditer les devoirs de la classe</div></div>
          <div style="background:#f8f9fb;border:1px solid #e5e8ee;border-radius:8px;padding:10px 12px;"><div style="font-weight:700;font-size:13px;color:#222;">📌 Planning de la journée</div><div style="font-size:12px;color:#666;margin-top:2px;">Afficher le programme horaire</div></div>
        </div>
      </div>

      <!-- IMAGES -->
      <div id="h-images" class="help-section">
        <div style="font-size:1.15em;font-weight:800;color:#1a1a2e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e8ee;">🖼️ Images</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:14px;">L'onglet <strong>🖼️ Images</strong> ouvre un panneau avec deux façons d'ajouter une image sur le bureau.</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Source</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Description</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;font-weight:700;">Bibliothèque intégrée</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Collection d'images organisées par catégories : Maths (tableaux, droites numériques, tangram…), Saisons, Monnaie, BD, Animaux, Météo, Cadres, Textures. Cliquez sur une image pour la déposer sur le bureau.</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;font-weight:700;">Importer une image</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Bouton pour importer un fichier image depuis votre ordinateur (JPG, PNG, GIF…).</td></tr>
          <tr><td style="padding:8px 12px;font-weight:700;">Coller (Ctrl+V)</td><td style="padding:8px 12px;color:#444;">Collez une image depuis le presse-papier n'importe où sur le bureau — fonctionne avec les captures d'écran.</td></tr>
        </table>
        <div style="background:#eef7ff;border-left:4px solid #2B7FFF;border-radius:0 8px 8px 0;padding:10px 14px;font-size:12.5px;color:#1a4d8f;">💡 Une fois déposée, une image est déplaçable, redimensionnable, pivotable et peut être <strong>ancrée</strong> (⚓) pour annoter par-dessus sans la bouger.</div>
      </div>

      <!-- STICKERS -->
      <div id="h-stickers" class="help-section">
        <div style="font-size:1.15em;font-weight:800;color:#1a1a2e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e8ee;">🤓 Stickers</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:14px;">L'onglet <strong>🤓 Stickers</strong> ouvre un panneau d'emojis déposables sur le bureau. Chaque sticker est déplaçable, redimensionnable et rotatif.</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Mode</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Description</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;font-weight:700;">🌐 Stickers animés</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Emojis animés Noto (Google). Nécessite une connexion internet. Catégories : Visages, Animaux, Nourriture, Voyages, Activités, Objets, Symboles, Drapeaux.</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;font-weight:700;">📴 Émojis classiques</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Emojis statiques intégrés, disponibles hors-ligne. Catégories : Visages, Animaux, Nourriture, Fêtes, École, Objets, Symboles, Nature, Personnes.</td></tr>
          <tr><td style="padding:8px 12px;font-weight:700;">🔍 Recherche</td><td style="padding:8px 12px;color:#444;">Champ de recherche pour filtrer les emojis dans toutes les catégories à la fois.</td></tr>
        </table>
        <div style="background:#eef7ff;border-left:4px solid #2B7FFF;border-radius:0 8px 8px 0;padding:10px 14px;font-size:12.5px;color:#1a4d8f;">💡 Si la connexion internet est absente, le panneau bascule automatiquement en mode classique (badge HORS-LIGNE affiché).</div>
      </div>

      <!-- BIBLIOTHÈQUE PDF -->
      <div id="h-pdf-lib" class="help-section">
        <div style="font-size:1.15em;font-weight:800;color:#1a1a2e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e8ee;">📋 Bibliothèque PDF</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:14px;">L'onglet <strong>📋 PDF</strong> ouvre la bibliothèque PDF : un gestionnaire de dossiers pour accéder rapidement à vos fichiers PDF locaux sans les importer un par un.</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Action</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Description</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;font-weight:700;">📂 Choisir un dossier</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Sélectionnez un dossier sur votre ordinateur. La bibliothèque liste tous les PDF qu'il contient.</td></tr>
          <tr><td style="padding:8px 12px;font-weight:700;">Double-clic sur un PDF</td><td style="padding:8px 12px;color:#444;">Ouvre le fichier directement dans un widget PDF sur le bureau, prêt à consulter. Le widget PDF dispose d'un bouton <strong>✏️ Annoter</strong> dans sa barre d'outils qui active la barre de dessin en mode annotation PDF pour écrire et surligner directement sur le document.</td></tr>
        </table>
        <div style="background:#eef7ff;border-left:4px solid #2B7FFF;border-radius:0 8px 8px 0;padding:10px 14px;font-size:12.5px;color:#1a4d8f;">💡 Le dossier sélectionné est mémorisé entre les sessions. Il suffit de rouvrir la bibliothèque pour retrouver vos fichiers sans re-sélectionner le dossier.</div>
      </div>

      <!-- ÉCRAN -->
      <div id="h-ecran" class="help-section">
        <div style="font-size:1.15em;font-weight:800;color:#1a1a2e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e8ee;">🖥️ Écran</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:16px;">L'onglet <strong>🖥️ Écran</strong> regroupe les options d'affichage et les raccourcis d'historique pour personnaliser le bureau selon vos besoins.</p>

        <div style="font-size:0.97em;font-weight:700;color:#2B7FFF;margin:0 0 8px 0;">↩ Annuler &amp; Refaire</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:10px;">Le panneau Écran expose les boutons d'historique pour annuler ou rétablir vos dernières actions sur le bureau.</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:14px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Bouton</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Raccourci clavier</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Action</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;font-weight:700;">↩ Annuler</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;"><kbd>Ctrl+Z</kbd></td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Revient à l'état précédent du bureau</td></tr>
          <tr><td style="padding:8px 12px;font-weight:700;">↪ Refaire</td><td style="padding:8px 12px;color:#444;"><kbd>Ctrl+Y</kbd></td><td style="padding:8px 12px;color:#444;">Rétablit l'action annulée</td></tr>
        </table>
        <div style="background:#eef7ff;border-left:4px solid #2B7FFF;border-radius:0 8px 8px 0;padding:10px 14px;font-size:12.5px;color:#1a4d8f;margin-bottom:18px;">💡 L'historique conserve jusqu'à <strong>60 états</strong> par session. Il est perdu si vous fermez ou rechargez la page. Les raccourcis clavier ne fonctionnent pas quand le curseur est dans un champ de texte.</div>

		<div style="font-size:0.97em;font-weight:700;color:#2B7FFF;margin:0 0 8px 0;">🗑️ Effacer le bureau</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:14px;">Le bouton <strong>Effacer</strong> supprime en un clic l'ensemble des widgets, tracés et formes présents sur le tableau courant. Une confirmation est demandée avant de procéder. Cette action est enregistrée dans l'historique et peut être annulée avec <kbd>Ctrl+Z</kbd>.</p>

        <div style="font-size:0.97em;font-weight:700;color:#2B7FFF;margin:0 0 8px 0;">❓ Aide</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:4px;">Ouvre cette modale d'aide complète. Vous pouvez aussi y accéder à tout moment via <strong>＋ → Système → Aide</strong>.</p>
		
        <div style="font-size:0.97em;font-weight:700;color:#2B7FFF;margin:0 0 8px 0;">🌙 / ☀️ Mode d'affichage du menu</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:14px;">Basculez entre le <strong>mode sombre</strong> (fond noir, par défaut) et le <strong>mode clair</strong> (fond blanc) pour adapter la lisibilité du menu à votre salle ou votre vidéoprojecteur.</p>

        <div style="font-size:0.97em;font-weight:700;color:#2B7FFF;margin:0 0 8px 0;">🔴 Pointeur laser</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:10px;">Remplace le curseur système par un point rouge lumineux, beaucoup plus visible sur vidéoprojecteur.</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:14px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Action</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Résultat</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Clic sur 🔴 dans le panneau</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Active le pointeur laser</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Re-clic sur 🔴</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Désactive le pointeur</td></tr>
          <tr><td style="padding:8px 12px;"><kbd>Échap</kbd></td><td style="padding:8px 12px;color:#444;">Désactive en urgence</td></tr>
        </table>

        <div style="font-size:0.97em;font-weight:700;color:#2B7FFF;margin:0 0 8px 0;">📄 Format A4 Portrait</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:14px;">Active un mode où le bureau prend les proportions d'une page A4 portrait, pratique pour préparer un document à imprimer ou à projeter en format page.</p>

        <div style="font-size:0.97em;font-weight:700;color:#2B7FFF;margin:0 0 8px 0;">🖼️ Fond d'écran</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:10px;">Permet de choisir le fond du tableau courant. Chaque tableau conserve son propre fond.</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:18px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Type de fond</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Options disponibles</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Couleur unie</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Palette de couleurs prédéfinies + saisie hex + sélecteur natif</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Réglures</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Séyès (paille, blanc, avec marge) · Lignes simples · Grands carreaux · Petits carreaux · Ardoise</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Échelle du fond</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Slider pour ajuster la taille de la réglure</td></tr>
          <tr><td style="padding:8px 12px;">Aucun fond</td><td style="padding:8px 12px;color:#444;">Fond noir par défaut</td></tr>
        </table>
       
      </div>

      <!-- CONTRÔLES DES WIDGETS -->
      <div id="h-controles" class="help-section">
        <div style="font-size:1.15em;font-weight:800;color:#1a1a2e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e8ee;">🎛️ Contrôles des widgets</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:16px;">Chaque widget dispose de poignées et de boutons communs pour le manipuler sur le bureau.</p>

        <div style="font-size:0.9em;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">↔ Poignées de manipulation</div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Poignée</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Position</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Action</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;font-weight:700;">✥</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Gauche (milieu)</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Déplacer par glisser-déposer</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;font-weight:700;">↻</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Droite (milieu)</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Faire pivoter — magnétisme aux angles 0°/45°/90°…</td></tr>
          <tr><td style="padding:8px 12px;font-weight:700;">▲</td><td style="padding:8px 12px;color:#444;">Bas à droite</td><td style="padding:8px 12px;color:#444;">Redimensionner librement (triangle gris au survol)</td></tr>
        </table>

        <div style="font-size:0.9em;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">🔲 Barre d'action (en haut du widget)</div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Bouton</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Action</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;font-weight:700;">📌</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Épingler au premier plan — le widget reste toujours visible par-dessus les autres (fond doré = épinglé)</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;font-weight:700;">🔽</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Envoyer derrière tous les autres widgets</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;font-weight:700;">☰</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Menu contextuel : dupliquer, fond transparent, couleur de fond, opacité…</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;font-weight:700;color:#ff5f56;">×</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Supprimer le widget</td></tr>
        </table>

        <div style="font-size:0.9em;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">⬜ Boutons spécifiques aux widgets à contenu (PDF, YouTube, Fenêtre Web…)</div>
        <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">
          <div style="display:flex;align-items:center;gap:12px;background:#f8f9fb;border:1px solid #e5e8ee;border-radius:8px;padding:10px 14px;">
            <div style="width:28px;height:18px;background:#f0c040;border-radius:4px;flex-shrink:0;"></div>
            <div><span style="font-weight:700;font-size:13px;color:#222;">Réduire</span> <span style="font-size:12.5px;color:#444;">— réduit le widget à une mini-barre flottante déplaçable. Cliquer dessus le rouvre.</span></div>
          </div>
          <div style="display:flex;align-items:center;gap:12px;background:#f8f9fb;border:1px solid #e5e8ee;border-radius:8px;padding:10px 14px;">
            <div style="width:28px;height:18px;background:#3aaa5c;border-radius:4px;flex-shrink:0;"></div>
            <div><span style="font-weight:700;font-size:13px;color:#222;">Plein écran board</span> <span style="font-size:12.5px;color:#444;">— étend le widget pour occuper tout le bureau, par-dessus les autres éléments.</span></div>
          </div>
          <div style="display:flex;align-items:center;gap:12px;background:#f8f9fb;border:1px solid #e5e8ee;border-radius:8px;padding:10px 14px;">
            <div style="width:28px;height:18px;background:#ff5f56;border-radius:4px;flex-shrink:0;"></div>
            <div><span style="font-weight:700;font-size:13px;color:#222;">Fermer</span> <span style="font-size:12.5px;color:#444;">— ferme et supprime le widget du bureau.</span></div>
          </div>
          <div style="display:flex;align-items:center;gap:12px;background:#f8f9fb;border:1px solid #e5e8ee;border-radius:8px;padding:10px 14px;">
            <div style="width:28px;height:18px;background:#8E51FF;border-radius:4px;flex-shrink:0;"></div>
            <div><span style="font-weight:700;font-size:13px;color:#222;">Ancrer</span> <span style="font-size:12.5px;color:#444;">— disponible uniquement sur les <strong>images</strong>. Rend l'image insélectionnable et non déplaçable, pour pouvoir écrire et annoter par-dessus sans risquer de la bouger. Un badge ⚓ apparaît pour désancrer.</span></div>
          </div>
        </div>

        <div style="font-size:0.9em;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;margin-top:4px;">⛓️ Grouper, dissocier, fusionner</div>
        <p style="font-size:13px;color:#444;line-height:1.6;margin-bottom:10px;">Ces actions s'appliquent à une <strong>sélection multiple</strong> (Maj+clic ou lasso). Les boutons apparaissent dans la barre de contrôle au-dessus de la sélection.</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:10px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Action</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Effet</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;font-weight:700;">⊞ Grouper <kbd style="font-size:11px;background:#eee;border:1px solid #ccc;border-radius:3px;padding:1px 5px;">Ctrl+G</kbd></td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Lie les éléments sélectionnés. Cliquer sur l'un déplace, redimensionne ou pivote tout le groupe d'un coup.</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;font-weight:700;">⛓️ Dissocier <kbd style="font-size:11px;background:#eee;border:1px solid #ccc;border-radius:3px;padding:1px 5px;">Ctrl+Maj+G</kbd></td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Défait le groupe — les éléments redeviennent indépendants.</td></tr>
          <tr><td style="padding:8px 12px;font-weight:700;">🖼️ Fusionner</td><td style="padding:8px 12px;color:#444;">Aplatit définitivement tous les éléments sélectionnés (widgets, dessins, formes) en une seule image PNG. <strong>Opération irréversible.</strong></td></tr>
        </table>
      </div>

      <!-- MODE PRÉSENTATION -->
      <div id="h-presentation" class="help-section">
        <div style="font-size:1.15em;font-weight:800;color:#1a1a2e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e8ee;">📽️ Mode présentation</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:14px;">Le mode présentation masque toute l'interface (boutons, onglets, menus) pour ne laisser visible que le contenu du bureau — idéal pour projeter proprement face aux élèves.</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Action</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Résultat</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Onglet <strong>📽️ Présentation</strong> (bord gauche)</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Active le mode — affiche "On". Toute l'interface disparaît.</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Onglet <strong>📽️ Off</strong></td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Quitte le mode et restaure l'interface.</td></tr>
          <tr><td style="padding:8px 12px;"><kbd>Échap</kbd></td><td style="padding:8px 12px;color:#444;">Quitte le mode présentation en urgence.</td></tr>
        </table>
        <div style="background:#1a1a2e;border-left:4px solid #8E51FF;border-radius:0 8px 8px 0;padding:10px 14px;font-size:12.5px;color:#ccc;">💡 En mode présentation, les widgets épinglés (📌) restent visibles et interactifs — pratique pour garder un minuteur ou une horloge accessible.</div>
      </div>

      <!-- TEXTE & FORMAT -->
      <div id="h-texte" class="help-section">
        <div style="font-size:1.15em;font-weight:800;color:#1a1a2e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e8ee;">🖊️ Texte &amp; Formatage</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:10px;"><strong>Double-cliquez</strong> dans un widget Texte ou Devoirs pour entrer en édition. La <strong>barre de formatage</strong> apparaît automatiquement en haut de l'écran.</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Contrôle</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Action</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Sélecteur de police</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Changer la police (inclut BelleAllureGS, cursives, sans-serif…)</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Taille (px)</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Taille en pixels, saisie libre ou boutons ＋/−</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;"><strong>G</strong> / <em>I</em> / <u>S</u></td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Gras, Italique, Souligné</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Alignement</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Gauche, Centré, Droite, Justifié</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Interligne</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Espacement entre les lignes</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">🎨 Couleur texte</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Color picker : grille + saisie hex + sélecteur natif</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">🖍️ Surlignage</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Couleur de surlignage du texte sélectionné</td></tr>
          <tr><td style="padding:8px 12px;">🎨 Fond du widget</td><td style="padding:8px 12px;color:#444;">Couleur de fond + opacité (slider %) + bouton Transparent</td></tr>
        </table>
        <div style="background:#eef7ff;border-left:4px solid #2B7FFF;border-radius:0 8px 8px 0;padding:10px 14px;font-size:12.5px;color:#1a4d8f;">💡 Sélectionnez du texte avant de changer la couleur ou la police pour n'affecter que la sélection.</div>
      </div>

      <!-- BARRE DE DESSIN -->
      <div id="h-dessin" class="help-section">
        <div style="font-size:1.15em;font-weight:800;color:#1a1a2e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e8ee;">✏️ Barre de dessin</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:16px;">La barre de dessin s'ouvre via le bouton <strong>✏️</strong> en bas à gauche du bureau (à côté du bouton ＋). Elle flotte librement et est déplaçable par sa poignée. Elle reste visible en mode dessin et en mode annotation PDF, avec les mêmes outils dans les deux cas.</p>

        <div style="font-size:0.9em;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">✏️ Outils de tracé</div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Outil</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Description</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;font-weight:700;">✏️ Crayon</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Tracé libre à main levée. Le trait suit exactement le mouvement de la souris, du stylet ou du doigt. Épaisseur de 1 à 40 px. Compatible pression stylet pour la sensibilité.</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;font-weight:700;">🖍️ Surligneur</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Trait large semi-transparent (effet fluo jaune par défaut). Utilise la même couleur que le crayon mais applique une opacité 40% en mode "multiply" — parfait pour surligner du texte sur un PDF.</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;font-weight:700;">Figures géométriques</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Ouvre un sous-menu de formes à tracer en glissant : cercle, ovale, carré, rectangle, losange, parallélogramme, triangles (isocèle, équilatéral, rectangle, quelconque), pentagone, hexagone, octogone, cœur, étoile, flèche, segment. Option fond coloré avec opacité réglable.</td></tr>
          <tr><td style="padding:8px 12px;font-weight:700;">📐 Outils géométriques</td><td style="padding:8px 12px;color:#444;">Ouvre un sous-menu avec 3 instruments posables sur le bureau : <strong>📏 Règle</strong> (graduée, tracé le long de la règle), <strong>📐 Équerre</strong> (angle droit, tracé des deux côtés), <strong>⭕ Compas</strong> (rayon réglable, tracé d'un cercle). Chaque instrument se déplace par glisser et pivote via sa poignée ↻.</td></tr>
        </table>

        <div style="font-size:0.9em;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">🎨 Couleur et épaisseur</div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Contrôle</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Description</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;font-weight:700;">Color picker</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Swatch de couleur cliquable → ouvre un picker complet (roue chromatique + hex + 9 couleurs prédéfinies en grille). La couleur est partagée entre le crayon, le surligneur et le mode annotation PDF.</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;font-weight:700;">Palette rapide</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Grille de 9 couleurs prédéfinies (rouge, violet, rose, noir, orange, vert, vert clair, gris, jaune, bleu, bleu clair, blanc) cliquables directement sans ouvrir le picker.</td></tr>
          <tr><td style="padding:8px 12px;font-weight:700;">Épaisseur − valeur +</td><td style="padding:8px 12px;color:#444;">Deux tailles indépendantes : l'une pour le <strong>trait de dessin</strong> (1–40 px) et l'autre pour la <strong>gomme</strong> (5–80 px). Les boutons − et + permettent un ajustement continu par maintien.</td></tr>
        </table>

        <div style="font-size:0.9em;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">🧽 Gomme et effacement</div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Contrôle</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Description</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;font-weight:700;">🧽 Gomme</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Efface les traits de dessin et les formes au passage. La taille (5–80 px) est réglée par les boutons − + à gauche de la gomme. Un cercle en pointillés prévisualise la zone d'effacement. Fonctionne aussi sur les annotations PDF.</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;font-weight:700;">Clic droit (ou bouton stylet)</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Bascule instantanément entre la gomme et l'outil précédent — pratique avec un stylet pour alterner tracé/effacement sans toucher la barre.</td></tr>
          <tr><td style="padding:8px 12px;font-weight:700;">🗑️ Effacer tout</td><td style="padding:8px 12px;color:#444;">Supprime tous les traits d'un coup. En mode annotation PDF, efface toutes les annotations de la page courante.</td></tr>
        </table>

        <div style="font-size:0.9em;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">🖱️ Mode sélection et annulation</div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Contrôle</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Description</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;font-weight:700;">↖ Sélection</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Repasse en mode sélection de widgets sans fermer la barre de dessin. Permet de déplacer des éléments, puis de reprendre le dessin en recliquant sur crayon ou surligneur.</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;font-weight:700;">↩ Annuler / ↪ Refaire</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Annule ou rétablit le dernier trait. En mode annotation PDF, n'annule que les annotations PDF (pas les actions du bureau).</td></tr>
          <tr><td style="padding:8px 12px;font-weight:700;">✖ Fermer</td><td style="padding:8px 12px;color:#444;">Ferme la barre de dessin et repasse en mode sélection normal. Les tracés restent sur le bureau.</td></tr>
        </table>

        <div style="font-size:0.9em;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">⚙️ Options avancées (engrenage)</div>
        <p style="font-size:13px;color:#444;line-height:1.6;margin-bottom:10px;">Le bouton ⚙️ en bout de barre ouvre un panneau de réglages fins :</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Option</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Description</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;font-weight:700;">Lissage (1–20)</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Contrôle le lissage du trait stylet. Une valeur basse produit un trait plus lissé et fluide (mieux pour les courbes) ; une valeur haute est plus réactive et fidèle au geste.</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;font-weight:700;">Opacité (10–100 %)</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Opacité globale du trait de dessin libre. Permet de faire des traits semi-transparents sans utiliser le surligneur.</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;font-weight:700;">Reconnaître formes</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Interrupteur on/off. Quand activé, les formes dessinées à main levée (cercle, carré, rectangle, triangle) sont automatiquement converties en formes géométriques parfaites après le tracé.</td></tr>
          <tr><td style="padding:8px 12px;font-weight:700;">Curseur (✛ ⬤ ◎)</td><td style="padding:8px 12px;color:#444;"><strong>✛ Précision</strong> : croix fine, idéale pour un positionnement exact. <strong>⬤ Point</strong> : petit cercle avec l'anneau de taille, neutre. <strong>◎ Taille</strong> (défaut) : disque coloré dont le diamètre correspond à l'épaisseur du trait — pratique pour visualiser le rendu avant de tracer.</td></tr>
        </table>

        <div style="font-size:0.9em;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">📄 Mode annotation PDF</div>
        <p style="font-size:13px;color:#444;line-height:1.6;margin-bottom:10px;">Le bouton <strong>📄</strong> dans la barre de dessin active le mode annotation PDF : la barre s'adapte et permet d'annoter directement sur le widget PDF ouvert. Deux boutons supplémentaires apparaissent :</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:10px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Bouton</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Description</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;font-weight:700;">🤚 Déplacer</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Mode panoramique : glisser pour faire défiler le PDF dans le widget sans dessiner. Pratique sur les PDF zoomés ou multi-pages.</td></tr>
          <tr><td style="padding:8px 12px;font-weight:700;">Texte</td><td style="padding:8px 12px;color:#444;">Cliquez sur le PDF pour insérer une zone de texte à cet endroit. Un éditeur inline apparaît avec réglage de taille et de couleur. Le texte est déplaçable, pivotable et modifiable par double-clic. Validation par <kbd>Échap</kbd> ou <kbd>Maj+Entrée</kbd>.</td></tr>
        </table>
        <div style="background:#eef7ff;border-left:4px solid #2B7FFF;border-radius:0 8px 8px 0;padding:10px 14px;font-size:12.5px;color:#1a4d8f;">💡 En mode annotation PDF, le crayon, le surligneur, les figures, la gomme et les annulations (↩ ↪) agissent uniquement sur les annotations PDF — pas sur le bureau. Les annotations sont sauvegardées avec le projet et exportables en PDF (bouton 💾 dans la barre du widget PDF).</div>
      </div>

      <!-- PROJETS -->
      <div id="h-projets" class="help-section">
        <div style="font-size:1.15em;font-weight:800;color:#1a1a2e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e8ee;">📁 Projets</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:10px;">Un <strong>projet</strong> est un ensemble de tableaux sauvegardé dans votre navigateur (IndexedDB). Vous pouvez avoir autant de projets que vous voulez.</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Action</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Comment</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">✨ Nouveau projet</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Menu Fichier → Nouveau projet → saisir un nom. Sauvegardé immédiatement en IndexedDB.</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">📝 Nouveau brouillon</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Menu Fichier → Nouveau brouillon. Aucune sauvegarde automatique. Fond vieux rose distinctif.</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">📁 Tous mes projets</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Bibliothèque : liste tous les projets avec leurs tableaux en accordéon. Double-clic ou 📂 pour ouvrir.</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">⭐ Projets favoris</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Cliquez sur ☆ dans la bibliothèque pour marquer un favori → accès rapide dans le menu Fichier.</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">✏️ Renommer</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Bouton ✏️ dans la bibliothèque de projets</td></tr>
          <tr><td style="padding:8px 12px;">× Supprimer</td><td style="padding:8px 12px;color:#444;">Bouton × dans la bibliothèque de projets</td></tr>
        </table>
        <div style="font-size:0.97em;font-weight:700;color:#2B7FFF;margin:14px 0 8px 0;">📝 Mode brouillon</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:8px;">Le brouillon ne s'enregistre <strong>nulle part automatiquement</strong>. La bibliothèque affiche un bandeau jaune "📝 Brouillon en cours" avec le bouton <strong>💾 Enregistrer</strong> pour lui donner un nom.</p>
        <div style="background:#fff8e6;border-left:4px solid #f39c12;border-radius:0 8px 8px 0;padding:10px 14px;font-size:12.5px;color:#7a5000;">⚠️ Si vous ouvrez un autre projet sans enregistrer le brouillon, son contenu sera perdu définitivement.</div>
      </div>

      <!-- SCÈNES -->
      <div id="h-scenes" class="help-section">
        <div style="font-size:1.15em;font-weight:800;color:#1a1a2e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e8ee;">🗂️ Tableaux (Scènes)</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:10px;">Un projet peut contenir jusqu'à <strong>10 tableaux</strong> indépendants, chacun avec son contenu et son fond. Accédez via <strong>＋ → Fichier → Tableaux de ce projet</strong>.</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Action</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Comment</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Changer de tableau</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Cliquez sur son nom dans le sous-menu</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Créer un tableau</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Bouton <strong>＋ Nouveau tableau</strong> en bas du sous-menu</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Renommer</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Bouton ✏️ à droite du tableau dans la liste</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Supprimer</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Bouton × (impossible si c'est le dernier tableau)</td></tr>
          <tr><td style="padding:8px 12px;">Réordonner</td><td style="padding:8px 12px;color:#444;">Glissez la poignée ⠿ à gauche du tableau</td></tr>
        </table>
        <div style="background:#eef7ff;border-left:4px solid #2B7FFF;border-radius:0 8px 8px 0;padding:12px 16px;font-size:12.5px;color:#1a4d8f;margin:16px 0;">
          💡 <strong>Exemple d'organisation :</strong><br><br>
          • <strong>Tableau 1 — Accueil</strong> : date, météo, planning de la journée<br>
          • <strong>Tableau 2 — Maths</strong> : leçon du jour, minuteur, calcul mental<br>
          • <strong>Tableau 3 — Français</strong> : texte affiché, exercices, vocabulaire<br>
          • <strong>Tableau 4 — Fin de journée</strong> : devoirs, tirage au sort, YouTube
        </div>
      </div>

      <!-- SAUVEGARDE -->
      <div id="h-sauvegarde" class="help-section">
        <div style="font-size:1.15em;font-weight:800;color:#1a1a2e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e8ee;">💾 Sauvegarde</div>
        <div style="font-size:0.97em;font-weight:700;color:#2B7FFF;margin:0 0 8px 0;">Sauvegarde automatique</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:14px;">Tout est sauvegardé automatiquement dans le navigateur (IndexedDB + localStorage) après chaque modification. Vous retrouvez votre travail à la prochaine ouverture.</p>
        <div style="font-size:0.97em;font-weight:700;color:#2B7FFF;margin:0 0 8px 0;">Exporter / Importer</div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Action</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Détail</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">💾 Sauvegarder (JSON)</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Exporte le projet courant en fichier .json téléchargeable</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">📂 Charger (JSON)</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Importe un fichier .json précédemment exporté</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">📤 Tout exporter</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Exporte <strong>tous</strong> vos projets en un seul fichier de sauvegarde globale</td></tr>
          <tr><td style="padding:8px 12px;">📥 Tout importer</td><td style="padding:8px 12px;color:#444;">Restaure tous les projets depuis une sauvegarde globale (remplace l'existant)</td></tr>
        </table>
        <div style="background:#eef7ff;border-left:4px solid #2B7FFF;border-radius:0 8px 8px 0;padding:10px 14px;font-size:12.5px;color:#1a4d8f;margin-bottom:10px;">💡 Utilisez <strong>📤 Tout exporter</strong> régulièrement comme sauvegarde de sécurité. Changement de navigateur ou vidage du cache : restaurez avec 📥.</div>
        <div style="background:#e8f5e9;border-left:4px solid #4caf50;border-radius:0 8px 8px 0;padding:10px 14px;font-size:12.5px;color:#2e7d32;">✅ Les PDF sont <strong>sauvegardés automatiquement</strong>. <em>Fichiers &gt;5 Mo : sauvegarde non garantie.</em></div>
      </div>

      <!-- À PROPOS -->
      <div id="h-apropos" class="help-section">
        <div style="font-size:1.15em;font-weight:800;color:#1a1a2e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e8ee;">ℹ️ À propos</div>
        <p style="font-size:14px;color:#444;line-height:1.8;">Le bureau du Prof 🤓 Nicolas Bernardet 🤓 Chambéry 🤓 Savoie</p>
      </div>

     
    </div><!-- /contenu -->
  </div><!-- /corps -->

</div><!-- /modal -->
</div><!-- /overlay -->
  `;

  // ── CSS ────────────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    @font-face {
      font-family: 'Nunito';
      src: url('polices/Nunito-Regular.ttf') format('truetype');
      font-weight: normal;
      font-style: normal;
    }
    #help-modal-overlay * {
      font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif !important;
    }
    .help-nav {
      display: flex; align-items: center; gap: 8px;
      padding: 9px 18px; cursor: pointer; font-size: 13px;
      color: #444; font-weight: 500; border-left: 3px solid transparent;
      transition: all 0.15s; user-select: none;
    }
    .help-nav:hover { background: #e8edf5; color: #2B7FFF; }
    .help-section { display: none; }
    #help-sidebar::-webkit-scrollbar { width: 4px; }
    #help-sidebar::-webkit-scrollbar-thumb { background: #ccc; border-radius: 2px; }
  `;
  document.head.appendChild(style);

  document.body.insertAdjacentHTML('beforeend', html);

  document.getElementById('help-modal-overlay').addEventListener('mousedown', function (e) {
    if (e.target === this) closeHelpModal();
  });
})();

// ── Fonctions globales ─────────────────────────────────────────────────────

function openHelpModal() {
  const o = document.getElementById('help-modal-overlay');
  o.style.display = 'flex';
  helpShow(document.querySelector('.help-nav[data-s="h-intro"]'));
}

function helpShow(item) {
  document.querySelectorAll('.help-nav').forEach(i => {
    i.style.borderLeftColor = 'transparent';
    i.style.background = '';
    i.style.color = '#444';
    i.style.fontWeight = '500';
  });
  document.querySelectorAll('.help-section').forEach(s => s.style.display = 'none');
  item.style.borderLeftColor = '#2B7FFF';
  item.style.background      = '#e8edf5';
  item.style.color           = '#2B7FFF';
  item.style.fontWeight      = '700';
  document.getElementById(item.dataset.s).style.display = 'block';
}

function closeHelpModal() {
  document.getElementById('help-modal-overlay').style.display = 'none';
}
