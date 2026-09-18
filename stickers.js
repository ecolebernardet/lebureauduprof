

// ══════════════════════════════════════════════════════
//  PANNEAU STICKERS ANIMÉS — Google Noto Emoji Animation
//  Source : https://googlefonts.github.io/noto-emoji-animation/
//  CDN    : https://fonts.gstatic.com/s/e/notoemoji/latest/{codepoint}/512.webp
// ══════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════
//  ÉMOJIS CLASSIQUES — intégrés en dur, fonctionne hors-ligne
// ══════════════════════════════════════════════════════
var CLASSIC_DATA = {
  "😊 Visages": ["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","🫠","😉","😊","😇","🥰","😍","🤩","😘","😗","😚","😙","🥲","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🫢","🫣","🤫","🤔","🫡","🤐","🤨","😐","😑","😶","🫥","😏","😒","🙄","😬","🤥","🫨","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🤧","🥵","🥶","🥴","😵","🤯","🤠","🥳","🥸","😎","🤓","🧐","😕","🫤","😟","🙁","☹️","😮","😯","😲","😳","🥺","🥹","😦","😧","😨","😰","😥","😢","😭","😱","😖","😣","😞","😓","😩","😫","🥱","😤","😡","🤬","😈","👿","💀","☠️","💩","🤡","👹","👺","👻","👽","👾","🤖","😺","😸","😹","😻","😼","😽","🙀","😿","😾","🙈","🙉","🙊"],
  "🐾 Animaux": ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🐔","🐧","🐦","🐤","🦆","🦅","🦉","🦇","🐺","🐴","🦄","🐝","🦋","🐌","🐞","🐜","🐢","🐍","🦎","🦕","🦖","🐙","🦑","🦞","🦀","🐡","🐠","🐟","🐬","🐳","🐋","🦈","🦭","🐊","🐅","🐆","🦓","🦍","🐘","🦛","🦏","🐪","🐫","🦒","🦘","🐃","🐄","🐎","🐖","🐑","🦙","🐐","🦌","🐕","🐩","🐈","🪶","🐓","🦃","🦚","🦜","🦢","🕊️","🐇","🦔"],
  "🍕 Nourriture": ["🍏","🍎","🍐","🍊","🍋","🍌","🍉","🍇","🍓","🫐","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🍆","🥑","🥦","🥒","🌶️","🌽","🥕","🥔","🍠","🥐","🍞","🥖","🧀","🥚","🍳","🥞","🧇","🥓","🍗","🍖","🌭","🍔","🍟","🍕","🌮","🌯","🥗","🍲","🍛","🍣","🍱","🥟","🍙","🍚","🍘","🍥","🎂","🍰","🧁","🍭","🍬","🍫","🍿","🍩","🍪","🌰","🥜","🍯","🧃","🥤","🧋","☕","🍵","🍺","🍻","🥂","🍷","🍸","🍹","🧊"],
  "🎉 Fêtes": ["🎉","🎊","🎈","🎁","🎀","🎗️","🎖️","🏆","🥇","🥈","🥉","🏅","🎠","🎡","🎢","🎪","🤹","🎭","🎨","🎬","🎤","🎧","🎼","🎹","🥁","🎷","🎺","🎸","🎻","🎲","🎯","🎱","🎳","⛳","🎣","🤿","🎽","🎿","🛷","🥌","🪃","🏹","🎮","🕹️","🎰","🧩","♟️","🪄","🎩","🪅","🪩","🪆","🎑","🎐","🎏","🧧","🎎","🎋","🎆","🎇","🧨"],
  "🏫 École": ["📚","📖","📝","✏️","🖊️","🖋️","🖌️","📐","📏","🗂️","📁","📂","📊","📈","📉","🗒️","📋","📌","📍","📎","🖇️","✂️","🔒","🔓","🔑","🗝️","🔧","🪛","🔩","⚙️","🧮","💡","🔦","🔬","🔭","📡","🧪","🧫","🧬","💉","💊","🩹","🩺","⏰","⏱️","⏲️","⌛","⏳","📅","📆","🗓️","🌐","🗺️","🧭","💻","🖥️","⌨️","🖱️","📱","📷","📹","🎥","💾","📀","🔋","🔊","📢","📣","🔔","🏫","🚗","🚌","✈️","🚀","🎒","👓","🕶️","🥽","💼","👜","👝","🎓","📡"],
  "💡 Objets": ["💻","🖥️","🖨️","⌨️","🖱️","💾","💿","📀","📱","☎️","📞","📺","📷","📸","📹","🎥","📽️","🔋","💡","🔦","🕯️","💵","💴","💶","💷","💸","💳","🪙","💎","⚖️","🧲","🪄","🎩","🧢","👑","💍","💄","👓","🕶️","🥽","🌂","☂️","🧵","🧶","🪢","🧸","🪆","🎀","🎁","🔑","🗝️","🔧","🪛","🔩","⚙️","🪜","🧰","🔬","🔭","📡","🧪","💊","🩹","🩺","⏰","🗺️","🧭","🎒","👜","💼","📚","📖","📝","✏️","🖊️","📐","📏","🪤","🧲","⚗️","🧯"],
  "🔣 Symboles": ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","🩷","🩵","🩶","❤️‍🔥","❤️‍🩹","💔","💕","💞","💓","💗","💖","💘","💝","✅","☑️","❎","❌","⭕","🛑","⛔","📛","🚫","💯","⚠️","☢️","☣️","🔞","📵","🔕","🔇","🔊","📢","📣","🔔","▶️","⏩","⏭️","◀️","⏪","⏮️","🔼","🔽","⏸️","⏹️","⏺️","🎦","📶","🔅","🔆","➕","➖","✖️","➗","♾️","♻️","🔴","🟠","🟡","🟢","🔵","🟣","🟤","⚫","⚪","🟥","🟧","🟨","🟩","🟦","🟪","🟫","⬛","⬜","🔶","🔷","🔸","🔹","🔺","🔻","💠","🔘","⬆️","↗️","➡️","↘️","⬇️","↙️","⬅️","↖️","↕️","↔️","↩️","↪️","⤴️","⤵️","🔃","🔄","🔙","🔚","🔛","🔜","🔝","✨","💫","⚡","💥","🔥","🌟"],
  "🌍 Nature": ["🌍","🌎","🌏","🌐","🗺️","🧭","🌋","🗻","🏔️","⛰️","🏕️","🏖️","🏜️","🏝️","🏞️","🌃","🏙️","🌄","🌅","🌆","🌇","🌉","🌌","🎇","🎆","🌠","🌊","🌬️","🌀","🌈","🌂","☂️","☔","⛱️","⚡","❄️","🌨️","☃️","⛄","🔥","💧","🌵","🌴","🌲","🌳","🌱","🌿","☘️","🌾","🍂","🍁","💐","🍄","🌞","🌝","🌛","🌜","🌚","🌕","🌔","🌓","🌒","🌑","🌙","🌟","⭐","💫","✨","🪐","☄️","🌤️","⛅","🌥️","🌦️","🌧️","🌩️","🌪️","🌫️","🪸","🪨","🪵"],
  "👤 Personnes": ["👶","🧒","👦","👧","🧑","👱","👨","🧔","👩","🧓","👴","👵","🙍","🙎","🙅","🙆","💁","🙋","🧏","🙇","🤦","🤷","💆","💇","🚶","🧍","🧎","🏃","💃","🕺","👯","🛀","🧖","🛌","👫","👬","👭","💑","💏","👪","👮","🕵️","💂","🥷","👷","🤴","👸","👳","👲","🧕","🤵","👰","🤰","🤱","🎅","🤶","🧙","🧝","🧛","🧟","🧞","🧜","🧚","🧌","👼","👍","👎","👋","🤚","🖐️","✋","🖖","🤙","👈","👉","👆","👇","☝️","✊","👊","🤛","🤜","👏","🙌","🤲","🫶","🤝","🙏","✍️","💅","💪","🫵","🫰","🫱","🫲"]
};

var spCurrentClassicTab = Object.keys(CLASSIC_DATA)[0];
var spMode = 'animated'; // 'animated' | 'classic'

function checkStickerConnectivity() {
  var probe = new Image();
  probe.onload = function() {
    var b = document.getElementById('sp-offline-badge');
    if (b) b.style.display = 'none';
  };
  probe.onerror = function() {
    var b = document.getElementById('sp-offline-badge');
    if (b) b.style.display = 'inline-block';
    if (spMode === 'animated') setStickerMode('classic', true);
  };
  probe.src = NOTO_CDN + '/1f600/512.webp?_t=' + Date.now();
}

function setStickerMode(mode, auto) {
  auto = auto || false;
  spMode = mode;
  var animSection  = document.getElementById('sp-animated-section');
  var classSection = document.getElementById('sp-classic-section');
  var btnAnim  = document.getElementById('sp-mode-animated');
  var btnClass = document.getElementById('sp-mode-classic');
  var search   = document.getElementById('sp-search');
  if (mode === 'animated') {
    if (animSection)  { animSection.style.display  = 'contents'; }
    if (classSection) { classSection.style.display = 'none'; }
    if (btnAnim)  btnAnim.classList.add('active');
    if (btnClass) btnClass.classList.remove('active');
    if (search) search.placeholder = '🔍 Rechercher dans les émojis animés…';
  } else {
    if (animSection)  { animSection.style.display  = 'none'; }
    if (classSection) { classSection.style.display = 'contents'; }
    if (btnAnim)  btnAnim.classList.remove('active');
    if (btnClass) btnClass.classList.add('active');
    if (search) search.placeholder = '🔍 Rechercher dans les émojis classiques…';
    if (!auto) {
      spCurrentClassicTab = Object.keys(CLASSIC_DATA)[0];
      document.querySelectorAll('#sp-classic-tabs .sp-tab')
        .forEach(function(b, i) { b.classList.toggle('active', i === 0); });
    }
  }
  if (search) search.value = '';
  renderStickerPanel();
}

document.addEventListener('DOMContentLoaded', function() {
  var ctabs = document.getElementById('sp-classic-tabs');
  if (!ctabs) return;
  ctabs.addEventListener('click', function(e) {
    var btn = e.target.closest('[data-ctab]');
    if (!btn) return;
    document.querySelectorAll('#sp-classic-tabs .sp-tab')
      .forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    spCurrentClassicTab = btn.dataset.ctab;
    var s = document.getElementById('sp-search');
    if (s) s.value = '';
    renderStickerPanel();
  });
});

var NOTO_CDN = 'https://fonts.gstatic.com/s/e/notoemoji/latest';

var NOTO_DATA = {
  "\ud83d\ude0a Visages & \u00e9motions": [{"c": "1f600", "n": "smile"}, {"c": "1f604", "n": "grin"}, {"c": "1f601", "n": "grinning"}, {"c": "1f606", "n": "laughing"}, {"c": "1f605", "n": "grin sweat"}, {"c": "1f602", "n": "joy"}, {"c": "1f923", "n": "rofl"}, {"c": "1f62d", "n": "loudly crying"}, {"c": "1f609", "n": "wink"}, {"c": "1f61a", "n": "kissing closed eyes"}, {"c": "1f618", "n": "kissing heart"}, {"c": "1f970", "n": "heart face"}, {"c": "1f60d", "n": "heart eyes"}, {"c": "1f929", "n": "star struck"}, {"c": "1f973", "n": "partying face"}, {"c": "1fae0", "n": "melting"}, {"c": "1f643", "n": "upside down face"}, {"c": "1f972", "n": "happy cry"}, {"c": "1f979", "n": "holding back tears"}, {"c": "1f60a", "n": "blush"}, {"c": "1f642_200d_2194_fe0f", "n": "head shake"}, {"c": "1f60f", "n": "smirk"}, {"c": "1f60b", "n": "yum"}, {"c": "1f61b", "n": "stuck out tongue"}, {"c": "1f92a", "n": "zany face"}, {"c": "1f974", "n": "woozy"}, {"c": "1f97a", "n": "pleading"}, {"c": "1f62c", "n": "grimacing"}, {"c": "1f610", "n": "neutral face"}, {"c": "1f636", "n": "mouth none"}, {"c": "1fae5", "n": "dotted line face"}, {"c": "1fae1", "n": "salute"}, {"c": "1f914", "n": "thinking face"}, {"c": "1f92b", "n": "shushing face"}, {"c": "1f917", "n": "hug face"}, {"c": "1fae3", "n": "peeking"}, {"c": "1f631", "n": "screaming"}, {"c": "1f928", "n": "raised eyebrow"}, {"c": "1f644", "n": "rolling eyes"}, {"c": "1f62e_200d_1f4a8", "n": "exhale"}, {"c": "1f620", "n": "angry"}, {"c": "1f621", "n": "rage"}, {"c": "1f92c", "n": "cursing"}, {"c": "1f61e", "n": "sad"}, {"c": "1f622", "n": "cry"}, {"c": "2639_fe0f", "n": "big frown"}, {"c": "1f628", "n": "scared"}, {"c": "1f627", "n": "anguished"}, {"c": "1f626", "n": "gasp"}, {"c": "1f62f", "n": "surprised"}, {"c": "1f633", "n": "flushed"}, {"c": "1f92f", "n": "exploding head"}, {"c": "1f616", "n": "confounded"}, {"c": "1f623", "n": "persevering"}, {"c": "1f629", "n": "weary"}, {"c": "1f62b", "n": "distraught"}, {"c": "1f635", "n": "x eyes"}, {"c": "1f635_200d_1f4ab", "n": "dizzy face"}, {"c": "1fae8", "n": "shaking face"}, {"c": "1f976", "n": "cold face"}, {"c": "1f975", "n": "hot face"}, {"c": "1f922", "n": "nauseated"}, {"c": "1f92e", "n": "vomit"}, {"c": "1fae9", "n": "tired"}, {"c": "1f634", "n": "sleep"}, {"c": "1f927", "n": "sneeze"}, {"c": "1f912", "n": "thermometer face"}, {"c": "1f915", "n": "bandage face"}, {"c": "1f637", "n": "mask"}, {"c": "1f607", "n": "halo"}, {"c": "1f911", "n": "money face"}, {"c": "1f913", "n": "nerd face"}, {"c": "1f60e", "n": "sunglasses face"}, {"c": "1f978", "n": "disguise"}, {"c": "1f921", "n": "clown"}, {"c": "1f4a9", "n": "poop"}, {"c": "1f608", "n": "imp smile"}, {"c": "1f47b", "n": "ghost"}, {"c": "1f480", "n": "skull"}, {"c": "26c4", "n": "snowman"}, {"c": "1f383", "n": "jack o lantern"}, {"c": "1f916", "n": "robot"}, {"c": "1f47d", "n": "alien"}, {"c": "1f47e", "n": "alien monster"}, {"c": "1f31e", "n": "sun with face"}, {"c": "1f31c", "n": "moon face last"}, {"c": "1f63a", "n": "smiley cat"}, {"c": "1f638", "n": "smile cat"}, {"c": "1f63b", "n": "heart eyes cat"}, {"c": "1f648", "n": "see no evil"}, {"c": "1f649", "n": "hear no evil"}, {"c": "1f64a", "n": "speak no evil"}, {"c": "1f31f", "n": "glowing star"}, {"c": "2728", "n": "sparkles"}, {"c": "26a1", "n": "lightning"}, {"c": "1f4a5", "n": "collision"}, {"c": "1f525", "n": "fire"}, {"c": "1f4af", "n": "100"}, {"c": "1f389", "n": "party popper"}, {"c": "2764_fe0f", "n": "red heart"}, {"c": "1f9e1", "n": "orange heart"}, {"c": "1f49b", "n": "yellow heart"}, {"c": "1f49a", "n": "green heart"}, {"c": "1fa75", "n": "light blue heart"}, {"c": "1f499", "n": "blue heart"}, {"c": "1f49c", "n": "purple heart"}, {"c": "1f5a4", "n": "black heart"}, {"c": "1fa76", "n": "grey heart"}, {"c": "1f90d", "n": "white heart"}, {"c": "1fa77", "n": "pink heart"}, {"c": "1f496", "n": "sparkling heart"}, {"c": "1f493", "n": "beating heart"}, {"c": "1f463", "n": "footprints"}, {"c": "1f9a0", "n": "microbe"}, {"c": "1f440", "n": "eyes"}, {"c": "1f441_fe0f", "n": "eye"}, {"c": "1f4aa", "n": "muscle"}, {"c": "1f44f", "n": "clap"}, {"c": "1f44d", "n": "thumbs up"}, {"c": "1f44e", "n": "thumbs down"}, {"c": "1faf6", "n": "heart hands"}, {"c": "1f450", "n": "open hands"}, {"c": "1f91c", "n": "fist right"}, {"c": "1f91b", "n": "fist left"}, {"c": "270a", "n": "raised fist"}, {"c": "1f44a", "n": "fist"}, {"c": "1faf4", "n": "palm up"}, {"c": "1faf1", "n": "hand right"}, {"c": "1faf2", "n": "hand left"}, {"c": "1faf8", "n": "push right"}, {"c": "1faf7", "n": "push left"}, {"c": "1f44b", "n": "wave"}, {"c": "1f590_fe0f", "n": "palm"}, {"c": "1f596", "n": "vulcan"}, {"c": "1f918", "n": "metal"}, {"c": "270c_fe0f", "n": "victory"}, {"c": "1f91e", "n": "crossed fingers"}, {"c": "1faf0", "n": "finger heart"}, {"c": "1f919", "n": "call me"}, {"c": "1f44c", "n": "ok"}, {"c": "1faf5", "n": "pointing"}, {"c": "1f449", "n": "point right"}, {"c": "1f448", "n": "point left"}, {"c": "261d_fe0f", "n": "index finger"}, {"c": "1f446", "n": "point up"}, {"c": "1f447", "n": "point down"}, {"c": "270d_fe0f", "n": "writing hand"}, {"c": "1f933", "n": "selfie"}, {"c": "1f64f", "n": "pray"}, {"c": "1f91d", "n": "handshake"}],
  "\ud83d\udc3e Animaux & nature": [{"c": "1f490", "n": "bouquet"}, {"c": "1f339", "n": "rose"}, {"c": "1f940", "n": "wilted flower"}, {"c": "1f342", "n": "fallen leaf"}, {"c": "1f331", "n": "plant"}, {"c": "1f343", "n": "leaves"}, {"c": "1f340", "n": "four leaf clover"}, {"c": "1fabe", "n": "leafless tree"}, {"c": "2744_fe0f", "n": "snowflake"}, {"c": "1f30b", "n": "volcano"}, {"c": "1f305", "n": "sunrise"}, {"c": "1f304", "n": "sunrise mountains"}, {"c": "1f308", "n": "rainbow"}, {"c": "1fae7", "n": "bubbles"}, {"c": "1f30a", "n": "ocean"}, {"c": "1f32c_fe0f", "n": "wind"}, {"c": "1f32a_fe0f", "n": "tornado"}, {"c": "1f4a7", "n": "droplet"}, {"c": "1f327_fe0f", "n": "rain"}, {"c": "1f329_fe0f", "n": "lightning cloud"}, {"c": "1f30d", "n": "globe europe"}, {"c": "1f30e", "n": "globe americas"}, {"c": "1f30f", "n": "globe asia"}, {"c": "2604_fe0f", "n": "comet"}, {"c": "1f42e", "n": "cow"}, {"c": "1f984", "n": "unicorn"}, {"c": "1f98e", "n": "lizard"}, {"c": "1f409", "n": "dragon"}, {"c": "1f996", "n": "t rex"}, {"c": "1f995", "n": "dinosaur"}, {"c": "1f422", "n": "turtle"}, {"c": "1f40a", "n": "crocodile"}, {"c": "1f40d", "n": "snake"}, {"c": "1f438", "n": "frog"}, {"c": "1f407", "n": "rabbit"}, {"c": "1f400", "n": "rat"}, {"c": "1f429", "n": "poodle"}, {"c": "1f415", "n": "dog"}, {"c": "1f416", "n": "pig"}, {"c": "1f40e", "n": "horse"}, {"c": "1facf", "n": "donkey"}, {"c": "1f402", "n": "ox"}, {"c": "1f410", "n": "goat"}, {"c": "1f998", "n": "kangaroo"}, {"c": "1f405", "n": "tiger"}, {"c": "1f412", "n": "monkey"}, {"c": "1f98d", "n": "gorilla"}, {"c": "1f9a7", "n": "orangutan"}, {"c": "1f43f_fe0f", "n": "chipmunk"}, {"c": "1f9a6", "n": "otter"}, {"c": "1f987", "n": "bat"}, {"c": "1f426", "n": "bird"}, {"c": "1f426_200d_2b1b", "n": "black bird"}, {"c": "1f413", "n": "rooster"}, {"c": "1f423", "n": "hatching chick"}, {"c": "1f424", "n": "baby chick"}, {"c": "1f425", "n": "hatched chick"}, {"c": "1f985", "n": "eagle"}, {"c": "1f989", "n": "owl"}, {"c": "1f54a_fe0f", "n": "dove"}, {"c": "1fabf", "n": "goose"}, {"c": "1f99a", "n": "peacock"}, {"c": "1f426_200d_1f525", "n": "phoenix"}, {"c": "1f9ad", "n": "seal"}, {"c": "1f988", "n": "shark"}, {"c": "1f42c", "n": "dolphin"}, {"c": "1f433", "n": "whale"}, {"c": "1f41f", "n": "fish"}, {"c": "1f421", "n": "blowfish"}, {"c": "1f99e", "n": "lobster"}, {"c": "1f980", "n": "crab"}, {"c": "1f419", "n": "octopus"}, {"c": "1fabc", "n": "jellyfish"}, {"c": "1f982", "n": "scorpion"}, {"c": "1f577_fe0f", "n": "spider"}, {"c": "1f40c", "n": "snail"}, {"c": "1f41c", "n": "ant"}, {"c": "1f99f", "n": "mosquito"}, {"c": "1fab3", "n": "cockroach"}, {"c": "1fab0", "n": "fly"}, {"c": "1f41d", "n": "bee"}, {"c": "1f41e", "n": "ladybug"}, {"c": "1f98b", "n": "butterfly"}, {"c": "1f41b", "n": "bug"}, {"c": "1fab1", "n": "worm"}, {"c": "1f43e", "n": "paw prints"}],
  "\ud83c\udf55 Nourriture": [{"c": "1f345", "n": "tomato"}, {"c": "1fadc", "n": "root vegetable"}, {"c": "1f373", "n": "cooking"}, {"c": "1f32f", "n": "burrito"}, {"c": "1f35d", "n": "spaghetti"}, {"c": "1f35c", "n": "steaming bowl"}, {"c": "1f37f", "n": "popcorn"}, {"c": "2615", "n": "hot beverage"}, {"c": "1f37b", "n": "beer mugs"}, {"c": "1f942", "n": "clinking glasses"}, {"c": "1f37e", "n": "champagne"}, {"c": "1f377", "n": "wine glass"}, {"c": "1fad7", "n": "pour"}, {"c": "1f379", "n": "tropical drink"}],
  "\ud83d\ude80 Voyages": [{"c": "1f6a7", "n": "construction"}, {"c": "1f6a8", "n": "police light"}, {"c": "1f6b2", "n": "bicycle"}, {"c": "1f697", "n": "car"}, {"c": "1f3ce_fe0f", "n": "racing car"}, {"c": "1f695", "n": "taxi"}, {"c": "1f68c", "n": "bus"}, {"c": "26f5", "n": "sailboat"}, {"c": "1f6f6", "n": "canoe"}, {"c": "1f6f8", "n": "flying saucer"}, {"c": "1f680", "n": "rocket"}, {"c": "1f6eb", "n": "airplane departure"}, {"c": "1f6ec", "n": "airplane arrival"}, {"c": "1f3a2", "n": "roller coaster"}, {"c": "1f3a1", "n": "ferris wheel"}, {"c": "1f3d5_fe0f", "n": "camping"}],
  "\ud83c\udf89 Activit\u00e9s": [{"c": "1f388", "n": "balloon"}, {"c": "1f382", "n": "birthday cake"}, {"c": "1f381", "n": "gift"}, {"c": "1f386", "n": "fireworks"}, {"c": "1fa85", "n": "pinata"}, {"c": "1faa9", "n": "disco ball"}, {"c": "1f947", "n": "gold medal"}, {"c": "1f948", "n": "silver medal"}, {"c": "1f949", "n": "bronze medal"}, {"c": "1f3c6", "n": "trophy"}, {"c": "26bd", "n": "soccer"}, {"c": "26be", "n": "baseball"}, {"c": "1f94e", "n": "softball"}, {"c": "1f3be", "n": "tennis"}, {"c": "1f3f8", "n": "badminton"}, {"c": "1f94d", "n": "lacrosse"}, {"c": "1f3cf", "n": "cricket"}, {"c": "1f3d1", "n": "field hockey"}, {"c": "1f3d2", "n": "ice hockey"}, {"c": "26f8_fe0f", "n": "ice skate"}, {"c": "1f6fc", "n": "roller skates"}, {"c": "1fa70", "n": "ballet shoes"}, {"c": "1f6f9", "n": "skateboard"}, {"c": "26f3", "n": "golf"}, {"c": "1f3af", "n": "target"}, {"c": "1f94f", "n": "flying disc"}, {"c": "1fa83", "n": "boomerang"}, {"c": "1fa81", "n": "kite"}, {"c": "1f3a3", "n": "fishing"}, {"c": "1f94b", "n": "martial arts"}, {"c": "1f3b1", "n": "8 ball"}, {"c": "1f3d3", "n": "ping pong"}, {"c": "1f3b3", "n": "bowling"}, {"c": "1f3b2", "n": "die"}, {"c": "1f3b0", "n": "slot machine"}, {"c": "1fa84", "n": "wand"}, {"c": "1f4f8", "n": "camera flash"}, {"c": "1fadf", "n": "splatter"}, {"c": "1f3b7", "n": "saxophone"}, {"c": "1f3ba", "n": "trumpet"}, {"c": "1f3bb", "n": "violin"}, {"c": "1fa89", "n": "harp"}, {"c": "1f941", "n": "drum"}, {"c": "1fa87", "n": "maracas"}, {"c": "1f3ac", "n": "clapper"}],
  "\ud83d\udca1 Objets": [{"c": "1f50b", "n": "battery"}, {"c": "1faab", "n": "battery low"}, {"c": "1fa99", "n": "coin"}, {"c": "1f4b8", "n": "money wings"}, {"c": "1f48e", "n": "gem"}, {"c": "2696_fe0f", "n": "balance scale"}, {"c": "1f4a1", "n": "light bulb"}, {"c": "1f393", "n": "graduation cap"}, {"c": "1f48d", "n": "ring"}, {"c": "1faad", "n": "fan"}, {"c": "2602_fe0f", "n": "umbrella"}, {"c": "1fa8f", "n": "shovel"}, {"c": "2699_fe0f", "n": "gear"}, {"c": "26d3_fe0f_200d_1f4a5", "n": "broken chain"}, {"c": "270f_fe0f", "n": "pencil"}, {"c": "23f0", "n": "alarm clock"}, {"c": "1f6ce_fe0f", "n": "bellhop"}, {"c": "1f514", "n": "bell"}, {"c": "1f52e", "n": "crystal ball"}, {"c": "1f4a3", "n": "bomb"}, {"c": "1faa4", "n": "mousetrap"}, {"c": "1f512", "n": "locked"}],
  "\ud83d\udd23 Symboles": [{"c": "2648", "n": "aries"}, {"c": "2649", "n": "taurus"}, {"c": "264a", "n": "gemini"}, {"c": "264b", "n": "cancer"}, {"c": "264c", "n": "leo"}, {"c": "264d", "n": "virgo"}, {"c": "264e", "n": "libra"}, {"c": "264f", "n": "scorpio"}, {"c": "2650", "n": "sagittarius"}, {"c": "2651", "n": "capricorn"}, {"c": "2652", "n": "aquarius"}, {"c": "2653", "n": "pisces"}, {"c": "26ce", "n": "ophiuchus"}, {"c": "2757", "n": "exclamation"}, {"c": "2753", "n": "question"}, {"c": "2049_fe0f", "n": "interrobang"}, {"c": "203c_fe0f", "n": "double exclamation"}, {"c": "274c", "n": "cross"}, {"c": "1f198", "n": "sos"}, {"c": "1f4f4", "n": "phone off"}, {"c": "2622_fe0f", "n": "radioactive"}, {"c": "2623_fe0f", "n": "biohazard"}, {"c": "26a0_fe0f", "n": "warning"}, {"c": "2705", "n": "check"}, {"c": "1f195", "n": "new"}, {"c": "1f193", "n": "free"}, {"c": "1f199", "n": "up"}, {"c": "1f192", "n": "cool"}, {"c": "1f6ae", "n": "litter"}, {"c": "262e_fe0f", "n": "peace"}, {"c": "262f_fe0f", "n": "yin yang"}, {"c": "267e_fe0f", "n": "infinity"}, {"c": "1f3b6", "n": "musical notes"}, {"c": "2795", "n": "plus"}],
  "\ud83c\udff3\ufe0f Drapeaux": [{"c": "1f3c1", "n": "chequered flag"}, {"c": "1f6a9", "n": "triangular flag"}, {"c": "1f3f4", "n": "black flag"}, {"c": "1f3f3_fe0f", "n": "white flag"}],
};
// Total: 442 emojis, 9 catégories

var spCurrentTab = Object.keys(NOTO_DATA)[0];

// Init des onglets
document.getElementById('sp-tabs').addEventListener('click', (e) => {
	const btn = e.target.closest('.sp-tab');
	if (!btn) return;
	document.querySelectorAll('.sp-tab').forEach(b => b.classList.remove('active'));
	btn.classList.add('active');
	spCurrentTab = btn.dataset.tab;
	document.getElementById('sp-search').value = '';
	renderStickerPanel();
});

function toggleStickerPanel() {
  if (typeof stopDrawing === 'function') stopDrawing();
  if (typeof stopEraserMode === 'function') stopEraserMode();
  if (typeof closeMainMenu === 'function') closeMainMenu();
	const panel = document.getElementById('sticker-panel');
	const btn   = document.getElementById('sticker-btn');
	const tab   = document.getElementById('sticker-panel-tab');
	const open  = panel.classList.toggle('active');
	if (btn) btn.classList.toggle('active-tool', open);
	if (tab) tab.classList.toggle('active', open);
	if (open) {
		// Fermer le panneau images s'il est ouvert
		if (typeof closeImagePanel === 'function') closeImagePanel();
		document.getElementById('tools-menu') && document.getElementById('tools-menu').classList.remove('active');
		document.getElementById('shape-toolbar') && document.getElementById('shape-toolbar').classList.remove('active');
		document.getElementById('bg-submenu') && document.getElementById('bg-submenu').classList.remove('active');
		const sm = document.getElementById('scenes-menu');
		if (sm) sm.style.display = 'none';
		checkStickerConnectivity();
		renderStickerPanel();
	}
}

// ── Resize du panneau stickers ────────────────────────────────────────
(function() {
    const SP_W_KEY = 'sticker-panel-w';
    document.addEventListener('DOMContentLoaded', function() {
        const handle = document.getElementById('sticker-panel-resize-handle');
        const panel  = document.getElementById('sticker-panel');
        const tab    = document.getElementById('sticker-panel-tab');
        if (!handle || !panel) return;

        const savedW = localStorage.getItem(SP_W_KEY);
        const initW = savedW ? parseInt(savedW) : Math.round(window.innerWidth * 0.5);
        panel.style.width = initW + 'px';
        document.documentElement.style.setProperty('--sticker-panel-w', initW + 'px');

        let dragging = false, startX = 0, startW = 0;
        handle.addEventListener('mousedown', function(e) {
            dragging = true; startX = e.clientX; startW = panel.offsetWidth;
            panel.classList.add('sticker-panel-resizing');
            if (tab) tab.classList.add('sticker-panel-resizing');
            document.body.style.cursor = 'ew-resize';
            e.preventDefault();
        });
        document.addEventListener('mousemove', function(e) {
            if (!dragging) return;
            const maxW = Math.round(window.innerWidth * 0.5);
            const w = Math.max(260, Math.min(maxW, startW + e.clientX - startX));
            panel.style.width = w + 'px';
            document.documentElement.style.setProperty('--sticker-panel-w', w + 'px');
        });
        document.addEventListener('mouseup', function() {
            if (!dragging) return;
            dragging = false;
            panel.classList.remove('sticker-panel-resizing');
            if (tab) tab.classList.remove('sticker-panel-resizing');
            document.body.style.cursor = '';
            localStorage.setItem(SP_W_KEY, panel.offsetWidth);
        });
    });
})();

function renderStickerPanel() {
	const container = document.getElementById('sp-content');
	if (!container) return;
	const filter = (document.getElementById('sp-search') || {value:''}).value.trim().toLowerCase();

	if (spMode === 'classic') {
		// ── Émojis classiques Unicode (hors-ligne) ──────────────
		const allItems = CLASSIC_DATA[spCurrentClassicTab] || [];
		const items = filter
			? Object.values(CLASSIC_DATA).flat().filter(emoji => {
				const notoAll = Object.values(NOTO_DATA).flat();
				const cp = [...emoji].map(c => c.codePointAt(0).toString(16))
				           .join('_').replace(/_fe0f/gi, '');
				const match = notoAll.find(n => {
					const nc = n.c.replace(/_fe0f/gi, '');
					return nc === cp
						|| nc.startsWith(cp.split('_')[0])
						|| cp.startsWith(nc.split('_')[0]);
				});
				return match ? match.n.toLowerCase().includes(filter) : false;
			  })
			: allItems;
		if (!items.length) {
			container.innerHTML = '<div class="sp-empty">Aucun résultat</div>';
			return;
		}
		const grid = document.createElement('div');
		grid.className = 'sp-grid-anim';
		items.forEach(emoji => {
			const btn = document.createElement('div');
			btn.className = 'sp-anim-btn';
			btn.title = emoji;
			btn.style.fontSize = '28px';
			btn.style.lineHeight = '1';
			btn.textContent = emoji;
			btn.addEventListener('click', () => insertStickerEmoji(emoji));
			grid.appendChild(btn);
		});
		container.innerHTML = '';
		if (filter) {
			const hint = document.createElement('div');
			hint.style.cssText = 'color:#555;font-size:10px;text-align:center;padding:0 0 8px;font-style:italic;';
			hint.textContent = items.length + ' résultat(s) dans toutes les catégories';
			container.appendChild(hint);
		}
		container.appendChild(grid);

	} else {
		// ── Émojis animés Noto (CDN WebP) ────────────────────────
		const tab      = spCurrentTab;
		const allItems = NOTO_DATA[tab] || [];
		const items = filter
			? Object.values(NOTO_DATA).flat().filter(i => i.n.toLowerCase().includes(filter))
			: allItems;
		if (!items.length) {
			container.innerHTML = '<div class="sp-empty">Aucun résultat</div>';
			return;
		}
		const grid = document.createElement('div');
		grid.className = 'sp-grid-anim';
		items.forEach(item => {
			const webpUrl = NOTO_CDN + '/' + item.c + '/512.webp';
			const pngUrl  = NOTO_CDN + '/' + item.c + '/512.png';
			const btn = document.createElement('div');
			btn.className = 'sp-anim-btn';
			btn.title = item.n;
			const img = document.createElement('img');
			img.src = pngUrl;
			img.alt = item.n;
			img.loading = 'lazy';
			img.onerror = () => { btn.style.display = 'none'; };
			btn.appendChild(img);
			btn.addEventListener('click', () => insertStickerImage(webpUrl, item.n));
			grid.appendChild(btn);
		});
		container.innerHTML = '';
		if (filter) {
			const hint = document.createElement('div');
			hint.style.cssText = 'color:#555;font-size:10px;text-align:center;padding:0 0 8px;font-style:italic;';
			hint.textContent = items.length + ' résultat(s) dans toutes les catégories';
			container.appendChild(hint);
		}
		container.appendChild(grid);
	}
}

function _addStickerResizeHandle(w, minSize) {
	const handle = document.createElement('div');
	handle.title = 'Redimensionner';
	handle.style.cssText = `
		position:absolute; right:0; bottom:0; width:18px; height:18px;
		cursor:se-resize; z-index:200; border-radius:0 0 6px 0;
		background:linear-gradient(135deg, transparent 50%, #4a90e2 50%);
		opacity:0; transition:opacity 0.2s; pointer-events:auto;
	`;
	w.appendChild(handle);

	// Afficher/masquer au survol ou focus
	w.addEventListener('mouseenter', () => handle.style.opacity = '1');
	w.addEventListener('mouseleave', () => { if (!w.matches(':focus-within')) handle.style.opacity = '0'; });
	w.addEventListener('focusin',    () => handle.style.opacity = '1');
	w.addEventListener('focusout',   () => { if (!w.matches(':hover')) handle.style.opacity = '0'; });

	handle.addEventListener('mousedown', (e) => {
		e.preventDefault();
		e.stopPropagation();
		snapshotNow();
		const startX = e.clientX, startY = e.clientY;
		const startW = w.offsetWidth,  startH = w.offsetHeight;
		const aspectRatio = startW / startH;
		const startDiag = Math.sqrt(startW * startW + startH * startH);
		const onMove = (ev) => {
			const dx = ev.clientX - startX;
			const dy = ev.clientY - startY;
			const proj = (dx * startW + dy * startH) / startDiag;
			const scale = Math.max(minSize / startW, (startDiag + proj) / startDiag);
			const newW = Math.round(startW * scale);
			const newH = Math.round(startH * scale);
			w.style.width  = newW + 'px';
			w.style.height = newH + 'px';
			w.style.setProperty('--sticker-h', newH + 'px');
			const content = w.querySelector('[data-sticker-type="emoji"]');
			if (content) {
				content.style.width    = newW + 'px';
				content.style.height   = newH + 'px';
				content.style.fontSize = Math.round(newW * 0.62) + 'px';
			}
		};
		const onUp = () => {
			document.removeEventListener('mousemove', onMove);
			document.removeEventListener('mouseup', onUp);
			saveBoard();
		};
		document.addEventListener('mousemove', onMove);
		document.addEventListener('mouseup', onUp);
	});
	handle.addEventListener('touchstart', (e) => {
		e.preventDefault();
		e.stopPropagation();
		snapshotNow();
		const t0 = e.touches[0];
		const startX = t0.clientX, startY = t0.clientY;
		const startW = w.offsetWidth, startH = w.offsetHeight;
		const startDiag = Math.sqrt(startW * startW + startH * startH);
		function onMove(ev) {
			const t = ev.touches[0];
			const dx = t.clientX - startX;
			const dy = t.clientY - startY;
			const proj = (dx * startW + dy * startH) / startDiag;
			const scale = Math.max(minSize / startW, (startDiag + proj) / startDiag);
			const newW = Math.round(startW * scale);
			const newH = Math.round(startH * scale);
			w.style.width  = newW + 'px';
			w.style.height = newH + 'px';
			w.style.setProperty('--sticker-h', newH + 'px');
			const content = w.querySelector('[data-sticker-type="emoji"]');
			if (content) {
				content.style.width    = newW + 'px';
				content.style.height   = newH + 'px';
				content.style.fontSize = Math.round(newW * 0.62) + 'px';
			}
		}
		function onEnd() {
			document.removeEventListener('touchmove', onMove);
			document.removeEventListener('touchend',  onEnd);
			saveBoard();
		}
		document.addEventListener('touchmove', onMove, { passive: false });
		document.addEventListener('touchend',  onEnd);
	}, { passive: false });
}

function insertStickerEmoji(emoji) {
	snapshotNow();
	const pos = findFreePosition(100, 100);
	const w = document.createElement('div');
	w.className = 'widget';
	w.dataset.type = 'sticker';
	w.dataset.transparent = 'true';
	// min-height:0 et height explicite pour contrer le height:auto du CSS global
	w.style.cssText = `left:${pos.x}px; top:${pos.y}px; width:100px; height:100px; min-height:0 !important; overflow:visible; flex-direction:row; flex-shrink:0;`;
	w.style.setProperty('--sticker-h', '100px');
	w.tabIndex = 0;

	const content = document.createElement('div');
	content.dataset.stickerType = 'emoji';
	// position absolute, taille 100%x100% du widget, font-size proportionnelle
	content.style.cssText = 'position:absolute; top:0; left:0; width:100px; height:100px; display:flex; align-items:center; justify-content:center; font-size:62px; line-height:1; user-select:none; pointer-events:none;';
	content.textContent = emoji;

	w.innerHTML = `
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
	w.dataset.stickerWidget = 'true';
	w.appendChild(content);
	w.addEventListener('mousedown', () => {
		bringToFront(w);
		w.focus();
		if (typeof positionActionBar === 'function') positionActionBar(w);
	});
	board.appendChild(w);
	bringToFront(w);
	makeDraggable(w);
	makeDraggableRotate(w);
	_addStickerResizeHandle(w, 40);
	saveBoard();
}

function insertStickerImage(url, name) {
	snapshotNow();
	const pos = findFreePosition(130, 130);
	const w = document.createElement('div');
	w.className = 'widget';
	w.dataset.type = 'sticker';
	w.dataset.transparent = 'true';
	// Forcer height explicite et overflow hidden pour que le redimensionnement fonctionne
	w.style.cssText = `left:${pos.x}px; top:${pos.y}px; width:130px; height:130px; overflow:visible; flex-direction:row;`;
	w.style.setProperty('--sticker-h', '130px');
	w.tabIndex = 0;

	// L'image occupe tout l'espace du widget directement, sans widget-content qui flex-grow
	const img = document.createElement('img');
	img.src = url;
	img.alt = name;
	img.draggable = false;
	img.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; object-fit:contain; pointer-events:none; padding:6px; box-sizing:border-box;';

	w.innerHTML = `
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
	w.dataset.stickerWidget = 'true';
	w.appendChild(img);
	w.addEventListener('mousedown', () => {
		bringToFront(w);
		w.focus();
		if (typeof positionActionBar === 'function') positionActionBar(w);
	});
	board.appendChild(w);
	bringToFront(w);
	makeDraggable(w);
	makeDraggableRotate(w);
	_addStickerResizeHandle(w, 40);
	saveBoard();
}

// Fermer au clic extérieur
document.addEventListener('mousedown', (e) => {
	const sp = document.getElementById('sticker-panel');
	if (!sp || !sp.classList.contains('active')) return;
	if (sp.contains(e.target)) return;
	if (e.target.closest('#sticker-btn')) return;
	if (e.target.closest('#sticker-panel-tab')) return;
	sp.classList.remove('active');
	const sb = document.getElementById('sticker-btn');
	if (sb) sb.classList.remove('active-tool');
	const tab = document.getElementById('sticker-panel-tab');
	if (tab) tab.classList.remove('active');
});

// ── Menu contextuel clic droit sur stickers ───────────────────────────────
let _stickerCtxMenu = null;

function _closeStickerContextMenu() {
	if (_stickerCtxMenu) { _stickerCtxMenu.remove(); _stickerCtxMenu = null; }
}

function _openStickerContextMenu(widget, clientX, clientY) {
	_closeStickerContextMenu();

	const isPinned = widget.dataset.pinned === 'true';

	const menu = document.createElement('div');
	menu.className = 'img-ctx-menu';
	_stickerCtxMenu = menu;

	const items = [
		{
			icon: '📌',
			label: isPinned ? 'Désépingler' : 'Épingler',
			action: () => { togglePin(widget); }
		},
		{
			icon: '🔽',
			label: 'Envoyer derrière',
			action: () => { sendToBack(widget); }
		},
		{ separator: true },
		{
			icon: '⧉',
			label: 'Dupliquer',
			action: () => { cloneWidget(widget); }
		},
		{ separator: true },
		{
			icon: '×',
			label: 'Supprimer',
			danger: true,
			action: () => { snapshotNow(); widget.remove(); saveBoard(); }
		},
	];

	items.forEach(item => {
		if (item.separator) {
			const sep = document.createElement('div');
			sep.className = 'img-ctx-menu-sep';
			menu.appendChild(sep);
			return;
		}
		const btn = document.createElement('div');
		btn.className = 'img-ctx-menu-item' + (item.danger ? ' danger' : '');
		btn.innerHTML = '<span class="img-ctx-menu-icon">' + item.icon + '</span><span>' + item.label + '</span>';
		btn.addEventListener('click', (e) => {
			e.stopPropagation();
			_closeStickerContextMenu();
			item.action();
		});
		menu.appendChild(btn);
	});

	document.body.appendChild(menu);

	const mw = 190, mh = menu.offsetHeight || 180;
	let x = clientX + 4, y = clientY + 4;
	if (x + mw > window.innerWidth)  x = clientX - mw - 4;
	if (y + mh > window.innerHeight) y = clientY - mh - 4;
	menu.style.left = x + 'px';
	menu.style.top  = y + 'px';

	setTimeout(() => {
		function onOut(e) {
			if (menu.contains(e.target)) return;
			_closeStickerContextMenu();
			document.removeEventListener('mousedown', onOut);
			document.removeEventListener('keydown', onKey);
		}
		function onKey(e) {
			if (e.key === 'Escape') {
				_closeStickerContextMenu();
				document.removeEventListener('mousedown', onOut);
				document.removeEventListener('keydown', onKey);
			}
		}
		document.addEventListener('mousedown', onOut);
		document.addEventListener('keydown', onKey);
	}, 10);
}

// Listener global en capture — s'exécute avant _boardDrawContextMenu
document.addEventListener('contextmenu', (e) => {
	const widget = e.target && e.target.closest
		? e.target.closest('.widget[data-sticker-widget="true"]')
		: null;
	if (!widget) return;
	if (typeof isDrawMode !== 'undefined' && (isDrawMode || isEraserMode)) return;

	e.preventDefault();
	e.stopPropagation();
	e.stopImmediatePropagation();

	_openStickerContextMenu(widget, e.clientX, e.clientY);
}, true);
