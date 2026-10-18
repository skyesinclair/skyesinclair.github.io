/*!
 * worDrop embed v1
 * Drop into any page:
 *   <div data-wordrop></div>
 *   <script src="/path/to/wordrop/wordrop.js" defer></script>
 * words.js and defs.js must sit next to wordrop.js (or set data-assets="/other/path/" on the div).
 * Options on the div: data-theme="light|dark" (default follows the visitor's system), data-max-height="800" (px), data-fonts="off",
 *   data-viewport-height="900" (px; size against this instead of the window height, used by the auto-sizing iframe page).
 * Definitions: Open English WordNet (CC BY 4.0) https://en-word.net/ — keep the credit line visible.
 */
(function () {
  'use strict';
  var SCRIPT = document.currentScript;
  var BASE = SCRIPT && SCRIPT.src ? SCRIPT.src.replace(/[^\/]*$/, '') : '';

  // ---------- shared data loading ----------
  var loaders = {};
  function loadScript(url, globalName) {
    if (window[globalName]) return Promise.resolve(window[globalName]);
    if (loaders[url]) return loaders[url];
    loaders[url] = new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = url; s.async = true;
      s.onload = function () { window[globalName] ? res(window[globalName]) : rej(new Error(url + ' loaded but did not define ' + globalName)); };
      s.onerror = function () { rej(new Error('Could not load ' + url)); };
      document.head.appendChild(s);
    });
    return loaders[url];
  }
  function loadFonts() {
    if (document.querySelector('link[data-wordrop-fonts]')) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet'; l.setAttribute('data-wordrop-fonts', '');
    l.href = 'https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=Chivo:wght@400;600;800&family=Chivo+Mono:wght@500;700&display=swap';
    document.head.appendChild(l);
  }

  var CSS = `
:host { display:block; }
.wd {
  --bg:#E3E7ED; --panel:#F4F6F9; --fg:#17212C; --muted:#5A6777; --line:#CAD2DC;
  --accent:#2E56C8; --accent-fg:#FFFFFF; --well:#1B2633; --well-line:#243244;
  --tile:#ECD3A2; --tile-hi:#F8E8C8; --tile-lo:#B48A52; --ink:#231C14;
  --hit:#F4C430; --danger:#D9483B; --ghost:#8FA6C4;
  --f-display:"Alfa Slab One", Rockwell, "Roboto Slab", Georgia, serif;
  --f-body:"Chivo", system-ui, -apple-system, "Segoe UI", sans-serif;
  --f-mono:"Chivo Mono", ui-monospace, "Cascadia Mono", Consolas, monospace;
  color-scheme:light;
}
@media (prefers-color-scheme: dark) { :host(:not([data-theme="light"])) .wd {
  --bg:#0E141C; --panel:#151E29; --fg:#DCE4EE; --muted:#8C9AAC; --line:#26344A; --accent:#86A6FF; --accent-fg:#0E141C;
  --well:#090E14; --well-line:#16202C; --tile:#DFC292; --tile-hi:#EED8AF; --tile-lo:#987140; --ink:#1E1710;
  --hit:#F4C430; --danger:#FF6B5E; --ghost:#5C7395; color-scheme:dark } }
:host([data-theme="dark"]) .wd {
  --bg:#0E141C; --panel:#151E29; --fg:#DCE4EE; --muted:#8C9AAC; --line:#26344A; --accent:#86A6FF; --accent-fg:#0E141C;
  --well:#090E14; --well-line:#16202C; --tile:#DFC292; --tile-hi:#EED8AF; --tile-lo:#987140; --ink:#1E1710;
  --hit:#F4C430; --danger:#FF6B5E; --ghost:#5C7395; color-scheme:dark }

.wd, .wd *, .wd *::before, .wd *::after { box-sizing:border-box; }
.wd { container-type:inline-size; background:var(--bg); color:var(--fg); font-family:var(--f-body); font-size:15px; line-height:1.45;
  text-align:left; letter-spacing:normal; border-radius:12px; padding:14px 16px; -webkit-tap-highlight-color:transparent; outline:none; }
.wd:focus-visible { box-shadow:0 0 0 2px var(--accent); }
.wd p, .wd h1, .wd h2, .wd ul { margin:0; padding:0; }
.game { display:flex; flex-direction:column; gap:14px; max-width:1040px; margin:0 auto; }

.top { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }
.logo { font-family:var(--f-display); font-size:30px; letter-spacing:.01em; line-height:1; display:flex; align-items:center; gap:2px; font-weight:400; }
.logo .d { display:inline-grid; place-items:center; width:1.15em; height:1.15em; background:var(--tile); color:var(--ink);
  border-radius:4px; box-shadow:inset 2px 2px 0 var(--tile-hi), inset -2px -2px 0 var(--tile-lo); margin:0 2px; transform:translateY(3px) rotate(-4deg); }
.top-actions { display:flex; gap:8px; }
.btn { font:600 13px var(--f-body); letter-spacing:.04em; text-transform:uppercase; border:1px solid var(--line); background:var(--panel); color:var(--fg);
  padding:8px 12px; border-radius:6px; cursor:pointer; }
.btn:hover { border-color:var(--muted); }
.btn:disabled { opacity:.6; cursor:default; }
.btn:focus-visible, .pad button:focus-visible { outline:2px solid var(--accent); outline-offset:2px; }
.btn.primary { background:var(--accent); color:var(--accent-fg); border-color:var(--accent); font-size:15px; padding:12px 22px; }

.stage { display:grid; grid-template-columns:200px auto 220px; grid-template-areas:"left well right"; gap:20px; justify-content:center; align-items:start; }
.side { display:flex; flex-direction:column; gap:14px; min-width:0; }
.left { grid-area:left; } .right { grid-area:right; } .well-wrap { grid-area:well; }
.box { background:var(--panel); border:1px solid var(--line); border-radius:8px; padding:12px; min-width:0; }
.wd .label { font:600 11px var(--f-body); text-transform:uppercase; letter-spacing:.12em; color:var(--muted); margin:0 0 8px; }
.mini { display:block; }
.stats { display:grid; grid-template-columns:1fr 1fr; gap:10px 12px; }
.stat .v { font:700 22px var(--f-mono); font-variant-numeric:tabular-nums; line-height:1.1; }
.stat.wide { grid-column:1 / -1; }
.stat.wide .v { font-size:30px; }
.chain { color:var(--accent); }

.words { list-style:none; display:flex; flex-direction:column; gap:4px; max-height:240px; overflow:auto; }
.words li { font:500 13px var(--f-mono); font-variant-numeric:tabular-nums; }
.words li b { font-family:var(--f-display); font-weight:400; letter-spacing:.06em; font-size:14px; }
.words li span { color:var(--muted); }
.words .empty { color:var(--muted); font-family:var(--f-body); }
.wbtn { all:unset; cursor:pointer; display:flex; justify-content:space-between; gap:8px; width:100%; border-radius:4px; padding:1px 4px; margin:0 -4px; }
.wbtn:hover, .wbtn[aria-current="true"] { background:color-mix(in srgb, var(--accent) 14%, transparent); }
.wbtn:focus-visible { outline:2px solid var(--accent); }
.def-box { min-height:150px; display:flex; flex-direction:column; }
.def-body { flex:1; min-width:0; overflow-wrap:anywhere; }
.wd .def-word { font-family:var(--f-display); font-size:20px; letter-spacing:.05em; line-height:1.1; margin:0 0 2px; }
.wd .def-form { font:500 12px var(--f-body); color:var(--muted); margin:0 0 6px; }
.def-form b { color:var(--fg); font-weight:600; }
.wd .def-sense { margin:6px 0 0; font-size:13.5px; line-height:1.4; text-wrap:pretty; }
.def-sense .pos { font:italic 600 12px var(--f-body); color:var(--accent); margin-right:6px; }
.def-hint { color:var(--muted); font-size:13px; }
.wd .credit { margin:10px 0 0; font-size:10.5px; color:var(--muted); }
.credit a { color:inherit; }
.keys { font-size:13px; color:var(--muted); display:grid; grid-template-columns:auto 1fr; gap:3px 10px; }
.keys kbd { font:600 11px var(--f-mono); color:var(--fg); background:var(--bg); border:1px solid var(--line); border-radius:4px; padding:1px 5px; justify-self:start; }

.well-wrap { position:relative; border-radius:10px; padding:8px; background:var(--tile-lo);
  box-shadow:inset 0 0 0 2px color-mix(in srgb, var(--tile-lo) 70%, black), 0 10px 30px -12px color-mix(in srgb, var(--fg) 45%, transparent); }
.board { display:block; border-radius:4px; background:var(--well); touch-action:none; }
.overlay { position:absolute; inset:8px; border-radius:4px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; text-align:center;
  padding:20px; background:color-mix(in srgb, var(--well) 84%, transparent); color:#E8EEF5; backdrop-filter:blur(2px); }
.overlay[hidden] { display:none; }
.overlay h2 { font-family:var(--f-display); font-weight:400; font-size:30px; text-wrap:balance; line-height:1.1; }
.overlay p { max-width:30ch; font-size:14px; color:#C3CEDB; text-wrap:pretty; }
.overlay .big { font:700 34px var(--f-mono); color:var(--hit); }
.overlay .small { font-size:12px; color:#93A3B6; }
.pops { position:absolute; inset:8px; pointer-events:none; overflow:hidden; }
.pop { position:absolute; transform:translate(-50%, -50%); font-family:var(--f-display); color:var(--hit); font-size:20px; white-space:nowrap;
  text-shadow:0 2px 0 rgba(0,0,0,.55); animation:wdrise 1.25s ease-out forwards; }
.pop small { font:700 13px var(--f-mono); color:#fff; margin-left:6px; }
@keyframes wdrise { 0% { opacity:0; transform:translate(-50%,-30%) scale(.8);} 15% { opacity:1; transform:translate(-50%,-50%) scale(1.08);} 100% { opacity:0; transform:translate(-50%,-160%) scale(1);} }

.pad { display:none; grid-template-columns:repeat(6, 1fr); gap:8px; max-width:520px; width:100%; margin:0 auto; }
.pad button { font:700 12px var(--f-body); letter-spacing:.03em; text-transform:uppercase; padding:12px 2px; border-radius:8px; border:1px solid var(--line);
  background:var(--panel); color:var(--fg); touch-action:manipulation; user-select:none; -webkit-user-select:none; cursor:pointer; }
.pad button:active { background:var(--accent); color:var(--accent-fg); }
.pad .glyph { font-size:20px; line-height:1; display:block; margin-bottom:2px; }

@media (hover:none) { .pad { display:grid; } .keys-box { display:none; } }
@container (max-width:760px) {
  .pad { display:grid; } .keys-box { display:none; }
  .game { gap:10px; }
  .logo { font-size:24px; }
  .stage { grid-template-columns:1fr auto; grid-template-areas:"left next" "well well" "def def"; gap:10px; }
  .well-wrap { justify-self:center; }
  .side { gap:8px; flex-direction:row; }
  .right { display:contents; }
  .next-box { grid-area:next; }
  .def-box { grid-area:def; min-height:0; height:104px; overflow:auto; padding:8px 10px; }
  .def-box > .label { display:none; }
  .wd .def-word { font-size:16px; }
  .wd .def-sense { font-size:13px; margin-top:3px; }
  .wd .credit { margin-top:4px; }
  .words-box { display:none; }
  .box { padding:8px; }
  .hold-box, .next-box { flex:0 0 auto; }
  .stats { gap:2px 8px; flex:1; }
  .stat .label { margin-bottom:2px; }
  .stat .v { font-size:15px; } .stat.wide .v { font-size:18px; }
  .stat.best { display:none; }
}
@container (max-width:420px) { .wd { padding:10px; } }
@media (prefers-reduced-motion: reduce) { .pop { animation-duration:.01s; } }
`;

  var HTML = `
<div class="wd" tabindex="0" aria-label="worDrop word game">
<div class="game">
  <header class="top">
    <h1 class="logo" aria-label="worDrop">wor<span class="d">D</span>rop</h1>
    <div class="top-actions">
      <button class="btn" data-r="pauseBtn" type="button">Pause</button>
      <button class="btn" data-r="restartBtn" type="button">New game</button>
    </div>
  </header>
  <section class="stage">
    <aside class="side left">
      <div class="box hold-box"><p class="label">Hold</p><canvas class="mini" data-r="holdCv"></canvas></div>
      <div class="box stats">
        <div class="stat wide"><p class="label">Score</p><div class="v" data-r="score">0</div></div>
        <div class="stat"><p class="label">Level</p><div class="v" data-r="level">1</div></div>
        <div class="stat"><p class="label">Words</p><div class="v" data-r="wordsN">0</div></div>
        <div class="stat"><p class="label">Chain</p><div class="v chain" data-r="chain">–</div></div>
        <div class="stat best"><p class="label">Best</p><div class="v" data-r="best">0</div></div>
      </div>
      <div class="box keys-box">
        <p class="label">Keys</p>
        <div class="keys">
          <kbd>← →</kbd><span>Move</span><kbd>↑ / X</kbd><span>Rotate pair</span><kbd>Z</kbd><span>Rotate back</span>
          <kbd>↓</kbd><span>Soft drop</span><kbd>Space</kbd><span>Hard drop</span><kbd>C</kbd><span>Hold</span><kbd>P</kbd><span>Pause</span>
        </div>
      </div>
    </aside>
    <div class="well-wrap">
      <canvas class="board" data-r="board" aria-label="worDrop board"></canvas>
      <div class="pops" data-r="pops"></div>
      <div class="overlay" data-r="overlay"></div>
    </div>
    <aside class="side right">
      <div class="box next-box"><p class="label">Next</p><canvas class="mini" data-r="nextCv"></canvas></div>
      <div class="box def-box" aria-live="polite">
        <p class="label">Dictionary</p>
        <div class="def-body" data-r="defBody"><p class="def-hint">Spell a word to see what it means.</p></div>
        <p class="credit">Definitions: <a href="https://en-word.net/" target="_blank" rel="noopener">Open English WordNet</a>, CC BY 4.0</p>
      </div>
      <div class="box words-box"><p class="label">Words spelled</p><ul class="words" data-r="wordList"><li class="empty">None yet</li></ul></div>
    </aside>
  </section>
  <nav class="pad" data-r="pad" aria-label="Touch controls">
    <button type="button" data-act="left"><span class="glyph">◀</span>Left</button>
    <button type="button" data-act="rotate"><span class="glyph">⟳</span>Turn</button>
    <button type="button" data-act="right"><span class="glyph">▶</span>Right</button>
    <button type="button" data-act="soft"><span class="glyph">▾</span>Down</button>
    <button type="button" data-act="drop"><span class="glyph">⤓</span>Drop</button>
    <button type="button" data-act="hold"><span class="glyph">⇄</span>Hold</button>
  </nav>
</div>
</div>`;

  // Small words WordNet doesn't define (and overrides where its first sense misleads).
  var FUNC = {
    THE:['determiner','used before a noun for someone or something already known or about to be named'],
    AND:['conjunction','joins words, phrases or clauses'], BUT:['conjunction','introduces something that contrasts with what came before'],
    NOR:['conjunction','and not; used after a negative, as in "neither this nor that"'], FOR:['preposition','meant to belong to, be used by or benefit someone or something'],
    YOU:['pronoun','the person or people being spoken to'], YOUR:['determiner','belonging to the person or people being spoken to'], YOURS:['pronoun','the one or ones belonging to you'],
    SHE:['pronoun','a female person or animal already mentioned'], HER:['pronoun','a female person or animal already mentioned, as the object of a verb'], HERS:['pronoun','the one or ones belonging to her'],
    HIM:['pronoun','a male person or animal already mentioned, as the object of a verb'], HIS:['determiner','belonging to him'],
    ITS:['determiner','belonging to it'], OUR:['determiner','belonging to us'], OURS:['pronoun','the one or ones belonging to us'],
    THEY:['pronoun','people or things already mentioned'], THEM:['pronoun','people or things already mentioned, as the object of a verb'],
    THEIR:['determiner','belonging to them'], THEIRS:['pronoun','the one or ones belonging to them'],
    MYSELF:['pronoun','me, when I am also the subject'], YOURSELF:['pronoun','you, when you are also the subject'], HIMSELF:['pronoun','him, when he is also the subject'],
    HERSELF:['pronoun','her, when she is also the subject'], ITSELF:['pronoun','it, when it is also the subject'], OURSELVES:['pronoun','us, when we are also the subject'],
    THEMSELVES:['pronoun','them, when they are also the subject'], THEE:['pronoun','old form of "you" as an object'], THOU:['pronoun','old form of "you" as a subject'], THY:['determiner','old form of "your"'],
    WHO:['pronoun','what or which person or people'], WHOM:['pronoun','"who" as the object of a verb or preposition'], WHOSE:['determiner','belonging to which person'],
    WHAT:['pronoun','asks for information about something'], WHICH:['pronoun','asks for one or more from a definite set'],
    THAT:['determiner','points to something further away or already mentioned'], THIS:['determiner','points to something close by or just mentioned'],
    THESE:['determiner','plural of "this"'], THOSE:['determiner','plural of "that"'],
    WHERE:['adverb','in or to what place'], WHEN:['adverb','at what time'], HOW:['adverb','in what way or by what means'], WHY:['adverb','for what reason'],
    WHENEVER:['conjunction','at whatever time'], WHEREVER:['conjunction','in or to whatever place'], WHOEVER:['pronoun','whatever person'], WHATEVER:['pronoun','anything at all that'],
    THAN:['conjunction','introduces the second part of a comparison'], FROM:['preposition','showing the point where something starts'],
    WITH:['preposition','accompanied by; using'], WITHOUT:['preposition','not having or not accompanied by'], WITHIN:['preposition','inside the range or limits of'],
    INTO:['preposition','to the inside of'], ONTO:['preposition','moving to a position on'], UPON:['preposition','on (more formal)'], UNTO:['preposition','old form of "to"'],
    AMONG:['preposition','surrounded by; in the company of'], AMONGST:['preposition','among'], AMID:['preposition','in the middle of'],
    AGAINST:['preposition','in opposition to; touching for support'], BETWEEN:['preposition','in the space separating two things'],
    BEHIND:['preposition','at the back of'], BEYOND:['preposition','on the far side of'], BENEATH:['preposition','directly below'],
    BESIDE:['preposition','next to'], BESIDES:['preposition','in addition to'], DURING:['preposition','throughout the course of'],
    TOWARD:['preposition','in the direction of'], TOWARDS:['preposition','in the direction of'], THROUGH:['preposition','moving in one side and out the other'],
    UNTIL:['conjunction','up to the time that'], SINCE:['conjunction','from a past time until now; because'], UNLESS:['conjunction','except if'],
    ALTHOUGH:['conjunction','in spite of the fact that'], THOUGH:['conjunction','despite the fact that'], BECAUSE:['conjunction','for the reason that'],
    WHETHER:['conjunction','introduces a choice between possibilities'], WHILE:['conjunction','during the time that; whereas'],
    EITHER:['determiner','one or the other of two'], NEITHER:['determiner','not the one nor the other of two'],
    EACH:['determiner','every one of two or more, taken separately'], EVERY:['determiner','all the members of a group, without exception'],
    BOTH:['determiner','the two together'], SUCH:['determiner','of the type mentioned'], NONE:['pronoun','not any; no one'],
    ANYONE:['pronoun','any person'], EVERYONE:['pronoun','every person'], SOMEONE:['pronoun','an unknown or unnamed person'],
    ANYTHING:['pronoun','a thing of any kind'], EVERYTHING:['pronoun','all things'], SOMETHING:['pronoun','a thing not named or known'],
    CAN:['verb','to be able to'], COULD:['verb','past of "can"; used for possibility or polite requests'], MAY:['verb','used to express possibility or to ask or give permission'],
    MIGHT:['verb','used to express that something is possible but not certain'], MUST:['verb','to be obliged or certain to'],
    SHALL:['verb','used to express the future or to make an offer'], SHOULD:['verb','used to say what is right or expected'],
    WILL:['verb','used to express the future'], WOULD:['verb','used for imagined situations or polite requests'],
    WAS:['verb','past of "be" (I was, she was)'], WERE:['verb','past of "be" (we were, they were)'], ARE:['verb','present of "be" (we are, they are)'],
    BEEN:['verb','past participle of "be"'], DOES:['verb','present of "do" (she does)'], DID:['verb','past of "do"'], HAS:['verb','present of "have" (he has)'], HAD:['verb','past of "have"'],
    VIA:['preposition','by way of'], PER:['preposition','for each'], ELSE:['adverb','other; in addition; otherwise']
  };
  var POS = { n:'noun', v:'verb', a:'adjective', r:'adverb' };
  var VALUES = {A:1,B:3,C:3,D:2,E:1,F:4,G:2,H:4,I:1,J:8,K:5,L:1,M:3,N:1,O:1,P:3,Q:10,R:1,S:1,T:1,U:1,V:4,W:4,X:8,Y:4,Z:10};
  var DIST = 'E12A9I9O8N6R6T6L4S4U4D4G3B2C2M2P2F2H2V2W2Y2K1J1X1Q1Z1';
  var COLS = 8, ROWS = 14, OFF = [[1,0],[0,1],[-1,0],[0,-1]], LOCK_MS = 420, CLEAR_MS = 480;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  var spell = function (ch) { return ch === 'Q' ? 'QU' : ch; };
  var face = function (ch) { return ch === 'Q' ? 'Qu' : ch; };

  function mount(host) {
    if (host.__wordrop) return; host.__wordrop = true;
    var assets = host.getAttribute('data-assets') || BASE;
    if (assets && !/\/$/.test(assets)) assets += '/';
    if (host.getAttribute('data-fonts') !== 'off') loadFonts();
    var shadow = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
    shadow.innerHTML = '<style>' + CSS + '</style>' + HTML;
    var root = shadow.querySelector('.wd');
    var $ = function (r) { return shadow.querySelector('[data-r="' + r + '"]'); };
    var q = function (sel) { return shadow.querySelector(sel); };

    // ---------- dictionary ----------
    var WORDS = new Set(), wordsReady = false, defsReady = false, wordsError = null;
    var isWord = function (s) { return WORDS.has(s); };
    function prune() {
      var D = window.WORDROP_DEFS; if (!D || !wordsReady) return;
      WORDS.forEach(function (w) { var lw = w.toLowerCase(); if (!FUNC[w] && !D.D[D.L[lw] || lw]) WORDS.delete(w); });
      if (state === 'title') titleOverlay();
    }
    loadScript(assets + 'words.js', 'WORDROP_WORDS').then(function (str) {
      WORDS = new Set(str.split(' ')); wordsReady = true;
      if (defsReady) prune(); else if (state === 'title') titleOverlay();
    }).catch(function (e) { wordsError = e.message; if (state === 'title') titleOverlay(); });
    loadScript(assets + 'defs.js', 'WORDROP_DEFS').then(function () {
      defsReady = true; prune(); if (shownWord) showDef(shownWord);
    }).catch(function () { defsReady = false; });

    var shownWord = null;
    function showDef(W) {
      shownWord = W;
      var lemma = null, senses = null, D = window.WORDROP_DEFS;
      if (FUNC[W]) senses = [FUNC[W]];
      else if (D) {
        var lw = W.toLowerCase(), lem = D.L[lw] || lw, raw = D.D[lem];
        if (raw) { senses = raw.split('\n').map(function (s) { var p = s.split('\t'); return [POS[p[0]] || p[0], p[1]]; }); if (lem !== lw) lemma = lem; }
      }
      var html = '<p class="def-word">' + esc(W) + '</p>';
      if (lemma) html += '<p class="def-form">form of <b>' + esc(lemma) + '</b></p>';
      if (senses) html += senses.map(function (s) { return '<p class="def-sense"><span class="pos">' + esc(s[0]) + '</span>' + esc(s[1]) + '</p>'; }).join('');
      else html += '<p class="def-hint">' + (D ? 'No definition in the dictionary for this one.' : 'Loading dictionary…') + '</p>';
      $('defBody').innerHTML = html;
      shadow.querySelectorAll('.wbtn').forEach(function (b) { b.setAttribute('aria-current', b.dataset.w === W ? 'true' : 'false'); });
    }

    // ---------- letters ----------
    var bag = [];
    function nextLetter() {
      if (!bag.length) {
        DIST.replace(/([A-Z])(\d+)/g, function (_, l, n) { for (var i = 0; i < +n; i++) bag.push(l); });
        for (var i = bag.length - 1; i > 0; i--) { var j = Math.random() * (i + 1) | 0, t = bag[i]; bag[i] = bag[j]; bag[j] = t; }
      }
      return bag.pop();
    }

    // ---------- state ----------
    var grid, cur, queue, hold, canHold, state = 'title', score, wordsFound, level, chain, bestChain, dropAcc, lockAcc, lockResets, clearT, soft, tileId, log;
    var pausedFrom = 'playing', best = 0, cell = 36, dpr = 1, shownScore = 0;
    try { best = +localStorage.getItem('wordrop-best') || 0; } catch (e) {}
    var board = $('board'), bctx = board.getContext('2d'), holdCv = $('holdCv'), nextCv = $('nextCv');

    function newPiece() { return { a: nextLetter(), b: Math.random() < 0.82 ? nextLetter() : null, o: 0, x: 3, y: 0 }; }
    function cellsOf(p) {
      var out = [{ x: p.x, y: p.y, ch: p.a }];
      if (p.b) out.push({ x: p.x + OFF[p.o][0], y: p.y + OFF[p.o][1], ch: p.b });
      return out;
    }
    function fits(p) { return cellsOf(p).every(function (c) { return c.x >= 0 && c.x < COLS && c.y < ROWS && (c.y < 0 || !grid[c.y][c.x]); }); }
    function mkTile(ch, ry) { return { ch: ch, id: tileId++, ry: ry, vy: 0, clear: false }; }
    function emptyGrid() { var g = []; for (var r = 0; r < ROWS; r++) { g.push(new Array(COLS).fill(null)); } return g; }
    function applyGravity() {
      for (var c = 0; c < COLS; c++) {
        var w = ROWS - 1;
        for (var r = ROWS - 1; r >= 0; r--) { var t = grid[r][c]; if (t) { grid[r][c] = null; grid[w][c] = t; w--; } }
      }
    }
    function findWords() {
      var found = [];
      function scan(line, coords) {
        var i = 0;
        while (i < line.length) {
          if (!line[i]) { i++; continue; }
          var j = i; while (j < line.length && line[j]) j++;
          var seg = [];
          for (var a = i; a < j; a++) for (var b = a + 2; b < j; b++) {
            var s = ''; for (var k = a; k <= b; k++) s += spell(line[k].ch);
            if (isWord(s)) seg.push({ a: a, b: b, word: s, cells: coords.slice(a, b + 1) });
          }
          seg.forEach(function (m) { if (!seg.some(function (n) { return n !== m && n.a <= m.a && n.b >= m.b; })) found.push(m); });
          i = j;
        }
      }
      for (var r = 0; r < ROWS; r++) scan(grid[r], grid[r].map(function (_, c) { return [r, c]; }));
      for (var c = 0; c < COLS; c++) { var col = grid.map(function (row) { return row[c]; }); scan(col, col.map(function (_, r) { return [r, c]; })); }
      return found;
    }

    function reset(seed) {
      grid = emptyGrid(); bag = []; tileId = 0; hold = null; canHold = true; score = 0; wordsFound = 0; level = 1; chain = 0; bestChain = 0;
      dropAcc = 0; lockAcc = 0; lockResets = 0; clearT = 0; soft = false; log = [];
      if (seed) seedBoard();
      queue = [newPiece(), newPiece(), newPiece()]; cur = null;
      $('pops').innerHTML = '';
      shownWord = null; $('defBody').innerHTML = '<p class="def-hint">Spell a word to see what it means.</p>';
      renderWords(); updateHud(); drawMinis();
    }
    function seedBoard() {
      for (var tries = 0; tries < 60; tries++) {
        grid = emptyGrid();
        for (var c = 0; c < COLS; c++) {
          var h = Math.random() < 0.7 ? (Math.random() < 0.35 ? 2 : 1) : 0;
          for (var k = 0; k < h; k++) grid[ROWS - 1 - k][c] = mkTile(nextLetter(), ROWS - 1 - k);
        }
        if (!findWords().length) return;
      }
    }
    function start() {
      if (!wordsReady) return;
      reset(true); state = 'playing'; $('pauseBtn').textContent = 'Pause'; spawn(); showOverlay(null);
      root.focus({ preventScroll: true });
    }
    function spawn() {
      cur = queue.shift(); queue.push(newPiece());
      cur.x = 3; cur.y = 0; cur.o = 0; dropAcc = 0; lockAcc = 0; lockResets = 0; canHold = true;
      drawMinis();
      if (!fits(cur)) gameOver();
    }
    function interval() { return Math.max(90, 850 * Math.pow(0.86, level - 1)); }
    function tryMove(dx, dy) {
      if (state !== 'playing' || !cur) return false;
      var np = Object.assign({}, cur, { x: cur.x + dx, y: cur.y + dy });
      if (fits(np)) { cur = np; if (dx && lockResets < 15) { lockAcc = 0; lockResets++; } return true; }
      return false;
    }
    function rotate(dir) {
      if (state !== 'playing' || !cur || !cur.b) return;
      var o = (cur.o + dir + 4) % 4, kicks = [[0,0],[-1,0],[1,0],[0,-1]];
      for (var i = 0; i < kicks.length; i++) {
        var np = Object.assign({}, cur, { o: o, x: cur.x + kicks[i][0], y: cur.y + kicks[i][1] });
        if (fits(np)) { cur = np; if (lockResets < 15) { lockAcc = 0; lockResets++; } return; }
      }
    }
    function hardDrop() {
      if (state !== 'playing' || !cur) return;
      var n = 0; while (tryMove(0, 1)) n++;
      score += n * 2; lock();
    }
    function doHold() {
      if (state !== 'playing' || !cur || !canHold) return;
      var strip = { a: cur.a, b: cur.b, o: 0, x: 3, y: 0 };
      if (!hold) { hold = strip; spawn(); }
      else { cur = Object.assign({}, hold, { x: 3, y: 0, o: 0 }); hold = strip; if (!fits(cur)) return gameOver(); }
      canHold = false; drawMinis();
    }
    function lock() {
      var cs = cellsOf(cur);
      for (var i = 0; i < cs.length; i++) { if (cs[i].y < 0) return gameOver(); grid[cs[i].y][cs[i].x] = mkTile(cs[i].ch, cs[i].y); }
      cur = null; chain = 0; applyGravity(); state = 'settling';
    }
    function resolve() {
      var found = findWords();
      if (!found.length) { chain = 0; updateHud(); state = 'playing'; spawn(); return; }
      chain++;
      var top = null;
      found.forEach(function (m) {
        var tiles = m.cells.map(function (rc) { return grid[rc[0]][rc[1]]; });
        var pts = tiles.reduce(function (s, t) { return s + VALUES[t.ch]; }, 0) * tiles.length * 10 * chain;
        tiles.forEach(function (t) { t.clear = true; });
        score += pts; wordsFound++;
        log.unshift({ word: m.word, pts: pts, chain: chain });
        if (!top || pts > top.pts) top = { word: m.word, pts: pts };
        var f = m.cells[0], l = m.cells[m.cells.length - 1];
        pop(m.word, pts, chain, (f[1] + l[1]) / 2 + .5, (f[0] + l[0]) / 2 + .5);
      });
      level = 1 + Math.floor(wordsFound / 6);
      if (chain > bestChain) bestChain = chain;
      renderWords(); updateHud(); showDef(top.word);
      clearT = 0; state = 'clearing';
    }
    function gameOver() {
      state = 'over'; cur = null;
      if (score > best) { best = score; try { localStorage.setItem('wordrop-best', best); } catch (e) {} }
      updateHud();
      var top = log.slice().sort(function (a, b) { return b.pts - a.pts; })[0];
      showOverlay('<h2>Case full</h2><div class="big">' + score.toLocaleString() + '</div>' +
        '<p>' + wordsFound + ' word' + (wordsFound === 1 ? '' : 's') + ' spelled' + (top ? ', best was <b>' + top.word + '</b> for ' + top.pts.toLocaleString() : '') +
        '. Longest chain ×' + Math.max(bestChain, 1) + '.</p><button class="btn primary" type="button" data-start>Play again</button>');
    }
    function togglePause() {
      if (state === 'playing' || state === 'settling' || state === 'clearing') {
        pausedFrom = state; state = 'paused'; soft = false;
        showOverlay('<h2>Paused</h2><button class="btn primary" type="button" data-resume>Resume</button><p class="small">P or Esc to resume</p>');
      } else if (state === 'paused') { state = pausedFrom; showOverlay(null); root.focus({ preventScroll: true }); }
      $('pauseBtn').textContent = state === 'paused' ? 'Resume' : 'Pause';
    }
    function pauseIfActive() { if (state === 'playing' || state === 'settling' || state === 'clearing') togglePause(); }

    // ---------- loop ----------
    var last = performance.now();
    function frame(now) {
      var dt = Math.min(50, now - last); last = now;
      if (state === 'playing' && cur) {
        if (!fits(Object.assign({}, cur, { y: cur.y + 1 }))) { lockAcc += dt; dropAcc = 0; if (lockAcc >= LOCK_MS) lock(); }
        else {
          lockAcc = 0; dropAcc += dt;
          var iv = soft ? Math.min(45, interval()) : interval();
          while (dropAcc >= iv) { dropAcc -= iv; if (!tryMove(0, 1)) break; if (soft) score += 1; }
        }
      } else if (state === 'settling') {
        var moving = false;
        for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) {
          var t = grid[r][c]; if (!t) continue;
          if (t.ry < r) { t.vy = Math.max(t.vy, 0.008) + 0.00009 * dt; t.ry = Math.min(r, t.ry + t.vy * dt); moving = true; }
          else { t.ry = r; t.vy = 0; }
        }
        if (!moving) resolve();
      } else if (state === 'clearing') {
        clearT += dt;
        if (clearT >= CLEAR_MS) {
          for (var r2 = 0; r2 < ROWS; r2++) for (var c2 = 0; c2 < COLS; c2++) if (grid[r2][c2] && grid[r2][c2].clear) grid[r2][c2] = null;
          applyGravity(); state = 'settling';
        }
      }
      if (host.isConnected) { render(); updateHudLive(); requestAnimationFrame(frame); }
    }

    // ---------- drawing ----------
    var colors = {};
    function readColors() {
      var cs = getComputedStyle(root);
      ['well','well-line','tile','tile-hi','tile-lo','ink','hit','danger','ghost','accent'].forEach(function (k) { colors[k] = cs.getPropertyValue('--' + k).trim(); });
    }
    function rr(ctx, x, y, w, h, r) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); }
    function drawTile(ctx, x, y, s, ch, opt) {
      opt = opt || {};
      var pad = Math.max(1, s * 0.05), w = s - pad * 2, r = s * 0.12;
      ctx.save(); ctx.translate(x + s / 2, y + s / 2);
      if (opt.scale) ctx.scale(opt.scale, opt.scale);
      ctx.translate(-s / 2, -s / 2);
      if (opt.ghost) {
        ctx.strokeStyle = colors.ghost; ctx.lineWidth = Math.max(1, s * 0.05); ctx.setLineDash([s * 0.12, s * 0.09]);
        rr(ctx, pad + 1, pad + 1, w - 2, w - 2, r); ctx.stroke(); ctx.restore(); return;
      }
      ctx.fillStyle = colors['tile-lo']; rr(ctx, pad, pad, w, w, r); ctx.fill();
      ctx.fillStyle = colors['tile-hi']; rr(ctx, pad, pad, w - s * 0.06, w - s * 0.06, r); ctx.fill();
      ctx.fillStyle = opt.hit ? colors.hit : colors.tile; rr(ctx, pad + s * 0.05, pad + s * 0.05, w - s * 0.1, w - s * 0.1, r * 0.8); ctx.fill();
      ctx.strokeStyle = 'rgba(120,80,30,0.10)'; ctx.lineWidth = 1;
      for (var i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(pad + s * 0.1, pad + w * i / 4); ctx.quadraticCurveTo(s / 2, pad + w * i / 4 + s * 0.04, w, pad + w * i / 4 - s * 0.02); ctx.stroke(); }
      ctx.fillStyle = colors.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      var label = face(ch);
      ctx.font = Math.round(s * (label.length > 1 ? 0.42 : 0.56)) + 'px "Alfa Slab One", Rockwell, Georgia, serif';
      ctx.fillText(label, s / 2 - s * 0.03, s / 2 + s * 0.02);
      if (s >= 22) {
        ctx.font = '700 ' + Math.round(s * 0.2) + 'px "Chivo Mono", ui-monospace, monospace';
        ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic'; ctx.globalAlpha = 0.7;
        ctx.fillText(VALUES[ch], s - pad - s * 0.09, s - pad - s * 0.1);
      }
      ctx.restore();
    }
    function render() {
      readColors();
      var W = COLS * cell, H = ROWS * cell;
      bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      bctx.fillStyle = colors.well; bctx.fillRect(0, 0, W, H);
      bctx.strokeStyle = colors['well-line']; bctx.lineWidth = 1;
      for (var c = 1; c < COLS; c++) { bctx.beginPath(); bctx.moveTo(c * cell + .5, 0); bctx.lineTo(c * cell + .5, H); bctx.stroke(); }
      for (var r = 1; r < ROWS; r++) { bctx.beginPath(); bctx.moveTo(0, r * cell + .5); bctx.lineTo(W, r * cell + .5); bctx.stroke(); }
      if (grid[2].some(Boolean)) { bctx.fillStyle = colors.danger; bctx.globalAlpha = 0.18 + 0.08 * Math.sin(performance.now() / 180); bctx.fillRect(0, 0, W, cell * 2); bctx.globalAlpha = 1; }
      if (cur && state === 'playing') {
        var g = Object.assign({}, cur); while (fits(Object.assign({}, g, { y: g.y + 1 }))) g.y++;
        if (g.y !== cur.y) cellsOf(g).forEach(function (p) { if (p.y >= 0) drawTile(bctx, p.x * cell, p.y * cell, cell, p.ch, { ghost: true }); });
      }
      var pulse = state === 'clearing' ? clearT / CLEAR_MS : 0;
      for (var r3 = 0; r3 < ROWS; r3++) for (var c3 = 0; c3 < COLS; c3++) {
        var t = grid[r3][c3]; if (!t) continue;
        if (t.clear) {
          var sc = pulse < .55 ? 1 + 0.1 * Math.sin(pulse / .55 * Math.PI) : 1 - (pulse - .55) / .45;
          drawTile(bctx, c3 * cell, t.ry * cell, cell, t.ch, { hit: true, scale: Math.max(0.01, sc) });
        } else drawTile(bctx, c3 * cell, t.ry * cell, cell, t.ch);
      }
      if (cur) cellsOf(cur).forEach(function (p) { if (p.y >= 0) drawTile(bctx, p.x * cell, p.y * cell, cell, p.ch); });
    }
    function sizeMini(cv, w, h) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.width = w + 'px'; cv.style.height = h + 'px'; }
    function drawPieceMini(ctx, p, x, y, s) { if (!p) return; drawTile(ctx, x, y, s, p.a); if (p.b) drawTile(ctx, x + s, y, s, p.b); }
    function drawMinis() {
      if (!queue) return;
      readColors();
      var narrow = root.clientWidth <= 760, s = narrow ? 24 : 34;
      sizeMini(holdCv, s * 2, s);
      var hc = holdCv.getContext('2d'); hc.setTransform(dpr, 0, 0, dpr, 0, 0); hc.clearRect(0, 0, s * 2, s);
      if (hold) { hc.globalAlpha = canHold ? 1 : 0.45; drawPieceMini(hc, hold, hold.b ? 0 : s / 2, 0, s); hc.globalAlpha = 1; }
      else { hc.strokeStyle = colors.ghost; hc.setLineDash([4, 4]); hc.strokeRect(1.5, 1.5, s * 2 - 3, s - 3); }
      var n = narrow ? 1 : 3, gap = 8, h = n * s + (n - 1) * gap;
      sizeMini(nextCv, s * 2, h);
      var nc = nextCv.getContext('2d'); nc.setTransform(dpr, 0, 0, dpr, 0, 0); nc.clearRect(0, 0, s * 2, h);
      queue.slice(0, n).forEach(function (p, i) { nc.globalAlpha = i === 0 ? 1 : 0.7; drawPieceMini(nc, p, p.b ? 0 : s / 2, i * (s + gap), s); });
      nc.globalAlpha = 1;
    }

    // ---------- HUD ----------
    function updateHud() {
      $('level').textContent = level; $('wordsN').textContent = wordsFound;
      $('chain').textContent = chain > 1 ? '×' + chain : (bestChain > 1 ? 'best ×' + bestChain : '–');
      $('best').textContent = Math.max(best, score).toLocaleString();
    }
    function updateHudLive() {
      if (shownScore !== score) {
        shownScore = score < shownScore ? score : Math.min(score, shownScore + Math.max(1, Math.ceil((score - shownScore) / 8)));
        $('score').textContent = shownScore.toLocaleString();
      }
    }
    function renderWords() {
      var ul = $('wordList');
      if (!log.length) { ul.innerHTML = '<li class="empty">None yet</li>'; return; }
      ul.innerHTML = log.slice(0, 30).map(function (w) {
        return '<li><button type="button" class="wbtn" data-w="' + w.word + '" aria-current="' + (w.word === shownWord) + '" title="Show definition"><b>' + w.word +
          '</b><span>' + (w.chain > 1 ? '×' + w.chain + ' ' : '') + '+' + w.pts.toLocaleString() + '</span></button></li>';
      }).join('');
    }
    function pop(word, pts, ch, cx, cy) {
      var el = document.createElement('div'); el.className = 'pop';
      el.style.left = (cx * cell) + 'px'; el.style.top = (cy * cell) + 'px';
      el.innerHTML = word + '<small>+' + pts.toLocaleString() + (ch > 1 ? ' ×' + ch : '') + '</small>';
      $('pops').appendChild(el); setTimeout(function () { el.remove(); }, 1300);
    }
    function showOverlay(html) {
      var o = $('overlay');
      if (!html) { o.hidden = true; o.innerHTML = ''; return; }
      o.innerHTML = html; o.hidden = false;
    }
    function titleOverlay() {
      var btn = wordsError ? '<p class="small">' + esc(wordsError) + '. Check that words.js is uploaded next to wordrop.js.</p>'
        : wordsReady ? '<button class="btn primary" type="button" data-start>Start game</button>'
        : '<button class="btn primary" type="button" disabled>Loading words…</button>';
      showOverlay('<h2>Spell to survive</h2>' +
        '<p>Letter pairs drop into the case. Line them up to spell words of 3+ letters, left to right or top to bottom. Words vanish, everything above falls, and chain reactions multiply your score.</p>' +
        btn + '<p class="small">Rare letters score more. Qu comes as one tile.' + (wordsReady ? ' ' + WORDS.size.toLocaleString() + ' words, UK and US spellings.' : '') + '</p>');
    }

    // ---------- sizing ----------
    function fit() {
      dpr = Math.min(3, window.devicePixelRatio || 1);
      var narrow = root.clientWidth <= 760, stage = q('.stage');
      var maxH = +host.getAttribute('data-max-height') || 900;
      var topH = q('.top').offsetHeight;
      var pad = $('pad'), padH = getComputedStyle(pad).display === 'none' ? 0 : pad.offsetHeight + 10;
      var sideH = narrow ? Math.max(q('.left').offsetHeight, q('.next-box').offsetHeight) + q('.def-box').offsetHeight + 20 : 0;
      var availW = (narrow ? stage.clientWidth : stage.clientWidth - 460) - 16;
      // In an auto-sizing iframe the parent page passes its own viewport height in data-viewport-height.
      var vh = +host.getAttribute('data-viewport-height') || window.innerHeight;
      var availH = Math.min(vh, maxH) - topH - padH - sideH - 16 - 44;
      var nc = Math.max(18, Math.min(46, Math.floor(Math.min(availW / COLS, availH / ROWS))));
      if (nc !== cell || board.width !== COLS * nc * dpr) {
        cell = nc;
        board.width = COLS * cell * dpr; board.height = ROWS * cell * dpr;
        board.style.width = COLS * cell + 'px'; board.style.height = ROWS * cell + 'px';
      }
      drawMinis();
    }

    // ---------- input (only while the game has focus, so the host page keeps its own keys) ----------
    root.addEventListener('keydown', function (e) {
      var k = e.key;
      if ((state === 'title' || state === 'over') && k === 'Enter' && e.target === root) { e.preventDefault(); start(); return; }
      if (k === 'p' || k === 'P' || k === 'Escape') { if (state !== 'title' && state !== 'over') { togglePause(); e.preventDefault(); } return; }
      if (state !== 'playing') return;
      var L = function () { tryMove(-1, 0); }, R = function () { tryMove(1, 0); }, CW = function () { rotate(1); }, CCW = function () { rotate(-1); },
        SD = function () { soft = true; }, H = function () { doHold(); };
      var map = { ArrowLeft: L, a: L, A: L, ArrowRight: R, d: R, D: R, ArrowUp: CW, x: CW, X: CW, w: CW, W: CW, z: CCW, Z: CCW,
        ArrowDown: SD, s: SD, S: SD, c: H, C: H, Shift: H, ' ': function () { if (!e.repeat) hardDrop(); } };
      if (map[k]) { e.preventDefault(); map[k](); }
    });
    root.addEventListener('keyup', function (e) { if (['ArrowDown', 's', 'S'].indexOf(e.key) >= 0) soft = false; });
    // Leaving the game (clicking elsewhere on the page, tabbing away) pauses it.
    root.addEventListener('focusout', function (e) { if (!e.relatedTarget || !root.contains(e.relatedTarget)) pauseIfActive(); });
    document.addEventListener('visibilitychange', function () { if (document.hidden) pauseIfActive(); });

    $('overlay').addEventListener('click', function (e) {
      if (e.target.closest('[data-start]')) start();
      if (e.target.closest('[data-resume]')) togglePause();
    });
    $('pauseBtn').addEventListener('click', function () { if (state !== 'title' && state !== 'over') togglePause(); });
    $('restartBtn').addEventListener('click', function () { start(); });
    $('wordList').addEventListener('click', function (e) { var b = e.target.closest('.wbtn'); if (b) { showDef(b.dataset.w); root.focus({ preventScroll: true }); } });

    var acts = { left: function () { tryMove(-1, 0); }, right: function () { tryMove(1, 0); }, rotate: function () { rotate(1); }, drop: hardDrop, hold: doHold };
    $('pad').querySelectorAll('button').forEach(function (btn) {
      var t1, t2;
      function stop() { clearTimeout(t1); clearInterval(t2); if (btn.dataset.act === 'soft') soft = false; }
      btn.addEventListener('pointerdown', function (e) {
        e.preventDefault(); root.focus({ preventScroll: true });
        var a = btn.dataset.act;
        if (state !== 'playing') return;
        if (a === 'soft') { soft = true; return; }
        acts[a]();
        if (a === 'left' || a === 'right') t1 = setTimeout(function () { t2 = setInterval(acts[a], 65); }, 180);
      });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) { btn.addEventListener(ev, stop); });
    });
    board.addEventListener('pointerdown', function () { if (state === 'playing') rotate(1); });

    if (window.ResizeObserver) new ResizeObserver(fit).observe(root);
    if (window.MutationObserver) new MutationObserver(fit).observe(host, { attributes: true, attributeFilter: ['data-viewport-height', 'data-max-height'] });
    window.addEventListener('resize', fit);
    if (document.fonts) document.fonts.ready.then(fit);
    try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', drawMinis); } catch (e) {}

    reset(true); state = 'title'; fit(); titleOverlay();
    requestAnimationFrame(frame);
  }

  function boot() {
    var hosts = document.querySelectorAll('[data-wordrop], #wordrop');
    for (var i = 0; i < hosts.length; i++) mount(hosts[i]);
  }
  window.WorDrop = { mount: mount };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
