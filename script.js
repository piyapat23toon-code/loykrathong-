/* =========================================================
   ลอยกระทงออนไลน์กับแฟน — script.js (Vanilla JS)
   Sections:
   1) Utils   2) Data   3) State & Share encoding
   4) SVG builders (Couple / Krathong)
   5) Canvas Scene engine   6) Web Audio music & SFX
   7) Souvenir PNG renderer (Zero Thai clipping)
   8) UI controller   9) Boot
   ========================================================= */
(() => {
  'use strict';

  /* ================= 1) UTILS ================= */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const ri = n => Math.floor(Math.random() * n);
  const pick = arr => arr[ri(arr.length)];
  const f1 = n => Math.round(n * 10) / 10;
  const TAU = Math.PI * 2;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function shade(hex, p) {
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const t = p < 0 ? 0 : 255, a = Math.abs(p);
    r = Math.round((t - r) * a + r); g = Math.round((t - g) * a + g); b = Math.round((t - b) * a + b);
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }
  const segmenter = (window.Intl && Intl.Segmenter) ? new Intl.Segmenter('th', { granularity: 'grapheme' }) : null;
  function graphemes(s) {
    s = String(s || '');
    return segmenter ? Array.from(segmenter.segment(s), x => x.segment) : Array.from(s);
  }
  function trunc(s, n) { const g = graphemes(s); return g.length > n ? g.slice(0, n - 1).join('') + '…' : String(s); }
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const HEART = 'M0,7 C-11,-1 -13,-10 -6.5,-12.5 C-2.5,-14 0,-11 0,-8.5 C0,-11 2.5,-14 6.5,-12.5 C13,-10 11,-1 0,7 Z';

  /* ================= 2) DATA ================= */
  const FACES = [
    { name: 'ยิ้มหวาน', icon: '😊' },
    { name: 'เขินแก้มแดง', icon: '😳' },
    { name: 'ขยิบตา', icon: '😉' },
    { name: 'ตาเป็นประกาย', icon: '✨' }
  ];
  const HAIRS = [
    { name: 'สั้นซอยมีสไตล์', icon: '💇‍♂️' },
    { name: 'แสกข้างหล่อๆ', icon: '🧑' },
    { name: 'ยาวสลวย', icon: '👩' },
    { name: 'มวยผมไทย', icon: '👸' },
    { name: 'หางม้า', icon: '🎀' },
    { name: 'บ๊อบน่ารัก', icon: '💁‍♀️' },
    { name: 'ลอนคลื่นหวาน', icon: '🌊' }
  ];
  const HAIR_COLORS = [
    { name: 'ดำขลับ', c: '#231815' }, { name: 'น้ำตาลเข้ม', c: '#4a2c1d' }, { name: 'ช็อกโกแลต', c: '#7a4a2e' },
    { name: 'น้ำตาลทอง', c: '#b9814c' }, { name: 'บลอนด์', c: '#e3bf7a' }, { name: 'ชมพูพาสเทล', c: '#d9798f' },
    { name: 'แดงไวน์', c: '#7c2d3e' }, { name: 'น้ำเงินหม่น', c: '#2c3a66' }
  ];
  const SKIN_TONES = [
    { name: 'ขาวอมชมพู', c: '#fde3d2' }, { name: 'ขาวเหลือง', c: '#f7d3b3' }, { name: 'สองสี', c: '#e8b591' },
    { name: 'ผิวแทน', c: '#c98d66' }, { name: 'ผิวเข้ม', c: '#93603f' }
  ];
  const OUTFITS = [
    { name: 'ชุดไทยประยุกต์', icon: '🎎', top: '#fff6e3', sleeve: 'long', sleeveColor: '#fff6e3', lower: 'jong', lowerColor: '#4c3b8f', shoe: '#3b2a1e', deco: 'raj' },
    { name: 'ชุดไทยสไบ', icon: '🥻', top: 'skin', sleeve: 'none', lower: 'longskirt', lowerColor: '#b83a68', shoe: '#d4a24c', deco: 'sabai' },
    { name: 'ชุดผ้าไหม', icon: '✨', top: '#6d3fa3', sleeve: 'long', sleeveColor: '#6d3fa3', lower: 'longskirt', lowerColor: '#53307f', shoe: '#d4a24c', deco: 'silk' },
    { name: 'ไปรเวทน่ารัก', icon: '🧸', top: '#ffc2d4', sleeve: 'long', sleeveColor: '#ffc2d4', lower: 'pants', lowerColor: '#7ea6d8', shoe: '#ffffff', deco: 'hoodie' },
    { name: 'เสื้อคู่', icon: '💑', top: '#ffffff', sleeve: 'short', sleeveColor: '#ffffff', lower: 'pants', lowerColor: '#3f5f8f', shoe: '#f1f1f1', deco: 'coupletee' },
    { name: 'เดรสน่ารัก', icon: '👗', top: '#ffd8a8', sleeve: 'puff', sleeveColor: '#ffd8a8', lower: 'skirt', lowerColor: '#ffd8a8', shoe: '#c2410c', deco: 'dress' },
    { name: 'ยูกาตะโรแมนติก', icon: '👘', top: '#2b3a70', sleeve: 'long', sleeveColor: '#2b3a70', lower: 'longskirt', lowerColor: '#24315e', shoe: '#8b5a2b', deco: 'yukata' }
  ];
  const ACCESSORIES = [
    { name: 'ไม่ใส่', icon: '🚫' }, { name: 'พวงมาลัย', icon: '🌼' }, { name: 'กิ๊บดอกไม้', icon: '🌸' },
    { name: 'มงกุฎดอกไม้', icon: '💐' }, { name: 'แว่นตากลม', icon: '👓' }, { name: 'ช่อดอกไม้', icon: '💝' },
    { name: 'โบว์น่ารัก', icon: '🎀' }
  ];
  const BASES = [
    { name: 'ใบตองพับกลีบ', icon: '🍃' },
    { name: 'กระทงดอกบัว', icon: '🪷' },
    { name: 'กระทงขนมปัง', icon: '🍞' },
    { name: 'กระทงกะลาล้านนา', icon: '🥥' }
  ];
  const FLOWERS = [
    { name: 'ดาวเรือง', icon: '🌼' },
    { name: 'กุหลาบ', icon: '🌹' },
    { name: 'กล้วยไม้', icon: '🌺' },
    { name: 'บานไม่รู้โรย', icon: '💜' },
    { name: 'ดอกมะลิ', icon: '🤍' }
  ];
  const CANDLES = [
    { name: 'เทียน + ธูป 3 ดอก', icon: '🕯️' },
    { name: 'เทียนหอมกลีบบัว', icon: '🪔' },
    { name: 'เทียนคู่หัวใจ', icon: '💞' }
  ];
  const EXTRAS = [
    { name: 'เรียบง่าย', icon: '✨' },
    { name: 'เหรียญนำโชค', icon: '🪙' },
    { name: 'ผีเสื้อเรืองแสง', icon: '🦋' },
    { name: 'หัวใจคู่ลอย', icon: '💖' }
  ];
  const PLACES = [
    { name: 'ริมแม่น้ำเจ้าพระยา', desc: 'เงาพระปรางค์วัดอรุณฯ สีทองระยิบระยับบนผิวน้ำยามค่ำคืน', icon: '🛕', thumb: 'linear-gradient(180deg,#0b1240 0%,#3a2a64 55%,#1a1f4a 56%,#070a1d 100%)' },
    { name: 'ทะเลสาบใต้แสงจันทร์', desc: 'ขุนเขา แสงจันทร์ และโคมลอยยี่เป็งนับร้อยลอยขึ้นฟ้า', icon: '🏮', thumb: 'linear-gradient(180deg,#041030 0%,#1e4c7c 55%,#0f2d58 56%,#030b1c 100%)' },
    { name: 'คลองย้อนยุค', desc: 'บ้านเรือนไทยริมน้ำ ประดับไฟราวสีทองแสนอบอุ่น', icon: '🛶', thumb: 'linear-gradient(180deg,#0b0c2a 0%,#5c3152 55%,#2a1d44 56%,#080612 100%)' },
    { name: 'ชายหาดแสงจันทร์', desc: 'หาดทรายใต้ทางช้างเผือก ดาวตก และคลื่นทะเลระยิบระยับ', icon: '🏝️', thumb: 'linear-gradient(180deg,#030b24 0%,#1a3a6b 55%,#0f355c 56%,#061326 100%)' }
  ];

  const WISH_PRESETS = [
    'ขอให้เรารักกันนานๆ อยู่ข้างกันทุกปีนะ 💖',
    'ขอให้ทุกเรื่องร้ายๆ ลอยไปกับสายน้ำ มีแต่รอยยิ้มด้วยกัน 🪷',
    'ขอให้สุขภาพแข็งแรง สมหวังทุกอย่าง และจับมือกันแบบนี้ตลอดไป ✨',
    'ปีนี้ลอยด้วยกัน ปีหน้าและทุกๆ ปีก็ขอให้ยังมีเธออยู่ข้างๆ นะ 🌕'
  ];
  const SWEET_IDEAS = [
    'ขอบคุณที่อยู่ข้างๆ กันเสมอนะ ไม่ว่าปีไหนๆ ก็อยากลอยกระทงกับเธอทุกปีเลย รักเธอที่สุดในโลก 💖',
    'ถึงตัวจะอยู่ไกล แต่ใจอยู่ใกล้กันเสมอนะ คืนนี้มาลอยกระทงด้วยกันนะคนเก่งของเค้า 🌕✨',
    'เธอคือคำอธิษฐานที่ดีที่สุดที่เคยเป็นจริงเลยนะ ขอบคุณที่เข้ามาเป็นความสุขของกันและกัน 💌',
    'ลอยทุกข์ลอยโศกออกไปให้หมด แล้วเก็บความรักของเราไว้ให้เต็มหัวใจเลยนะ รักนะจุ๊บๆ 🪷💕'
  ];

  /* ================= 3) STATE & SHARE ENCODING ================= */
  const DEFAULT_STATE = () => ({
    me: '', partner: '', wish: '', secret: '',
    av: [
      { hair: 0, hc: 0, skin: 1, outfit: 0, acc: 1, face: 0 },
      { hair: 3, hc: 1, skin: 0, outfit: 1, acc: 2, face: 0 }
    ],
    kt: { base: 0, flower: 0, candle: 0, label: 1, extra: 0 },
    place: 0
  });
  let state = DEFAULT_STATE();
  const ui = {
    step: 0, person: 0, lit: false, released: false, busy: false,
    receiver: false, saving: false, expanded: false,
    releaseTimer: 0, typeTimer: 0, lastPhotoBlob: null, lastPhotoName: 'loykrathong.png'
  };

  function pack(s) {
    return {
      v: 2, n: [s.me, s.partner], w: s.wish, s: s.secret,
      a: s.av.map(a => [a.hair, a.hc, a.skin, a.outfit, a.acc, a.face || 0]),
      k: [s.kt.base, s.kt.flower, s.kt.candle, s.kt.label, s.kt.extra || 0],
      p: s.place
    };
  }
  function unpack(o) {
    if (!o || typeof o !== 'object') throw new Error('invalid payload');
    const d = DEFAULT_STATE();
    const str = (v, m) => (typeof v === 'string' ? v.slice(0, m) : '');
    const ix = (v, len, def) => (Number.isInteger(v) && v >= 0 && v < len ? v : def);
    const n = Array.isArray(o.n) ? o.n : [];
    d.me = str(n[0], 24); d.partner = str(n[1], 24);
    d.wish = str(o.w, 160); d.secret = str(o.s, 300);
    if (Array.isArray(o.a)) {
      [0, 1].forEach(i => {
        const a = o.a[i], def = d.av[i];
        if (Array.isArray(a)) {
          d.av[i] = {
            hair: ix(a[0], HAIRS.length, def.hair),
            hc: ix(a[1], HAIR_COLORS.length, def.hc),
            skin: ix(a[2], SKIN_TONES.length, def.skin),
            outfit: ix(a[3], OUTFITS.length, def.outfit),
            acc: ix(a[4], ACCESSORIES.length, def.acc),
            face: ix(a[5], FACES.length, 0)
          };
        }
      });
    }
    if (Array.isArray(o.k)) {
      d.kt = {
        base: ix(o.k[0], BASES.length, 0),
        flower: ix(o.k[1], FLOWERS.length, 0),
        candle: ix(o.k[2], CANDLES.length, 0),
        label: o.k[3] === 0 ? 0 : 1,
        extra: ix(o.k[4], EXTRAS.length, 0)
      };
    }
    d.place = ix(o.p, PLACES.length, 0);
    return d;
  }
  // UTF-8 safe Base64 (URL-safe variant)
  function encodeState(s) {
    const bytes = new TextEncoder().encode(JSON.stringify(pack(s)));
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function decodeState(code) {
    let b = String(code).trim().replace(/ /g, '+').replace(/-/g, '+').replace(/_/g, '/');
    while (b.length % 4) b += '=';
    const bin = atob(b);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return unpack(JSON.parse(new TextDecoder().decode(bytes)));
  }
  const DRAFT_KEY = 'loykrathong-love-draft-v2';
  function saveDraft(s) {
    if (!s && ui.receiver) return;
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(pack(s || state))); } catch (e) { /* ignore */ }
  }
  function loadDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY) || localStorage.getItem('loykrathong-love-draft-v1');
      if (raw) state = unpack(JSON.parse(raw));
    } catch (e) { state = DEFAULT_STATE(); }
  }

  /* ================= 4) SVG BUILDERS ================= */
  const strokePath = (d, c, w = 11) => `<path d="${d}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" fill="none"/>`;
  const HL = '<path d="M40,38 Q50,31 63,31" stroke="#fff" stroke-opacity=".3" stroke-width="3" stroke-linecap="round" fill="none"/>';

  function hairBack(style, c, d) {
    switch (style) {
      case 2: return `<path d="M26,62 Q22,24 60,23 Q98,24 94,62 L98,132 Q80,140 60,136 Q40,140 22,132 Z" fill="${c}"/><path d="M30,80 L28,128" stroke="${d}" stroke-width="1.5" opacity=".5"/>`;
      case 3: return `<circle cx="60" cy="24" r="15" fill="${c}"/><path d="M50,18 Q60,12 70,18" stroke="${d}" stroke-width="1.5" fill="none" opacity=".6"/>`;
      case 4: return `<path d="M84,40 Q118,48 106,100 Q104,112 96,120 Q102,96 92,74 Q88,58 80,50 Z" fill="${c}"/><path d="M96,60 Q104,80 98,108" stroke="${d}" stroke-width="1.4" fill="none" opacity=".5"/>`;
      case 5: return `<path d="M26,64 Q24,26 60,26 Q96,26 94,64 L96,96 Q84,102 78,94 L42,94 Q36,102 24,96 Z" fill="${c}"/>`;
      case 6: return `<path d="M25,62 Q22,24 60,23 Q98,24 95,62 Q103,82 95,102 Q102,120 92,136 Q76,144 60,138 Q44,144 28,136 Q18,120 25,102 Q17,82 25,62 Z" fill="${c}"/><path d="M28,84 Q34,96 28,110 M92,84 Q86,96 92,110" stroke="${d}" stroke-width="1.4" fill="none" opacity=".45"/>`;
      default: return '';
    }
  }
  function hairFront(style, c, d) {
    switch (style) {
      case 0: return `<path d="M28,66 Q24,28 60,27 Q96,28 92,66 Q90,52 85,47 L81,54 L75,45 L68,53 L61,44 L54,53 L47,45 L41,54 L35,47 Q30,54 28,66 Z" fill="${c}"/>${HL}`;
      case 1: return `<path d="M28,68 Q22,26 62,26 Q98,28 92,66 Q88,44 70,42 Q56,42 46,52 Q38,58 34,52 Q30,58 28,68 Z" fill="${c}"/><path d="M70,42 Q58,44 48,52" stroke="${d}" stroke-width="1.4" fill="none" opacity=".6"/>${HL}`;
      case 2:
      case 6: return `<path d="M28,72 Q24,26 60,26 Q96,26 92,72 Q90,50 76,42 Q68,40 60,34 Q52,40 44,42 Q30,50 28,72 Z" fill="${c}"/><path d="M28,60 Q24,90 30,112 L36,110 Q32,86 34,62 Z" fill="${c}"/><path d="M92,60 Q96,90 90,112 L84,110 Q88,86 86,62 Z" fill="${c}"/>${HL}`;
      case 3: return `<path d="M28,62 Q27,28 60,28 Q93,28 92,62 Q86,42 66,40 Q60,46 54,40 Q34,42 28,62 Z" fill="${c}"/><ellipse cx="60" cy="37" rx="11" ry="2.6" fill="#f4c76b"/><circle cx="60" cy="37" r="2.2" fill="#e11d48"/>${HL}`;
      case 4: return `<path d="M28,64 Q26,26 60,26 Q94,26 92,64 Q86,44 72,40 Q66,50 50,50 Q38,50 32,46 Q29,54 28,64 Z" fill="${c}"/><circle cx="85" cy="42" r="4.6" fill="#f472b6"/>${HL}`;
      case 5: return `<path d="M27,64 Q25,27 60,27 Q95,27 93,64 L91,51 Q60,46 29,51 Z" fill="${c}"/>${HL}`;
      default: return '';
    }
  }
  const shoes = (c, y = 202) => `<ellipse cx="45" cy="${y}" rx="10" ry="4.5" fill="${c}" stroke="#000" stroke-opacity=".15"/><ellipse cx="75" cy="${y}" rx="10" ry="4.5" fill="${c}" stroke="#000" stroke-opacity=".15"/>`;

  function lowerBody(o, skin) {
    const lc = o.lowerColor;
    switch (o.lower) {
      case 'pants':
        return `<path d="M33,150 L87,150 L85,199 L64,199 L60,168 L56,199 L35,199 Z" fill="${lc}"/><path d="M60,168 L60,154" stroke="${shade(lc, -0.25)}" stroke-width="1.2"/>${shoes(o.shoe)}`;
      case 'jong':
        return `<rect x="41" y="184" width="9" height="15" fill="${skin}"/><rect x="70" y="184" width="9" height="15" fill="${skin}"/>
          <path d="M31,150 L89,150 L85,188 L64,190 L60,172 L56,190 L35,188 Z" fill="${lc}"/>
          <path d="M60,172 L60,152 M40,160 Q46,172 42,186 M80,160 Q74,172 78,186" stroke="${shade(lc, -0.25)}" stroke-width="1.2" fill="none"/>${shoes(o.shoe)}`;
      case 'skirt': {
        let dots = '';
        if (o.deco === 'dress') [[44, 162], [60, 170], [76, 162], [38, 178], [54, 183], [70, 180], [84, 178]].forEach(([x, y]) => { dots += `<circle cx="${x}" cy="${y}" r="2.4" fill="#fff" opacity=".75"/>`; });
        return `<rect x="44" y="184" width="9" height="15" fill="${skin}"/><rect x="67" y="184" width="9" height="15" fill="${skin}"/>
          <path d="M34,148 L86,148 L97,186 Q60,195 23,186 Z" fill="${lc}"/>${dots}${shoes(o.shoe)}`;
      }
      case 'longskirt': {
        let zz = 'M36,192';
        for (let x = 36; x < 84; x += 4) zz += ` L${x + 2},189 L${x + 4},192`;
        const hem = o.deco === 'yukata'
          ? `<circle cx="46" cy="176" r="4" fill="#f9a8d4" opacity=".6"/><circle cx="72" cy="184" r="3.4" fill="#fde68a" opacity=".65"/><circle cx="58" cy="190" r="2.8" fill="#fbcfe8" opacity=".6"/>`
          : `<rect x="34.6" y="187" width="50.8" height="8" fill="#f4c76b"/><path d="${zz}" stroke="#b7862f" stroke-width="1" fill="none"/>`;
        return `<path d="M33,148 L87,148 L85,200 L35,200 Z" fill="${lc}"/>
          <path d="M42,150 L41,198 M78,150 L79,198" stroke="${shade(lc, 0.2)}" stroke-width="1" opacity=".5"/>${hem}
          <ellipse cx="48" cy="202" rx="8" ry="3.6" fill="${o.shoe}"/><ellipse cx="72" cy="202" rx="8" ry="3.6" fill="${o.shoe}"/>`;
      }
      default: return '';
    }
  }

  function outfitDeco(o, skin, top) {
    const g = '#f4c76b';
    switch (o.deco) {
      case 'raj':
        return `<rect x="49" y="93" width="22" height="7" rx="3" fill="${shade(top, -0.08)}"/>
          <path d="M60,100 L60,152" stroke="${shade(top, -0.15)}" stroke-width="1.2"/>
          ${[108, 119, 130, 141].map(y => `<circle cx="60" cy="${y}" r="1.9" fill="${g}" stroke="#b7862f" stroke-width=".5"/>`).join('')}
          <path d="M41,118 L51,118" stroke="${shade(top, -0.15)}" stroke-width="1.2"/>`;
      case 'sabai':
        return `<path d="M34,121 Q60,115 86,121 L87.5,136 Q60,130 32.5,136 Z" fill="#f7b6c8"/>
          <path d="M36,104 Q43,95 54,97 L88,138 L88,152 L72,152 Z" fill="#e8638f"/>
          <path d="M36,104 Q43,95 54,97 L88,138" stroke="${g}" stroke-width="1.6" fill="none"/>
          <path d="M39,109 L73,151" stroke="${g}" stroke-width="1.2" stroke-dasharray="2 3" fill="none"/>
          <rect x="32" y="145" width="56" height="7" rx="2" fill="${g}"/><circle cx="60" cy="148.5" r="3" fill="#fff3c4"/>`;
      case 'silk':
        return `<path d="M47,97 Q60,112 73,97" stroke="${g}" stroke-width="3" fill="none" stroke-linecap="round"/>
          <path d="M42,108 Q46,130 40,150 L48,150 Q52,128 48,108 Z" fill="#fff" opacity=".13"/>
          <rect x="32" y="144" width="56" height="7" rx="2" fill="${g}"/>
          <path d="M36,147.5 L84,147.5" stroke="#b7862f" stroke-width="1" stroke-dasharray="3 3"/>`;
      case 'hoodie': {
        const d = shade(top, -0.12);
        return `<path d="M42,99 Q60,112 78,99 Q76,93 60,93 Q44,93 42,99 Z" fill="${d}"/>
          <path d="M55,103 L54,119 M65,103 L66,119" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>
          <circle cx="54" cy="120" r="1.6" fill="#fff"/><circle cx="66" cy="120" r="1.6" fill="#fff"/>
          <path d="M44,132 L76,132 L80,149 L40,149 Z" fill="${d}"/>
          <path d="M60,124 c-2,-3 -6,-1 -4,2 l4,4 l4,-4 c2,-3 -2,-5 -4,-2 z" fill="#fff" opacity=".9"/>`;
      }
      case 'coupletee':
        return `<path d="M50,97 Q60,104 70,97" stroke="#e5e7eb" stroke-width="2.2" fill="none"/>
          <path d="M86.5,150 C76,142 70,136 72,130 C74,124 82,123 86.5,128 Z" fill="#e11d48"/>`;
      case 'dress':
        return `<path d="M47,96 Q50,106 60,101 Q70,106 73,96 Z" fill="#fff"/>
          <rect x="32" y="143" width="56" height="6" rx="2" fill="#f472b6"/>
          <path d="M60,146 l-7,-5 v10 z M60,146 l7,-5 v10 z" fill="#ec4899"/><circle cx="60" cy="146" r="2.2" fill="#fbcfe8"/>`;
      case 'yukata':
        return `<path d="M46,96 L60,120 L74,96" stroke="#fbcfe8" stroke-width="3.2" fill="none" stroke-linejoin="round"/>
          <path d="M49,96 L60,115 L71,96" stroke="#fff" stroke-width="1.4" fill="none"/>
          <rect x="32" y="138" width="56" height="14" rx="2" fill="#f472b6"/>
          <path d="M32,145 L88,145" stroke="${g}" stroke-width="2"/>
          <circle cx="60" cy="145" r="3" fill="${g}"/>`;
      default: return '';
    }
  }

  function arms(o, skin) {
    const sc = o.sleeveColor || skin;
    const outer = 'M39,104 L30,138', inner = 'M81,104 L101,131';
    let s = '';
    if (o.sleeve === 'long') {
      s += strokePath(outer, sc) + strokePath(inner, sc);
    } else {
      s += strokePath(outer, skin) + strokePath(inner, skin);
      if (o.sleeve === 'short') s += strokePath('M39,104 L35.6,117', sc, 12.5) + strokePath('M81,104 L88,114', sc, 12.5);
      if (o.sleeve === 'puff') s += `<circle cx="38" cy="105" r="9" fill="${sc}"/><circle cx="82" cy="105" r="9" fill="${sc}"/>`;
    }
    s += `<circle cx="29" cy="143" r="6" fill="${skin}"/><circle cx="104" cy="134" r="6" fill="${skin}"/>`;
    return s;
  }

  function face(skin, skinD, expr = 0) {
    const blink = '<animate attributeName="ry" values="4.4;4.4;0.5;4.4" keyTimes="0;0.92;0.96;1" dur="4.6s" repeatCount="indefinite"/>';
    let eyes = '', blushOp = '.5', mouth = '<path d="M55,78 Q60,83 65,78" stroke="#b4505e" stroke-width="2" fill="none" stroke-linecap="round"/>';
    if (expr === 1) { // เขินแก้มแดง
      blushOp = '.82';
      eyes = `<path d="M44,68 Q48,63 52,68" stroke="#2e2224" stroke-width="2.2" fill="none" stroke-linecap="round"/>
              <path d="M68,68 Q72,63 76,68" stroke="#2e2224" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
      mouth = '<path d="M56,79 Q60,82 64,79" stroke="#b4505e" stroke-width="1.8" fill="none" stroke-linecap="round"/>';
    } else if (expr === 2) { // ขยิบตา
      eyes = `<ellipse cx="48" cy="67" rx="3.6" ry="4.4" fill="#2e2224">${blink}</ellipse>
              <circle cx="49.3" cy="65.3" r="1.4" fill="#fff"/>
              <path d="M67,67 Q72,63 77,67" stroke="#2e2224" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
      mouth = '<path d="M54,77 Q60,84 66,77" stroke="#b4505e" stroke-width="2" fill="none" stroke-linecap="round"/>';
    } else if (expr === 3) { // ตาเป็นประกาย
      blushOp = '.62';
      eyes = `<ellipse cx="48" cy="67" rx="4" ry="4.8" fill="#2e2224"/>
              <ellipse cx="72" cy="67" rx="4" ry="4.8" fill="#2e2224"/>
              <circle cx="49.5" cy="65" r="1.8" fill="#fff"/><circle cx="46.4" cy="69" r=".9" fill="#fde68a"/>
              <circle cx="73.5" cy="65" r="1.8" fill="#fff"/><circle cx="70.4" cy="69" r=".9" fill="#fde68a"/>`;
      mouth = '<path d="M55,77 Q60,84 65,77 Z" fill="#f472b6" stroke="#b4505e" stroke-width="1.2"/>';
    } else {
      eyes = `<ellipse cx="48" cy="67" rx="3.6" ry="4.4" fill="#2e2224">${blink}</ellipse>
              <ellipse cx="72" cy="67" rx="3.6" ry="4.4" fill="#2e2224">${blink}</ellipse>
              <circle cx="49.3" cy="65.3" r="1.4" fill="#fff"/><circle cx="73.3" cy="65.3" r="1.4" fill="#fff"/>`;
    }
    return `<circle cx="29" cy="66" r="6" fill="${skin}"/><circle cx="91" cy="66" r="6" fill="${skin}"/>
      <circle cx="29" cy="66" r="3" fill="${skinD}"/><circle cx="91" cy="66" r="3" fill="${skinD}"/>
      <ellipse cx="60" cy="62" rx="31" ry="30" fill="${skin}"/>
      <ellipse cx="42" cy="76" rx="5.8" ry="3.3" fill="#ff8fa3" opacity="${blushOp}"/><ellipse cx="78" cy="76" rx="5.8" ry="3.3" fill="#ff8fa3" opacity="${blushOp}"/>
      ${eyes}${mouth}`;
  }

  function smallFlower(x, y, r, petal, center) {
    let s = '';
    for (let k = 0; k < 5; k++) {
      const a = k * TAU / 5 - Math.PI / 2;
      s += `<circle cx="${f1(x + Math.cos(a) * r)}" cy="${f1(y + Math.sin(a) * r)}" r="${f1(r * 0.85)}" fill="${petal}"/>`;
    }
    return s + `<circle cx="${x}" cy="${y}" r="${f1(r * 0.65)}" fill="${center}"/>`;
  }

  function accessory(i, skin) {
    switch (i) {
      case 1: { // พวงมาลัย
        let s = '';
        const P0 = [44, 98], C = [60, 136], P2 = [76, 98];
        for (let k = 0; k <= 12; k++) {
          if (k === 6) continue;
          const t = k / 12;
          const x = (1 - t) ** 2 * P0[0] + 2 * (1 - t) * t * C[0] + t * t * P2[0];
          const y = (1 - t) ** 2 * P0[1] + 2 * (1 - t) * t * C[1] + t * t * P2[1];
          s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="3.3" fill="${k % 3 === 0 ? '#fff2a8' : '#fffdf6'}" stroke="#e5dcc0" stroke-width=".6"/>`;
        }
        return s + `<path d="M60,121 L60,134" stroke="#f4c76b" stroke-width="1.4"/>
          <circle cx="60" cy="118" r="5.2" fill="#e11d48"/><circle cx="60" cy="118" r="2.4" fill="#9f1239"/>
          <circle cx="57" cy="135" r="2" fill="#fde047"/><circle cx="63" cy="135" r="2" fill="#fde047"/>
          <path d="M56,137 l2,6 M64,137 l-2,6" stroke="#22c55e" stroke-width="1.6" stroke-linecap="round"/>`;
      }
      case 2: // กิ๊บดอกไม้
        return `<ellipse cx="78" cy="45" rx="4.5" ry="2" fill="#4ade80" transform="rotate(-30 78 45)"/>
          ${smallFlower(85, 40, 4.2, '#f9a8d4', '#fde047')}${smallFlower(92, 48, 2.8, '#fbcfe8', '#fde68a')}`;
      case 3: { // มงกุฎดอกไม้
        let s = '<path d="M29,47 Q60,8 91,47" stroke="#4ade80" stroke-width="3" fill="none" stroke-linecap="round"/>';
        const cols = ['#f9a8d4', '#ffffff', '#fde047', '#c4b5fd'];
        for (let k = 0; k < 9; k++) {
          const a = (200 + k * 17.5) * Math.PI / 180;
          s += smallFlower(f1(60 + Math.cos(a) * 33), f1(56 + Math.sin(a) * 27), 3.3, cols[k % 4], k % 4 === 2 ? '#f97316' : '#fde047');
        }
        return s;
      }
      case 4: // แว่นตา
        return `<g fill="#fff" fill-opacity=".15" stroke="#3b2f2f" stroke-width="1.8"><circle cx="48" cy="67" r="8"/><circle cx="72" cy="67" r="8"/></g>
          <path d="M56,66 Q60,63 64,66 M40,66 L31,63 M80,66 L89,63" stroke="#3b2f2f" stroke-width="1.8" fill="none"/>`;
      case 5: // ช่อดอกไม้
        return `<path d="M22,141 L36,141 L29,163 Z" fill="#fde68a" stroke="#f4c76b" stroke-width=".8"/>
          <ellipse cx="21" cy="137" rx="4.5" ry="2" fill="#4ade80" transform="rotate(-30 21 137)"/>
          <ellipse cx="37" cy="137" rx="4.5" ry="2" fill="#4ade80" transform="rotate(30 37 137)"/>
          <circle cx="24" cy="135" r="4.2" fill="#f43f5e"/><circle cx="34" cy="135" r="4.2" fill="#fb7185"/><circle cx="29" cy="130" r="4.4" fill="#e11d48"/>
          <circle cx="29" cy="130" r="1.6" fill="#9f1239"/><circle cx="29" cy="145" r="5.5" fill="${skin}"/>`;
      case 6: // โบว์น่ารัก
        return `<g transform="translate(82,36) rotate(18)">
          <path d="M0,0 C-10,-8 -14,2 -10,7 C-6,10 -2,4 0,0 Z" fill="#f472b6" stroke="#db2777" stroke-width=".8"/>
          <path d="M0,0 C10,-8 14,2 10,7 C6,10 2,4 0,0 Z" fill="#f472b6" stroke="#db2777" stroke-width=".8"/>
          <circle cx="0" cy="1" r="3" fill="#fbcfe8" stroke="#db2777" stroke-width=".8"/>
        </g>`;
      default: return '';
    }
  }

  function avatarSVG(a) {
    const skin = SKIN_TONES[a.skin].c, skinD = shade(skin, -0.12);
    const hair = HAIR_COLORS[a.hc].c, hairD = shade(hair, -0.3);
    const o = OUTFITS[a.outfit];
    const top = o.top === 'skin' ? skin : o.top;
    return [
      hairBack(a.hair, hair, hairD),
      lowerBody(o, skin),
      `<rect x="53" y="84" width="14" height="16" rx="4" fill="${skinD}"/>`,
      `<path d="M36,106 Q38,97 50,96 L70,96 Q82,97 84,106 L88,152 L32,152 Z" fill="${top}"/>`,
      `<path d="M70,96 Q82,97 84,106 L88,152 L76,152 Z" fill="#000" opacity=".07"/>`,
      outfitDeco(o, skin, top),
      arms(o, skin),
      face(skin, skinD, a.face || 0),
      hairFront(a.hair, hair, hairD),
      accessory(a.acc, skin)
    ].join('');
  }

  function coupleSVG() {
    return `<svg viewBox="0 0 230 226" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="ตัวละครคู่รัก">
      <ellipse cx="115" cy="212" rx="98" ry="8" fill="#000" opacity=".28"/>
      <g transform="translate(10,4)">${avatarSVG(state.av[0])}</g>
      <g transform="translate(218,4) scale(-1,1)">${avatarSVG(state.av[1])}</g>
      <g transform="translate(114,22)"><g>
        <path d="${HEART}" fill="#ff6b8b"/><path d="M-6,-8 Q-4,-11 -1.5,-9" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".85"/>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -5;0 0" dur="2.4s" repeatCount="indefinite"/>
      </g></g>
      <g fill="#fde68a"><circle cx="98" cy="12" r="1.3"><animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite"/></circle>
      <circle cx="132" cy="8" r="1.6"><animate attributeName="opacity" values="1;0;1" dur="2.6s" repeatCount="indefinite"/></circle></g>
    </svg>`;
  }

  /* ---- Krathong parts ---- */
  function petalPath(L, W) {
    return `M0,0 C${-W},${f1(-L * 0.35)} ${f1(-W * 0.6)},${f1(-L * 0.85)} 0,${-L} C${f1(W * 0.6)},${f1(-L * 0.85)} ${W},${f1(-L * 0.35)} 0,0 Z`;
  }
  function baseLeaf() {
    let back = '', front = '';
    for (let i = 0; i < 9; i++) {
      const x = 40 + i * 15;
      back += `<path d="M${x - 9},118 L${x},${i % 2 ? 94 : 89} L${x + 9},118 Z" fill="${i % 2 ? '#2f7d3c' : '#3a9149'}" stroke="#6cc07a" stroke-width=".8"/>`;
    }
    for (let i = 0; i < 9; i++) {
      const x = 44 + i * 14, u = (x - 100) / 62, by = 137 + 7 * (1 - u * u);
      front += `<path d="M${x - 8},${f1(by)} L${x},${f1(by - 26)} L${x + 8},${f1(by)} Z" fill="${i % 2 ? '#2d7a3a' : '#43a052'}" stroke="#7fd08b" stroke-width=".8"/>
        <path d="M${x},${f1(by - 23)} L${x},${f1(by - 2)}" stroke="#a7e3b0" stroke-width=".6" opacity=".7"/>`;
    }
    return {
      under: `<path d="M32,114 L168,114 L160,140 Q100,156 40,140 Z" fill="url(#ktTrunk)"/>${back}
        <ellipse cx="100" cy="114" rx="68" ry="12" fill="#eef4c8" stroke="#c8d88e" stroke-width="1"/>
        <ellipse cx="100" cy="114" rx="52" ry="8" fill="none" stroke="#d6e3a2" stroke-width="1"/>${front}`,
      over: ''
    };
  }
  function baseLotus() {
    let back = '', mid = '', front = '';
    for (let a = -80; a <= 80; a += 16) back += `<path d="${petalPath(50, 15)}" transform="translate(100,132) rotate(${a})" fill="url(#ktPetalA)" stroke="#f9a8d4" stroke-width=".8"/>`;
    for (let k = 0; k < 7; k++) { const a = -63 + k * 21; mid += `<path d="${petalPath(42, 14)}" transform="translate(100,136) rotate(${a})" fill="url(#ktPetalB)" stroke="#fbcfe8" stroke-width=".8"/>`; }
    [-62, -36, 36, 62].forEach(a => { front += `<path d="${petalPath(34, 14)}" transform="translate(100,144) rotate(${a})" fill="url(#ktPetalA)" stroke="#fce7f3" stroke-width="1"/>`; });
    return {
      under: `<ellipse cx="100" cy="141" rx="82" ry="13" fill="#2f7d3c"/><ellipse cx="100" cy="138" rx="75" ry="10" fill="#47a556"/>
        <path d="M100,138 L100,151" stroke="#2f7d3c" stroke-width="2"/>${back}${mid}
        <ellipse cx="100" cy="118" rx="44" ry="10" fill="#fde68a" opacity=".85"/>`,
      over: front
    };
  }
  function baseBread() {
    let dots = '', braid = '';
    const R = mulberry32(7);
    for (let i = 0; i < 26; i++) dots += `<ellipse cx="${f1(46 + R() * 108)}" cy="${f1(119 + R() * 18)}" rx="1.6" ry=".9" fill="#f6e3b4" opacity=".8"/>`;
    for (let a = 0; a <= 180; a += 12) {
      const r = a * Math.PI / 180;
      braid += `<circle cx="${f1(100 + 62 * Math.cos(r))}" cy="${f1(113 + 12 * Math.sin(r))}" r="5.4" fill="#dc9d57" stroke="#a7652c" stroke-width=".8"/>`;
    }
    return {
      under: `<path d="M34,112 L166,112 L158,140 Q100,156 42,140 Z" fill="url(#ktBread)"/>${dots}
        <path d="M52,130 q10,-6 20,0 M90,136 q10,-6 20,0 M128,130 q10,-6 20,0" stroke="#6b3a17" stroke-width="1.4" fill="none" opacity=".55"/>
        <ellipse cx="100" cy="112" rx="66" ry="13" fill="#e7b574"/><ellipse cx="100" cy="112" rx="50" ry="8" fill="#f1cd92"/>
        <path d="M52,108 q-14,-14 -6,-28 q12,8 6,28 z" fill="#3a9149"/><path d="M148,108 q14,-14 6,-28 q-12,8 -6,28 z" fill="#3a9149"/>`,
      over: braid
    };
  }
  function baseCoconut() {
    let rim = '';
    for (let a = 0; a <= 180; a += 15) {
      const r = a * Math.PI / 180;
      rim += `<circle cx="${f1(100 + 64 * Math.cos(r))}" cy="${f1(115 + 11 * Math.sin(r))}" r="2.6" fill="#f4c76b"/>`;
    }
    return {
      under: `<path d="M32,114 Q36,154 100,154 Q164,154 168,114 Z" fill="url(#ktCoco)"/>
        <path d="M46,126 Q100,140 154,126" stroke="#f4c76b" stroke-width="1.2" stroke-dasharray="4 4" fill="none" opacity=".65"/>
        <ellipse cx="100" cy="114" rx="68" ry="12" fill="#8b5a2b" stroke="#f4c76b" stroke-width="1.4"/>
        <ellipse cx="100" cy="114" rx="58" ry="9" fill="#f8ecd4"/>`,
      over: rim
    };
  }

  function fMarigold(x, y, r) {
    let s = '';
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; s += `<circle cx="${f1(x + Math.cos(a) * r * 0.62)}" cy="${f1(y + Math.sin(a) * r * 0.52)}" r="${f1(r * 0.45)}" fill="#f59e0b"/>`; }
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.3; s += `<circle cx="${f1(x + Math.cos(a) * r * 0.32)}" cy="${f1(y + Math.sin(a) * r * 0.28)}" r="${f1(r * 0.38)}" fill="#fbbf24"/>`; }
    return s + `<circle cx="${x}" cy="${y}" r="${f1(r * 0.28)}" fill="#f97316"/>`;
  }
  function fRose(x, y, r) {
    return `<ellipse cx="${x - r * 0.9}" cy="${y + r * 0.4}" rx="${f1(r * 0.6)}" ry="${f1(r * 0.28)}" fill="#22a04b" transform="rotate(-20 ${x - r * 0.9} ${y + r * 0.4})"/>
      <ellipse cx="${x + r * 0.9}" cy="${y + r * 0.4}" rx="${f1(r * 0.6)}" ry="${f1(r * 0.28)}" fill="#22a04b" transform="rotate(20 ${x + r * 0.9} ${y + r * 0.4})"/>
      <circle cx="${x}" cy="${y}" r="${r}" fill="#e11d48"/>
      <path d="M${f1(x - r * 0.6)},${f1(y + r * 0.15)} Q${x},${f1(y - r * 0.85)} ${f1(x + r * 0.6)},${f1(y + r * 0.1)}" stroke="#9f1239" stroke-width="1.2" fill="none"/>
      <path d="M${f1(x - r * 0.35)},${f1(y + r * 0.4)} Q${f1(x + r * 0.1)},${f1(y - r * 0.4)} ${f1(x + r * 0.4)},${f1(y + r * 0.35)}" stroke="#9f1239" stroke-width="1.1" fill="none"/>
      <circle cx="${x}" cy="${f1(y - r * 0.1)}" r="${f1(r * 0.24)}" fill="#be123c"/>
      <circle cx="${f1(x - r * 0.4)}" cy="${f1(y - r * 0.45)}" r="${f1(r * 0.18)}" fill="#fff" opacity=".35"/>`;
  }
  function fOrchid(x, y, r) {
    let s = '';
    for (let i = 0; i < 5; i++) {
      const deg = -90 + i * 72, a = deg * Math.PI / 180;
      const px = f1(x + Math.cos(a) * r * 0.5), py = f1(y + Math.sin(a) * r * 0.5);
      s += `<ellipse cx="${px}" cy="${py}" rx="${f1(r * 0.58)}" ry="${f1(r * 0.36)}" fill="#d8b4fe" stroke="#a855f7" stroke-width=".8" transform="rotate(${deg} ${px} ${py})"/>`;
    }
    return s + `<ellipse cx="${x}" cy="${f1(y + r * 0.28)}" rx="${f1(r * 0.3)}" ry="${f1(r * 0.36)}" fill="#7e22ce"/><circle cx="${x}" cy="${y}" r="${f1(r * 0.17)}" fill="#fde047"/>`;
  }
  function fGlobe(x, y, r) {
    let s = `<ellipse cx="${x}" cy="${f1(y + r * 0.55)}" rx="${f1(r * 0.9)}" ry="${f1(r * 0.25)}" fill="#22a04b"/>`;
    [[-0.45, 0.1], [0.45, 0.1], [0, -0.32]].forEach(([dx, dy]) => {
      const cx = f1(x + dx * r), cy = f1(y + dy * r);
      s += `<circle cx="${cx}" cy="${cy}" r="${f1(r * 0.5)}" fill="#c026d3"/>
        <circle cx="${f1(cx - r * 0.15)}" cy="${f1(cy - r * 0.15)}" r="${f1(r * 0.16)}" fill="#f0abfc" opacity=".8"/>
        <circle cx="${f1(cx + r * 0.2)}" cy="${f1(cy + r * 0.1)}" r="${f1(r * 0.07)}" fill="#86198f"/>`;
    });
    return s;
  }
  function fJasmine(x, y, r) {
    let s = `<ellipse cx="${x}" cy="${f1(y + r * 0.45)}" rx="${f1(r * 0.85)}" ry="${f1(r * 0.26)}" fill="#22a04b"/>`;
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * TAU;
      s += `<circle cx="${f1(x + Math.cos(a) * r * 0.48)}" cy="${f1(y + Math.sin(a) * r * 0.44)}" r="${f1(r * 0.42)}" fill="#fffdf7" stroke="#e5e7eb" stroke-width=".6"/>`;
    }
    return s + `<circle cx="${x}" cy="${y}" r="${f1(r * 0.25)}" fill="#fde047"/>`;
  }
  const FLOWER_FNS = [fMarigold, fRose, fOrchid, fGlobe, fJasmine];
  const FLOWER_POS = [[66, 104, 10], [134, 104, 10], [50, 115, 9], [150, 115, 9], [80, 117, 11], [120, 117, 11], [100, 123, 11]];

  function candleIncense() {
    return {
      svg: `<path d="M84,113 L73,58 M87,113 L80,55 M90,113 L87,58" stroke="#a87444" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M75.4,70 L73,58 M81.4,67 L80,55 M87.6,70 L87,58" stroke="#9a3412" stroke-width="2.8" stroke-linecap="round"/>
        <rect x="94" y="64" width="12" height="48" rx="2.5" fill="url(#ktWax)" stroke="#e8d3ad" stroke-width=".8"/>
        <ellipse cx="100" cy="64" rx="6" ry="2" fill="#fffaf0"/>
        <path d="M95.5,66 q1,7 2,0 M102.5,66 q1,10 2,0" stroke="#fff" stroke-width="1.6" fill="none"/>
        <path d="M100,64 L100,59" stroke="#3b2f2f" stroke-width="1.2"/>`,
      wicks: [[100, 59]], embers: [[73, 58], [80, 55], [87, 58]]
    };
  }
  function candleLotus() {
    let cup = '';
    [-70, -35, 0, 35, 70].forEach(a => { cup += `<path d="${petalPath(16, 7)}" transform="translate(100,112) rotate(${a})" fill="#fbcfe8" stroke="#f9a8d4" stroke-width=".7"/>`; });
    return {
      svg: `<rect x="90" y="88" width="20" height="22" rx="4" fill="#ffe4ec" stroke="#f9c6d6" stroke-width=".8"/>
        <ellipse cx="100" cy="88" rx="10" ry="2.6" fill="#fff5f8"/>${cup}<path d="M100,88 L100,83" stroke="#3b2f2f" stroke-width="1.2"/>`,
      wicks: [[100, 83]]
    };
  }
  function candleTwin() {
    return {
      svg: `<rect x="80" y="76" width="11" height="36" rx="2.5" fill="#ffd1dc" stroke="#f9a8c0" stroke-width=".8"/><ellipse cx="85.5" cy="76" rx="5.5" ry="1.8" fill="#ffe4ec"/>
        <rect x="109" y="68" width="11" height="44" rx="2.5" fill="#fde68a" stroke="#f4c76b" stroke-width=".8"/><ellipse cx="114.5" cy="68" rx="5.5" ry="1.8" fill="#fef3c7"/>
        <path d="M85.5,76 L85.5,71 M114.5,68 L114.5,63" stroke="#3b2f2f" stroke-width="1.2"/>
        <g transform="translate(100,98) scale(.6)"><path d="${HEART}" fill="#f43f5e"/></g>`,
      wicks: [[85.5, 71], [114.5, 63]]
    };
  }
  const CANDLE_FNS = [candleIncense, candleLotus, candleTwin];

  function extraSVG(id) {
    if (id === 1) { // เหรียญนำโชค
      return `<g transform="translate(65,123)">
        <ellipse cx="0" cy="0" rx="8" ry="4.5" fill="#f59e0b" stroke="#fde68a" stroke-width="1"/>
        <ellipse cx="10" cy="3" rx="7" ry="4" fill="#fbbf24" stroke="#fef3c7" stroke-width=".9"/>
      </g>`;
    }
    if (id === 2) { // ผีเสื้อเรืองแสง
      return `<g transform="translate(46,72)"><g>
        <ellipse cx="-6" cy="-3" rx="7" ry="5" fill="#a78bfa" opacity=".88" transform="rotate(-24 -6 -3)"/>
        <ellipse cx="6" cy="-3" rx="7" ry="5" fill="#f472b6" opacity=".88" transform="rotate(24 6 -3)"/>
        <ellipse cx="-4" cy="4" rx="4.5" ry="3.2" fill="#c4b5fd" opacity=".8"/>
        <ellipse cx="4" cy="4" rx="4.5" ry="3.2" fill="#fbcfe8" opacity=".8"/>
        <rect x="-1" y="-5" width="2" height="10" rx="1" fill="#fde68a"/>
        <animateTransform attributeName="transform" type="translate" values="0 0;3 -6;0 0" dur="2.8s" repeatCount="indefinite"/>
      </g></g>`;
    }
    if (id === 3) { // หัวใจคู่ลอย
      return `<g transform="translate(48,74)"><g>
        <g transform="scale(.55)"><path d="${HEART}" fill="#ff6b8b"/></g>
        <g transform="translate(12,-10) scale(.38)"><path d="${HEART}" fill="#fde68a"/></g>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -6;0 0" dur="2.5s" repeatCount="indefinite"/>
      </g></g>`;
    }
    return '';
  }

  function flamesSVG(wicks, lit) {
    return wicks.map(([x, y]) => `<g data-flame="1" style="opacity:${lit ? 1 : 0};transition:opacity 1.2s ease">
      <circle cx="${x}" cy="${y - 10}" r="24" fill="url(#ktGlow)"/>
      <g transform="translate(${x},${y})"><g>
        <path d="M0,-23 C7,-13 7.5,-4 0,1 C-7.5,-4 -7,-13 0,-23 Z" fill="#ffa53a"/>
        <path d="M0,-15 C3.8,-9 3.8,-3 0,0 C-3.8,-3 -3.8,-9 0,-15 Z" fill="#fff4c4"/>
        <animateTransform attributeName="transform" type="scale" values="1 1;0.9 1.12;1.06 0.94;0.95 1.07;1 1" dur="0.9s" repeatCount="indefinite"/>
      </g></g></g>`).join('');
  }
  function embersSVG(pts, lit) {
    return `<g data-flame="1" style="opacity:${lit ? 1 : 0};transition:opacity 1.2s ease">` + pts.map(([x, y], i) =>
      `<circle cx="${x}" cy="${y}" r="5" fill="url(#ktGlow)"/><circle cx="${x}" cy="${y}" r="1.9" fill="#ff5a1f"/>
       <path d="M${x},${y - 3} q-3,-6 0,-12 q3,-6 0,-12" stroke="#fff" stroke-opacity=".35" stroke-width="1" fill="none">
         <animate attributeName="opacity" values="0;1;0" dur="${2.4 + i * 0.5}s" repeatCount="indefinite"/></path>`).join('') + '</g>';
  }
  function labelSVG() {
    const t = `${trunc(state.me.trim() || 'เรา', 8)} ♥ ${trunc(state.partner.trim() || 'แฟน', 8)}`;
    const len = graphemes(t).length;
    const fs = len > 13 ? 7.4 : len > 10 ? 8.2 : 9;
    return `<path d="M156,118 L162,10" stroke="#8b5a2b" stroke-width="2.4" stroke-linecap="round"/>
      <rect x="102" y="8" width="60" height="28" rx="7" fill="#fff5f7" stroke="#f9a8c0" stroke-width="1.5"/>
      <text x="132" y="23" text-anchor="middle" dominant-baseline="central" font-size="${fs}" font-weight="600" fill="#be185d" font-family="Mali, Prompt, sans-serif">${esc(t)}</text>
      <circle cx="162" cy="10" r="2.8" fill="#f43f5e"/>`;
  }

  function krathongSVG() {
    const k = state.kt;
    const base = [baseLeaf, baseLotus, baseBread, baseCoconut][k.base]();
    const cand = CANDLE_FNS[k.candle]();
    const fl = FLOWER_FNS[k.flower];
    const backF = FLOWER_POS.filter(p => p[1] <= 106).map(p => fl(...p)).join('');
    const frontF = FLOWER_POS.filter(p => p[1] > 106).map(p => fl(...p)).join('');
    return `<svg viewBox="0 0 200 180" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="กระทงของเรา">
      <defs>
        <radialGradient id="ktGlow"><stop offset="0" stop-color="#ffe2a0" stop-opacity=".95"/><stop offset=".45" stop-color="#ffb24d" stop-opacity=".35"/><stop offset="1" stop-color="#ff9a3c" stop-opacity="0"/></radialGradient>
        <linearGradient id="ktWax" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#f3e2c4"/></linearGradient>
        <linearGradient id="ktTrunk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dfe9a8"/><stop offset="1" stop-color="#9fb85a"/></linearGradient>
        <linearGradient id="ktPetalA" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#f472b6"/><stop offset="1" stop-color="#ffe4ee"/></linearGradient>
        <linearGradient id="ktPetalB" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ec4899"/><stop offset="1" stop-color="#fbcfe8"/></linearGradient>
        <linearGradient id="ktBread" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9974e"/><stop offset="1" stop-color="#8a4f22"/></linearGradient>
        <linearGradient id="ktCoco" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7c4720"/><stop offset="1" stop-color="#3f210d"/></linearGradient>
      </defs>
      <ellipse cx="100" cy="153" rx="80" ry="9" fill="#000" opacity=".25"/>
      ${base.under}${backF}${cand.svg}${frontF}${base.over}
      ${extraSVG(k.extra || 0)}
      ${k.label ? labelSVG() : ''}
      ${cand.embers ? embersSVG(cand.embers, ui.lit) : ''}
      ${flamesSVG(cand.wicks, ui.lit)}
    </svg>`;
  }

  /* ================= 5) CANVAS SCENE ENGINE ================= */
  const Scene = (() => {
    let cvs, ctx, W = 0, H = 0, dpr = 1, hY = 0, place = 0;
    let off = null, t = 0, last = 0;
    let moon = { x: 0, y: 0, r: 20 };
    let twinkles = [], lanterns = [], flies = [], floaters = [], glints = [], rockets = [], sparks = [], fwQueue = [], meteors = [];
    let flash = 0, nextMeteor = 3;
    const sprites = {};
    const CFG = [
      { water: ['#141b48', '#05081a'], lanterns: 8, flies: 10, floaters: 7 },
      { water: ['#10305c', '#030b1c'], lanterns: 38, flies: 24, floaters: 5 },
      { water: ['#2a1d44', '#080612'], lanterns: 6, flies: 14, floaters: 6 },
      { water: ['#0e3058', '#041022'], lanterns: 12, flies: 16, floaters: 4 }
    ];
    const FW_COLORS = ['#ffd27a', '#ff8fb1', '#ffffff', '#ffb3c7', '#fff1a8', '#c4b5fd', '#ff6b8b'];
    const k = () => H / 500;

    function glowSprite(r, g, b, size = 64) {
      const c = document.createElement('canvas'); c.width = c.height = size;
      const x = c.getContext('2d');
      const gr = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      gr.addColorStop(0, `rgba(${r},${g},${b},1)`);
      gr.addColorStop(0.25, `rgba(${r},${g},${b},0.5)`);
      gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
      x.fillStyle = gr; x.fillRect(0, 0, size, size);
      return c;
    }

    function init(canvas, p) {
      cvs = canvas; ctx = cvs.getContext('2d'); place = p || 0;
      sprites.warm = glowSprite(255, 180, 90);
      sprites.fly = glowSprite(215, 255, 150);
      sprites.white = glowSprite(255, 245, 225);
      sprites.cyan = glowSprite(130, 230, 255);
      resize();
      if (window.ResizeObserver) new ResizeObserver(() => resize()).observe(cvs.parentElement);
      window.addEventListener('resize', resize);
      requestAnimationFrame(loop);
    }
    function resize() {
      const r = cvs.parentElement.getBoundingClientRect();
      const nw = Math.round(r.width), nh = Math.round(r.height);
      const nd = Math.min(window.devicePixelRatio || 1, 2);
      if (!nw || !nh || (nw === W && nh === H && nd === dpr)) return;
      W = nw; H = nh; dpr = nd;
      cvs.width = Math.round(W * dpr); cvs.height = Math.round(H * dpr);
      hY = Math.round(H * 0.6);
      buildStatic(); seed();
    }
    function setPlace(p) { place = p; if (W) { buildStatic(); seed(); } }

    /* ---- static (sky + landmarks) ---- */
    function buildStatic() {
      off = off || document.createElement('canvas');
      off.width = Math.max(1, Math.round(W * dpr)); off.height = Math.max(1, Math.round(hY * dpr));
      const c = off.getContext('2d');
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, W, hY);
      const R = mulberry32(100 + place);
      [paintRiver, paintLake, paintCanal, paintBeach][place](c, R);
    }
    function skyGrad(c, stops) {
      const g = c.createLinearGradient(0, 0, 0, hY);
      stops.forEach(([o, col]) => g.addColorStop(o, col));
      c.fillStyle = g; c.fillRect(0, 0, W, hY);
    }
    function staticStars(c, R, n, maxY) {
      for (let i = 0; i < n; i++) {
        const x = R() * W, y = R() * maxY, s = R();
        c.globalAlpha = 0.25 + s * 0.65;
        c.fillStyle = s > 0.92 ? '#ffe9c4' : '#ffffff';
        const sz = s > 0.85 ? 1.7 : 1;
        c.fillRect(x, y, sz, sz);
      }
      c.globalAlpha = 1;
    }
    function drawMoon(c, x, y, r) {
      moon = { x, y, r };
      let g = c.createRadialGradient(x, y, r * 0.8, x, y, r * 5);
      g.addColorStop(0, 'rgba(255,240,200,0.35)'); g.addColorStop(1, 'rgba(255,240,200,0)');
      c.fillStyle = g; c.beginPath(); c.arc(x, y, r * 5, 0, TAU); c.fill();
      g = c.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
      g.addColorStop(0, '#fffdf2'); g.addColorStop(1, '#f0dcaa');
      c.save(); c.shadowColor = 'rgba(255,240,200,0.9)'; c.shadowBlur = r * 0.8;
      c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.restore();
      c.fillStyle = 'rgba(190,165,120,0.22)';
      [[-0.3, -0.2, 0.22], [0.25, 0.15, 0.16], [-0.05, 0.38, 0.12], [0.35, -0.3, 0.1]].forEach(([dx, dy, rr]) => {
        c.beginPath(); c.arc(x + dx * r, y + dy * r, rr * r, 0, TAU); c.fill();
      });
    }
    function prang(c, x, base, w, h) {
      const steps = 54, pts = [];
      const halfAt = tt => {
        if (tt < 0.1) return w * 0.62;
        let half = w * 0.5 * Math.pow(Math.max(0, 1 - (tt - 0.1) / 0.9), 0.8);
        if (((tt * 9) % 1) < 0.22 && tt < 0.88) half *= 1.12;
        return Math.max(half, w * 0.035);
      };
      for (let i = 0; i <= steps; i++) { const tt = i / steps; pts.push([halfAt(tt), base - tt * h * 0.86]); }
      const g = c.createLinearGradient(0, base - h, 0, base);
      g.addColorStop(0, '#ffe7a8'); g.addColorStop(0.45, '#f0b45c'); g.addColorStop(1, '#7a4a20');
      c.save();
      c.shadowColor = 'rgba(255,190,90,0.75)'; c.shadowBlur = Math.max(8, w * 0.5);
      c.fillStyle = g; c.beginPath();
      c.moveTo(x - pts[0][0], base);
      pts.forEach(p => c.lineTo(x - p[0], p[1]));
      c.lineTo(x, base - h);
      for (let i = pts.length - 1; i >= 0; i--) c.lineTo(x + pts[i][0], pts[i][1]);
      c.closePath(); c.fill(); c.restore();
      c.strokeStyle = 'rgba(120,60,20,0.35)'; c.lineWidth = 0.8;
      for (let i = 1; i < 8; i++) {
        const tt = i / 9 + 0.02; if (tt > 0.86) break;
        const y = base - tt * h * 0.86, half = halfAt(tt);
        c.beginPath(); c.moveTo(x - half, y); c.lineTo(x + half, y); c.stroke();
      }
    }
    function paintRiver(c, R) {
      skyGrad(c, [[0, '#050822'], [0.5, '#121a4a'], [0.82, '#33275e'], [1, '#6b3b5f']]);
      staticStars(c, R, Math.round(W * hY / 2000), hY * 0.7);
      drawMoon(c, W * 0.2, H * 0.16, Math.max(14, Math.min(W, H) * 0.065));
      const g = c.createRadialGradient(W * 0.64, hY, 0, W * 0.64, hY, W * 0.55);
      g.addColorStop(0, 'rgba(255,170,90,0.35)'); g.addColorStop(1, 'rgba(255,170,90,0)');
      c.fillStyle = g; c.fillRect(0, 0, W, hY);
      for (let x = W * 0.84; x < W; x += 10 + R() * 14) {
        const bh = hY * (0.05 + R() * 0.12), bw = 8 + R() * 12;
        c.fillStyle = '#0d1030'; c.fillRect(x, hY - bh, bw, bh);
        c.fillStyle = 'rgba(255,214,150,0.55)';
        for (let wy = hY - bh + 4; wy < hY - 6; wy += 6) if (R() < 0.4) c.fillRect(x + 2 + R() * (bw - 5), wy, 1.6, 1.6);
      }
      const cx = W * 0.63, base = hY - 3, mh = hY * 0.56, mw = mh * 0.3;
      const sg = c.createRadialGradient(cx, base - mh * 0.4, 0, cx, base - mh * 0.4, mh);
      sg.addColorStop(0, 'rgba(255,190,100,0.28)'); sg.addColorStop(1, 'rgba(255,190,100,0)');
      c.fillStyle = sg; c.fillRect(cx - mh, base - mh * 1.4, mh * 2, mh * 1.4);
      prang(c, cx - mw * 2.0, base, mw * 0.42, mh * 0.4);
      prang(c, cx + mw * 2.0, base, mw * 0.42, mh * 0.4);
      prang(c, cx - mw * 1.15, base, mw * 0.55, mh * 0.55);
      prang(c, cx + mw * 1.15, base, mw * 0.55, mh * 0.55);
      prang(c, cx, base, mw, mh);
      c.fillStyle = '#080b22'; c.beginPath(); c.moveTo(0, hY);
      for (let x = 0; x <= W + 6; x += 6) c.lineTo(x, hY - 3 - Math.abs(Math.sin(x * 0.05)) * 6 - R() * 3);
      c.lineTo(W, hY); c.closePath(); c.fill();
      for (let i = 0; i < W / 12; i++) {
        const x = R() * W, y = hY - 2 - R() * 5;
        c.globalAlpha = 0.5 + R() * 0.5; c.drawImage(sprites.warm, x - 4, y - 4, 8, 8);
        c.fillStyle = '#ffe0a0'; c.fillRect(x - 0.6, y - 0.6, 1.2, 1.2);
      }
      c.globalAlpha = 1;
    }
    function ridge(c, R, baseY, amp, col) {
      const p1 = R() * 6, p2 = R() * 6, fa = (2 + R() * 2) / W * Math.PI, fb = (5 + R() * 4) / W * Math.PI;
      c.fillStyle = col; c.beginPath(); c.moveTo(0, hY);
      for (let x = 0; x <= W + 4; x += 4) c.lineTo(x, baseY - amp * (0.55 + 0.3 * Math.sin(x * fa + p1) + 0.15 * Math.sin(x * fb + p2)));
      c.lineTo(W, hY); c.closePath(); c.fill();
    }
    function pines(c, R, x0, x1) {
      c.fillStyle = '#061428';
      for (let x = x0; x < x1; x += 7 + R() * 10) {
        const h = hY * (0.12 + R() * 0.16), w = h * 0.32, b = hY + 1;
        c.beginPath();
        for (let i = 0; i < 3; i++) {
          const ty = b - h + i * h * 0.25, by = b - h * 0.35 + i * h * 0.2;
          c.moveTo(x, ty); c.lineTo(x - w * (0.5 + i * 0.25), by); c.lineTo(x + w * (0.5 + i * 0.25), by); c.closePath();
        }
        c.fill(); c.fillRect(x - 1, b - h * 0.2, 2, h * 0.2);
      }
    }
    function paintLake(c, R) {
      skyGrad(c, [[0, '#020a20'], [0.55, '#0b2550'], [1, '#1e4c7c']]);
      staticStars(c, R, Math.round(W * hY / 1400), hY * 0.8);
      c.save(); c.globalAlpha = 0.1;
      const mg = c.createLinearGradient(0, hY * 0.6, W * 0.6, 0);
      mg.addColorStop(0, 'rgba(200,210,255,0)'); mg.addColorStop(0.5, 'rgba(200,210,255,1)'); mg.addColorStop(1, 'rgba(200,210,255,0)');
      c.fillStyle = mg; c.beginPath(); c.moveTo(0, hY * 0.5); c.lineTo(W * 0.32, 0); c.lineTo(W * 0.58, 0); c.lineTo(W * 0.1, hY * 0.75); c.closePath(); c.fill();
      c.restore();
      drawMoon(c, W * 0.76, H * 0.16, Math.max(16, Math.min(W, H) * 0.08));
      ridge(c, R, hY * 0.66, hY * 0.22, '#173a66');
      ridge(c, R, hY * 0.8, hY * 0.17, '#102c52');
      ridge(c, R, hY * 0.92, hY * 0.1, '#0a1f3b');
      pines(c, R, -4, W * 0.16);
      pines(c, R, W * 0.86, W + 6);
    }
    function paintCanal(c, R) {
      skyGrad(c, [[0, '#090b28'], [0.55, '#281c4b'], [1, '#5c3152']]);
      staticStars(c, R, Math.round(W * hY / 2600), hY * 0.55);
      drawMoon(c, W * 0.82, H * 0.14, Math.max(12, Math.min(W, H) * 0.05));
      const cx = W * 0.5, cb = hY - hY * 0.12;
      c.fillStyle = '#1d1638'; c.beginPath();
      c.moveTo(cx - hY * 0.06, cb); c.quadraticCurveTo(cx - hY * 0.05, cb - hY * 0.12, cx, cb - hY * 0.3);
      c.quadraticCurveTo(cx + hY * 0.05, cb - hY * 0.12, cx + hY * 0.06, cb); c.closePath(); c.fill();
      c.fillRect(cx - hY * 0.09, cb, hY * 0.18, hY * 0.12);
      c.fillStyle = '#120d24';
      for (let x = 0; x < W; x += 18 + R() * 20) { const r = 8 + R() * 16; c.beginPath(); c.arc(x, hY - hY * 0.16 - R() * 10, r, 0, TAU); c.fill(); }
      let x = -10;
      while (x < W) {
        const w = W * (0.09 + R() * 0.07), bh = hY * (0.1 + R() * 0.08), st = hY * 0.035, top = hY - st - bh, rh = bh * (0.75 + R() * 0.3);
        c.fillStyle = '#1b1226'; c.fillRect(x, top, w, bh);
        c.fillRect(x + 3, hY - st, 2, st); c.fillRect(x + w - 5, hY - st, 2, st); c.fillRect(x + w / 2 - 1, hY - st, 2, st);
        c.fillStyle = '#24152c'; c.beginPath(); c.moveTo(x - w * 0.12, top + 2); c.lineTo(x + w / 2, top - rh); c.lineTo(x + w * 1.12, top + 2); c.closePath(); c.fill();
        c.strokeStyle = '#24152c'; c.lineWidth = 2; c.beginPath();
        c.moveTo(x - w * 0.12, top + 2); c.quadraticCurveTo(x - w * 0.18, top - 4, x - w * 0.14, top - 7);
        c.moveTo(x + w * 1.12, top + 2); c.quadraticCurveTo(x + w * 1.18, top - 4, x + w * 1.14, top - 7); c.stroke();
        const nwin = 1 + Math.floor(R() * 3);
        for (let i = 0; i < nwin; i++) {
          if (R() < 0.2) continue;
          const ww = w * 0.16, wh = bh * 0.38, wx = x + (i + 1) * w / (nwin + 1) - ww / 2, wy = top + bh * 0.28;
          c.save(); c.shadowColor = 'rgba(255,190,90,0.95)'; c.shadowBlur = 12;
          c.fillStyle = R() < 0.5 ? '#ffcf7a' : '#ffb35c'; c.fillRect(wx, wy, ww, wh); c.restore();
          c.fillStyle = '#1b1226'; c.fillRect(wx + ww / 2 - 0.5, wy, 1, wh);
        }
        x += w + W * (0.012 + R() * 0.03);
      }
      for (let i = 0; i < W / 28; i++) { const lx = R() * W; c.globalAlpha = 0.7; c.drawImage(sprites.warm, lx - 6, hY - 9, 12, 12); }
      c.globalAlpha = 1;
    }
    function drawPalm(c, x, base, lean, h) {
      const tx = x + lean, ty = base - h;
      c.strokeStyle = '#071022'; c.lineWidth = Math.max(4, h * 0.065); c.lineCap = 'round';
      c.beginPath(); c.moveTo(x, base); c.quadraticCurveTo(x + lean * 0.35, base - h * 0.55, tx, ty); c.stroke();
      c.lineWidth = Math.max(2, h * 0.025);
      [-2.4, -1.7, -0.9, -0.2, 0.4, 1.1, 1.9].forEach(ang => {
        const len = h * 0.44;
        const ex = tx + Math.cos(ang) * len, ey = ty + Math.sin(ang) * len * 0.5 + len * 0.22;
        c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo((tx + ex) / 2, ty - len * 0.18, ex, ey); c.stroke();
      });
    }
    function paintBeach(c, R) {
      skyGrad(c, [[0, '#020718'], [0.45, '#0b1e46'], [0.8, '#1a3868'], [1, '#2c4f7c']]);
      staticStars(c, R, Math.round(W * hY / 1100), hY * 0.85);
      // Milky Way soft diagonal band
      c.save(); c.globalAlpha = 0.16;
      const mw = c.createLinearGradient(W * 0.15, hY, W * 0.75, 0);
      mw.addColorStop(0, 'rgba(180,190,255,0)'); mw.addColorStop(0.5, 'rgba(210,200,255,0.9)'); mw.addColorStop(1, 'rgba(255,210,235,0)');
      c.fillStyle = mw; c.beginPath();
      c.moveTo(W * 0.05, hY); c.lineTo(W * 0.52, 0); c.lineTo(W * 0.82, 0); c.lineTo(W * 0.35, hY); c.closePath(); c.fill();
      c.restore();
      drawMoon(c, W * 0.76, H * 0.17, Math.max(15, Math.min(W, H) * 0.072));
      // distant islands
      c.fillStyle = '#091a36';
      c.beginPath(); c.moveTo(0, hY); c.quadraticCurveTo(W * 0.12, hY - hY * 0.12, W * 0.28, hY); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(W * 0.74, hY); c.quadraticCurveTo(W * 0.88, hY - hY * 0.15, W, hY - hY * 0.04); c.lineTo(W, hY); c.closePath(); c.fill();
      // palm silhouettes
      drawPalm(c, W * 0.05, hY + 2, W * 0.05, hY * 0.52);
      drawPalm(c, W * 0.94, hY + 2, -W * 0.06, hY * 0.48);
    }

    /* ---- particles ---- */
    function newLantern(initial, burst) {
      if (burst) {
        return {
          x: burst.x + rand(-W * 0.05, W * 0.05), y: burst.y + rand(-8, 22),
          r: (burst.big ? rand(8.5, 11.5) : rand(5, 8)) * k(),
          vy: (burst.big ? rand(18, 24) : rand(15, 25)) * k(),
          p: rand(0, 6), a: 1, burst: true, big: !!burst.big
        };
      }
      const far = Math.random();
      return { x: rand(0, W), y: initial ? rand(0, hY) : hY - rand(0, hY * 0.15), r: (1.8 + far * 4.2) * k(), vy: (5 + far * 9) * k(), p: rand(0, 6), a: 1 };
    }
    function newFloater(initial) {
      const d = Math.random();
      return { x: initial ? rand(0, W) : -20, y: hY + 6 + d * (H - hY) * 0.5, d, v: rand(3, 8) * (0.4 + d), p: rand(0, 6) };
    }
    function seed() {
      const cfg = CFG[place];
      twinkles = Array.from({ length: 16 }, () => ({ x: rand(0, W), y: rand(0, hY * 0.42), p: rand(0, 6), s: rand(1, 2.5) }));
      lanterns = Array.from({ length: cfg.lanterns }, () => newLantern(true));
      flies = Array.from({ length: cfg.flies }, () => ({ x: rand(0, W), y: rand(hY * 0.85, H), vx: rand(-12, 12), vy: rand(-8, 8), p: rand(0, 6), s: rand(0.6, 1.2) }));
      floaters = Array.from({ length: cfg.floaters }, () => newFloater(true));
      glints = Array.from({ length: 50 }, () => ({ x: rand(0, W), y: rand(hY + 4, H), p: rand(0, 6), w: rand(4, 12) }));
    }

    function drawLantern(L) {
      const { x, y, r } = L, fl = 0.85 + 0.15 * Math.sin(t * 6 + L.p);
      ctx.globalAlpha = L.a * 0.78 * fl; ctx.drawImage(sprites.warm, x - r * 4.2, y - r * 4.2, r * 8.4, r * 8.4);
      ctx.globalAlpha = L.a;
      ctx.fillStyle = L.big ? '#ff8e53' : '#ff9b45';
      ctx.beginPath(); ctx.moveTo(x - r * 0.8, y - r); ctx.lineTo(x + r * 0.8, y - r); ctx.lineTo(x + r * 0.55, y + r); ctx.lineTo(x - r * 0.55, y + r); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffe2a3'; ctx.beginPath(); ctx.ellipse(x, y + r * 0.5, r * 0.42, r * 0.38, 0, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
    }
    function updateLanterns(dt) {
      for (let i = lanterns.length - 1; i >= 0; i--) {
        const L = lanterns[i];
        L.y -= L.vy * dt; L.x += Math.sin(t * 0.5 + L.p) * 6 * dt;
        if (L.burst) L.r = Math.max(1.2, L.r * (1 - 0.045 * dt));
        L.a = L.y < hY * 0.25 ? clamp(L.y / (hY * 0.25), 0, 1) : 1;
        if (L.y < -L.r * 4) {
          if (L.burst) lanterns.splice(i, 1); else lanterns[i] = newLantern(false);
        }
      }
    }
    function updateMeteors(dt) {
      if (t >= nextMeteor) {
        nextMeteor = t + rand(4.5, 10.5);
        meteors.push({ x: rand(W * 0.15, W * 0.9), y: rand(H * 0.04, hY * 0.35), vx: -rand(160, 260), vy: rand(55, 110), life: 0.75, max: 0.75 });
      }
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.x += m.vx * dt; m.y += m.vy * dt; m.life -= dt;
        const a = clamp(m.life / m.max, 0, 1);
        const g = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * 0.16, m.y - m.vy * 0.16);
        g.addColorStop(0, `rgba(255,250,230,${a})`); g.addColorStop(1, 'rgba(255,250,230,0)');
        ctx.strokeStyle = g; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x - m.vx * 0.16, m.y - m.vy * 0.16); ctx.stroke();
        if (m.life <= 0) meteors.splice(i, 1);
      }
    }
    function stringLights() {
      const strands = [[0, H * 0.05, W, H * 0.1, H * 0.1], [0, H * 0.2, W * 0.6, H * 0.04, H * 0.07]];
      strands.forEach(([x0, y0, x1, y1, sag], si) => {
        const n = Math.max(8, Math.round((x1 - x0) / 26));
        const pt = i => { const u = i / n; return [x0 + (x1 - x0) * u, y0 + (y1 - y0) * u + sag * 4 * u * (1 - u)]; };
        ctx.strokeStyle = 'rgba(20,12,24,0.9)'; ctx.lineWidth = 1; ctx.beginPath();
        for (let i = 0; i <= n; i++) { const [x, y] = pt(i); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
        ctx.stroke();
        for (let i = 1; i < n; i++) {
          const [x, y] = pt(i), tw = 0.6 + 0.4 * Math.sin(t * 2.2 + i * 1.7 + si);
          ctx.globalAlpha = tw; ctx.drawImage(sprites.warm, x - 9, y - 6, 18, 18);
          ctx.fillStyle = i % 3 === 0 ? '#ffd6e0' : '#ffe7a8';
          ctx.beginPath(); ctx.arc(x, y + 3, 2, 0, TAU); ctx.fill();
        }
        ctx.globalAlpha = 1;
      });
    }
    function drawWater() {
      const wh = H - hY, cfg = CFG[place];
      let g = ctx.createLinearGradient(0, hY, 0, H);
      g.addColorStop(0, cfg.water[0]); g.addColorStop(1, cfg.water[1]);
      ctx.fillStyle = g; ctx.fillRect(0, hY, W, wh);
      const sh = 2, maxSrc = off.height;
      for (let y = 0; y < wh; y += sh) {
        const srcY = hY - y - sh; if (srcY < 0) break;
        const kk = y / wh, amp = 1 + kk * 8;
        const dx = Math.sin(y * 0.14 - t * 1.9) * amp + Math.sin(y * 0.045 + t * 0.8) * amp * 0.6;
        const sy = srcY * dpr, shh = Math.min(sh * dpr, maxSrc - sy);
        if (shh <= 0) continue;
        ctx.globalAlpha = 0.55 * (1 - kk) + 0.04;
        ctx.drawImage(off, 0, sy, off.width, shh, dx, hY + y, W, sh + 0.5);
      }
      ctx.globalAlpha = 1;
      g = ctx.createLinearGradient(0, hY, 0, H);
      g.addColorStop(0, 'rgba(5,8,25,0)'); g.addColorStop(1, 'rgba(3,5,18,0.55)');
      ctx.fillStyle = g; ctx.fillRect(0, hY, W, wh);
      g = ctx.createLinearGradient(0, hY - 6, 0, hY + 8);
      g.addColorStop(0, 'rgba(255,220,180,0)'); g.addColorStop(0.5, 'rgba(255,220,180,0.12)'); g.addColorStop(1, 'rgba(255,220,180,0)');
      ctx.fillStyle = g; ctx.fillRect(0, hY - 6, W, 14);
    }
    function drawShimmer() {
      const wh = H - hY;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = '#ffe9b8';
      for (let y = hY + 2; y < H; y += 3) {
        const kk = (y - hY) / wh, base = moon.r * (0.6 + kk * 2.6);
        const w = base * (0.5 + 0.5 * Math.sin(t * 2.3 + y * 0.37)) * (0.65 + 0.35 * Math.sin(t * 1.1 + y * 0.13));
        const x = moon.x + Math.sin(y * 0.05 + t * 0.9) * (2 + kk * 7);
        ctx.globalAlpha = Math.max(0, 0.5 - kk * 0.38);
        ctx.fillRect(x - w / 2, y, w, 1.4);
      }
      ctx.fillStyle = place === 3 ? '#c8f2ff' : '#fff3d6';
      for (const gl of glints) {
        const a = Math.pow(Math.max(0, Math.sin(t * 1.6 + gl.p)), 10);
        if (a < 0.02) continue;
        ctx.globalAlpha = a * 0.85; ctx.fillRect(gl.x - gl.w / 2, gl.y, gl.w, 1);
      }
      for (const L of lanterns) {
        if (L.y >= hY) continue;
        const ry = 2 * hY - L.y;
        if (ry >= H) continue;
        ctx.globalAlpha = L.a * 0.22;
        ctx.drawImage(sprites.warm, L.x - L.r * 2.5 + Math.sin(t * 2 + ry * 0.1) * 2, ry - L.r * 2, L.r * 5, L.r * 4);
      }
      for (let i = 0; i < sparks.length; i += 3) {
        const s = sparks[i];
        if (s.y >= hY) continue;
        const ry = 2 * hY - s.y;
        if (ry >= H) continue;
        ctx.globalAlpha = (s.life / s.max) * 0.3; ctx.fillStyle = s.c;
        ctx.fillRect(s.x + Math.sin(ry * 0.2 + t * 3) * 2, ry, 2.4, 1.2);
      }
      ctx.restore();
    }
    function drawFloaters(dt) {
      for (const f of floaters) {
        f.x += f.v * dt;
        if (f.x > W + 30) Object.assign(f, newFloater(false));
        const s = (0.5 + f.d * 1.3) * k(), y = f.y + Math.sin(t * 1.5 + f.p) * 1.2;
        ctx.globalAlpha = 0.55; ctx.drawImage(sprites.warm, f.x - 14 * s, y - 16 * s, 28 * s, 28 * s);
        ctx.globalAlpha = 0.25; ctx.drawImage(sprites.warm, f.x - 5 * s, y, 10 * s, 26 * s);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#1f5a2c'; ctx.beginPath(); ctx.ellipse(f.x, y, 7 * s, 2.4 * s, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#ffd27a'; ctx.beginPath(); ctx.arc(f.x, y - 4 * s, 1.4 * s, 0, TAU); ctx.fill();
      }
    }
    function lamp(x, base, h) {
      ctx.fillStyle = '#0b0e22'; ctx.fillRect(x - 1.5, base - h, 3, h); ctx.fillRect(x - 5, base - 3, 10, 3);
      ctx.globalAlpha = 0.85 + 0.1 * Math.sin(t * 3);
      ctx.drawImage(sprites.warm, x - 30, base - h - 30, 60, 60);
      ctx.globalAlpha = 1; ctx.fillStyle = '#ffe7b0';
      ctx.beginPath(); ctx.arc(x, base - h, 4, 0, TAU); ctx.fill();
    }
    function drawForeground() {
      let g;
      if (place === 0) {
        g = ctx.createLinearGradient(0, H * 0.78, 0, H); g.addColorStop(0, '#1d2142'); g.addColorStop(1, '#070a1a');
        const edge = () => { ctx.moveTo(0, H * 0.8); ctx.bezierCurveTo(W * 0.18, H * 0.775, W * 0.36, H * 0.8, W * 0.5, H * 0.9); };
        ctx.fillStyle = g; ctx.beginPath(); edge(); ctx.lineTo(W * 0.56, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(244,199,107,0.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); edge(); ctx.stroke();
        lamp(W * 0.035, H * 0.8, H * 0.3);
      } else if (place === 1) {
        g = ctx.createLinearGradient(0, H * 0.76, 0, H); g.addColorStop(0, '#0c2433'); g.addColorStop(1, '#040d15');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, H * 0.79);
        ctx.bezierCurveTo(W * 0.15, H * 0.76, W * 0.32, H * 0.82, W * 0.46, H * 0.88); ctx.lineTo(W * 0.52, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#123446'; ctx.lineWidth = 1.2;
        for (let i = 0; i < 16; i++) {
          const x = i * W * 0.028, y = H * (0.79 - 0.01 * Math.sin(i * 1.3));
          ctx.beginPath(); ctx.moveTo(x, y + 3); ctx.quadraticCurveTo(x + 2, y - 6, x + 4 + Math.sin(t + i) * 1.5, y - 9); ctx.stroke();
        }
        ctx.strokeStyle = '#08202c'; ctx.lineWidth = 1.6;
        for (let i = 0; i < 12; i++) {
          const x = W * 0.86 + i * W * 0.013, top = H * (0.74 + 0.07 * Math.sin(i * 2.3)), sway = Math.sin(t * 0.9 + i) * 3;
          ctx.beginPath(); ctx.moveTo(x, H); ctx.quadraticCurveTo(x + sway * 0.5, (H + top) / 2, x + sway, top); ctx.stroke();
          if (i % 3 === 0) { ctx.fillStyle = '#2a1a10'; ctx.beginPath(); ctx.ellipse(x + sway, top + 4, 1.8, 5, 0, 0, TAU); ctx.fill(); }
        }
      } else if (place === 2) {
        g = ctx.createLinearGradient(0, H * 0.8, 0, H); g.addColorStop(0, '#3b2718'); g.addColorStop(1, '#140c07');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, H * 0.8); ctx.lineTo(W * 0.48, H * 0.8); ctx.lineTo(W * 0.54, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1;
        for (let x = W * 0.04; x < W * 0.5; x += W * 0.045) { ctx.beginPath(); ctx.moveTo(x, H * 0.8); ctx.lineTo(x * 1.12, H); ctx.stroke(); }
        ctx.strokeStyle = 'rgba(255,200,120,0.4)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, H * 0.8); ctx.lineTo(W * 0.48, H * 0.8); ctx.stroke();
        ctx.fillStyle = '#1a0f08'; ctx.fillRect(W * 0.49, H * 0.78, 5, H * 0.22); ctx.fillRect(W * 0.515, H * 0.84, 4, H * 0.16);
        lamp(W * 0.47, H * 0.8, H * 0.22);
      } else {
        // Moonlit sandy beach + gentle glowing surf wave
        g = ctx.createLinearGradient(0, H * 0.77, 0, H); g.addColorStop(0, '#2a3350'); g.addColorStop(1, '#12182b');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, H * 0.79);
        ctx.bezierCurveTo(W * 0.18, H * 0.76, W * 0.36, H * 0.81, W * 0.52, H * 0.9);
        ctx.lineTo(W * 0.58, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
        const wave = Math.sin(t * 1.5) * 4;
        ctx.strokeStyle = 'rgba(155,235,255,0.45)'; ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.moveTo(0, H * 0.79 + wave);
        ctx.bezierCurveTo(W * 0.18, H * 0.76 + wave, W * 0.36, H * 0.81 + wave, W * 0.52, H * 0.9 + wave); ctx.stroke();
      }
    }
    function drawFlies(dt) {
      const sp = place === 3 ? sprites.cyan : sprites.fly;
      for (const f of flies) {
        f.vx = clamp(f.vx + rand(-20, 20) * dt, -15, 15); f.vy = clamp(f.vy + rand(-20, 20) * dt, -10, 10);
        f.x += f.vx * dt; f.y += f.vy * dt;
        if (f.x < 0) f.x = W; if (f.x > W) f.x = 0;
        if (f.y < hY * 0.8) f.vy = Math.abs(f.vy); if (f.y > H) f.vy = -Math.abs(f.vy);
        const a = Math.pow(0.5 + 0.5 * Math.sin(t * 2 + f.p), 2), s = 10 * f.s * k();
        ctx.globalAlpha = a; ctx.drawImage(sp, f.x - s, f.y - s, s * 2, s * 2);
        ctx.fillStyle = place === 3 ? '#d8f9ff' : '#f4ffc0'; ctx.fillRect(f.x - 0.7, f.y - 0.7, 1.4, 1.4);
      }
      ctx.globalAlpha = 1;
    }

    /* ---- fireworks ---- */
    function launch(x, ty) {
      ty = ty == null ? rand(H * 0.08, H * 0.34) : ty;
      x = x == null ? rand(W * 0.15, W * 0.85) : x;
      rockets.push({ x, y: hY, ty, vx: rand(-12, 12), vy: -(hY - ty) / rand(0.85, 1.15), c: pick(FW_COLORS) });
    }
    function explode(r) {
      const n = Math.round(rand(60, 90)), heart = Math.random() < 0.35, sp = rand(70, 110) * k(), c2 = pick(FW_COLORS);
      for (let i = 0; i < n; i++) {
        let vx, vy;
        if (heart) {
          const a = i / n * TAU;
          vx = 16 * Math.pow(Math.sin(a), 3) / 16 * sp * 1.1;
          vy = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) / 16 * sp * 1.1;
        } else {
          const a = rand(0, TAU), s = sp * Math.sqrt(Math.random());
          vx = Math.cos(a) * s; vy = Math.sin(a) * s;
        }
        const life = heart ? 1.8 : rand(1.2, 2);
        sparks.push({ x: r.x, y: r.y, vx, vy, life, max: life, c: i % 4 === 0 ? c2 : r.c, sz: 2.2 });
      }
      flash = Math.min(1, flash + 0.6);
    }
    function updateFireworks(dt) {
      while (fwQueue.length && fwQueue[0] <= t) { fwQueue.shift(); launch(); }
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.x += r.vx * dt; r.y += r.vy * dt;
        sparks.push({ x: r.x, y: r.y, vx: rand(-6, 6), vy: rand(10, 25), life: 0.45, max: 0.45, c: '#ffe7b0', sz: 1.6 });
        if (r.y <= r.ty) { explode(r); rockets.splice(i, 1); }
      }
      const drag = Math.pow(0.965, dt * 60), grav = 45 * k();
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.vx *= drag; s.vy = s.vy * drag + grav * dt;
        s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
        if (s.life <= 0) sparks.splice(i, 1);
      }
      flash = Math.max(0, flash - dt * 1.5);
    }
    function drawFireworks() {
      if (!sparks.length && !rockets.length) return;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const s of sparks) {
        const a = clamp(s.life / s.max, 0, 1);
        ctx.globalAlpha = a; ctx.fillStyle = s.c;
        ctx.fillRect(s.x - s.sz / 2, s.y - s.sz / 2, s.sz, s.sz);
        if (s.sz > 2) { ctx.globalAlpha = a * 0.35; ctx.drawImage(sprites.white, s.x - 5, s.y - 5, 10, 10); }
      }
      for (const r of rockets) { ctx.globalAlpha = 1; ctx.drawImage(sprites.warm, r.x - 6, r.y - 6, 12, 12); }
      ctx.restore();
    }

    function frame(dt) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(off, 0, 0, off.width, off.height, 0, 0, W, hY);
      for (const s of twinkles) {
        ctx.globalAlpha = 0.25 + 0.75 * Math.pow(0.5 + 0.5 * Math.sin(t * s.s + s.p), 3);
        ctx.drawImage(sprites.white, s.x - 4, s.y - 4, 8, 8);
      }
      ctx.globalAlpha = 1;
      updateMeteors(dt);
      if (place === 2) stringLights();
      updateLanterns(dt);
      for (const L of lanterns) if (L.y < hY) drawLantern(L);
      updateFireworks(dt);
      drawFireworks();
      drawWater();
      drawShimmer();
      drawFloaters(dt);
      drawForeground();
      for (const L of lanterns) if (L.y >= hY) drawLantern(L);
      drawFlies(dt);
      if (flash > 0) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = `rgba(255,200,220,${(flash * 0.08).toFixed(3)})`; ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }
    }
    function loop(ts) {
      requestAnimationFrame(loop);
      if (!W || !off) return;
      const now = ts / 1000;
      const dt = last ? Math.min(0.05, Math.max(0, now - last)) : 0.016;
      last = now; t += dt;
      frame(dt);
    }

    return {
      init, setPlace, resize,
      celebrate(count = 14) {
        const times = [];
        for (let i = 0; i < count; i++) times.push(t + 0.15 + i * 0.45 + rand(0, 0.25));
        if (count >= 10) for (let i = 0; i < 4; i++) times.push(t + 7.2 + rand(0, 0.25));
        fwQueue = fwQueue.concat(times).sort((a, b) => a - b);
      },
      burstLanterns(x, y, n, big = false) {
        for (let i = 0; i < n; i++) lanterns.push(newLantern(false, { x, y, big: big && i === 0 }));
      },
      releaseSpecialLantern() {
        if (!W) return;
        lanterns.push(newLantern(false, { x: W * 0.35, y: hY + 25, big: true }));
        for (let i = 0; i < 4; i++) lanterns.push(newLantern(false, { x: W * 0.35, y: hY + 35, big: false }));
      },
      launchAt(x, y) { if (W) launch(x, Math.min(y, hY - 30)); }
    };
  })();

  /* ================= 6) WEB AUDIO MUSIC & SFX ================= */
  const Music = (() => {
    let ac = null, master, dry, echo, timer = 0, nextT = 0, stepI = 0, mel = 4, waterStarted = false, noiseBuf = null;
    let playing = false;
    const BPM = 72, EIGHTH = 60 / BPM / 2;
    const SCALE = [392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
    const CHORDS = [[261.63, 329.63, 392.0], [220.0, 261.63, 329.63], [174.61, 220.0, 261.63], [196.0, 246.94, 293.66]];
    const BASS = [65.41, 55.0, 43.65, 49.0];

    function impulse(sec) {
      const len = Math.floor(ac.sampleRate * sec), buf = ac.createBuffer(2, len, ac.sampleRate);
      for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
      return buf;
    }
    function build() {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ac = new AC();
      master = ac.createGain(); master.gain.value = 0;
      const comp = ac.createDynamicsCompressor();
      master.connect(comp); comp.connect(ac.destination);
      const conv = ac.createConvolver(); conv.buffer = impulse(2.8);
      const wet = ac.createGain(); wet.gain.value = 0.38;
      conv.connect(wet); wet.connect(master);
      dry = ac.createGain(); dry.gain.value = 0.8; dry.connect(master); dry.connect(conv);
      echo = ac.createGain(); echo.gain.value = 0.28;
      const delay = ac.createDelay(2); delay.delayTime.value = EIGHTH * 3;
      const fb = ac.createGain(); fb.gain.value = 0.32;
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200;
      echo.connect(delay); delay.connect(lp); lp.connect(fb); fb.connect(delay); lp.connect(dry);
      noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
      const nd = noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
      return true;
    }
    function startWater() {
      if (waterStarted) return; waterStarted = true;
      const src = ac.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520;
      const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 110;
      const g = ac.createGain(); g.gain.value = 0.05;
      const lfo = ac.createOscillator(); lfo.frequency.value = 0.12;
      const lg = ac.createGain(); lg.gain.value = 0.03;
      lfo.connect(lg); lg.connect(g.gain);
      src.connect(lp); lp.connect(hp); hp.connect(g); g.connect(master);
      src.start(); lfo.start();
    }
    function pluck(t, f, vel) {
      const o = ac.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
      const o2 = ac.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 2;
      const g2 = ac.createGain(); g2.gain.value = 0.3;
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.15 * vel, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3000;
      o.connect(g); o2.connect(g2); g2.connect(g); g.connect(lp); lp.connect(dry); lp.connect(echo);
      o.start(t); o2.start(t); o.stop(t + 1.7); o2.stop(t + 1.7);
    }
    function pad(t, chord, dur) {
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.connect(dry);
      chord.forEach((f, i) => {
        const o = ac.createOscillator(); o.type = i % 2 ? 'triangle' : 'sine'; o.frequency.value = f / 2; o.detune.value = (i - 1) * 6;
        const g = ac.createGain();
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.035, t + 1.2);
        g.gain.setValueAtTime(0.035, t + dur - 0.6); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.8);
        o.connect(g); g.connect(lp); o.start(t); o.stop(t + dur + 0.9);
      });
    }
    function bass(t, f) {
      const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
      o.connect(g); g.connect(dry); o.start(t); o.stop(t + 1.9);
    }
    function ching(t, open) {
      const src = ac.createBufferSource(); src.buffer = noiseBuf;
      const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 6500; bp.Q.value = 6;
      const g = ac.createGain(); const d = open ? 0.6 : 0.09;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(open ? 0.05 : 0.035, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      src.connect(bp); bp.connect(g); g.connect(dry); src.start(t, Math.random()); src.stop(t + d + 0.05);
      if (open) {
        [3520, 5280].forEach(f => {
          const o = ac.createOscillator(); o.frequency.value = f; const og = ac.createGain();
          og.gain.setValueAtTime(0.0001, t); og.gain.exponentialRampToValueAtTime(0.012, t + 0.004); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
          o.connect(og); og.connect(dry); o.start(t); o.stop(t + 0.75);
        });
      }
    }
    function schedule(i, t) {
      const bar = Math.floor(i / 8) % 4, pos = i % 8;
      if (pos === 0) { pad(t, CHORDS[bar], EIGHTH * 8); bass(t, BASS[bar]); }
      if (pos === 0 || pos === 4) ching(t, pos === 0);
      const p = pos % 2 === 0 ? 0.7 : 0.3;
      if (Math.random() < p) {
        mel = clamp(mel + pick([-2, -1, -1, 0, 1, 1, 2]), 0, SCALE.length - 1);
        pluck(t, SCALE[mel], pos % 2 ? 0.6 : 1);
      }
    }
    function tick() {
      if (nextT < ac.currentTime - 0.1) nextT = ac.currentTime + 0.05;
      while (nextT < ac.currentTime + 0.3) { schedule(stepI, nextT); nextT += EIGHTH; stepI++; }
    }
    return {
      get playing() { return playing; },
      start() {
        if (!ac && !build()) return false;
        if (ac.state === 'suspended') ac.resume().catch(() => {});
        startWater();
        const now = ac.currentTime;
        master.gain.cancelScheduledValues(now); master.gain.setTargetAtTime(0.6, now, 0.6);
        nextT = now + 0.1; clearInterval(timer); timer = setInterval(tick, 60);
        playing = true; return true;
      },
      stop() {
        if (!ac) return;
        const now = ac.currentTime;
        master.gain.cancelScheduledValues(now); master.gain.setTargetAtTime(0, now, 0.25);
        clearInterval(timer); playing = false;
        setTimeout(() => { if (!playing && ac.state === 'running') ac.suspend().catch(() => {}); }, 1500);
      },
      chime(notes = [523.25, 659.25, 783.99, 1046.5]) {
        if (!playing || !ac || ac.state !== 'running') return;
        const now = ac.currentTime;
        notes.forEach((f, i) => pluck(now + i * 0.09, f, 0.75));
      }
    };
  })();

  /* ================= 7) SOUVENIR PNG RENDERER (ZERO THAI CLIPPING) ================= */
  function roundRectPath(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  function wrapThaiText(c, text, maxW, maxLines = 3) {
    const seg = (window.Intl && Intl.Segmenter) ? new Intl.Segmenter('th', { granularity: 'word' }) : null;
    const tokens = seg ? Array.from(seg.segment(text), x => x.segment) : graphemes(text);
    const lines = [];
    let cur = '';
    for (let i = 0; i < tokens.length; i++) {
      const tk = tokens[i];
      if (lines.length === maxLines - 1) {
        // On the final allowed line, collect remaining text and ellipsize cleanly below
        cur += tk;
        continue;
      }
      const test = cur + tk;
      if (c.measureText(test).width > maxW && cur) {
        lines.push(cur.trim());
        cur = tk.trimStart();
      } else {
        cur = test;
      }
    }
    if (cur.trim()) lines.push(cur.trim());
    if (lines.length > maxLines) lines.length = maxLines;
    // Ensure every line fits within maxW (especially final line or single very long word)
    for (let i = 0; i < lines.length; i++) {
      if (c.measureText(lines[i]).width > maxW) {
        const gs = graphemes(lines[i]);
        while (gs.length > 1 && c.measureText(gs.join('') + '…').width > maxW) gs.pop();
        lines[i] = gs.join('') + '…';
      }
    }
    return lines;
  }

  function drawSouvenirOverlays(canvas, cssW, cssH, watermarkText) {
    if (!cssW || !cssH || !canvas.width || !canvas.height) return;
    const scaleX = canvas.width / cssW;
    const scaleY = canvas.height / cssH;
    const minDim = Math.min(cssW, cssH);
    const c = canvas.getContext('2d');
    c.save();
    // Reset any lingering transform (e.g. from html2canvas) to prevent double-scaling
    c.setTransform(scaleX, 0, 0, scaleY, 0, 0);

    // Subtle romantic inner frame — always completely inside all 4 edges
    const pad = clamp(Math.round(minDim * 0.022), 7, 14);
    const frameR = clamp(Math.round(pad * 1.4), 10, 18);
    c.save();
    c.strokeStyle = 'rgba(244, 199, 107, 0.32)';
    c.lineWidth = 1.25;
    roundRectPath(c, pad, pad, cssW - pad * 2, cssH - pad * 2, frameR);
    c.stroke();
    c.restore();

    // 1) Top Couple Name Pill (balanced proportions for mobile & desktop, zero Thai clipping)
    const me = state.me.trim() || 'เรา';
    const pa = state.partner.trim() || 'แฟน';
    let nameFs = clamp(Math.round(minDim * 0.044), 12, 18);
    const maxPillW = cssW - pad * 2 - 20;
    let wMe = 0, wHeart = 0, wPa = 0, totalW = 0;
    while (nameFs >= 10) {
      c.font = `600 ${nameFs}px "Prompt", sans-serif`;
      wMe = c.measureText(me).width;
      wHeart = c.measureText(' ❤ ').width;
      wPa = c.measureText(pa).width;
      totalW = wMe + wHeart + wPa;
      if (totalW + nameFs * 2.1 <= maxPillW || nameFs === 10) break;
      nameFs--;
    }

    const pillPadX = Math.round(nameFs * 1.1);
    const pillH = Math.round(nameFs * 2.15); // generous vertical breathing room for Thai vowels/tones
    const pillW = Math.min(maxPillW, totalW + pillPadX * 2);
    const pillX = (cssW - pillW) / 2;
    const pillY = pad + clamp(Math.round(minDim * 0.022), 7, 13);

    c.save();
    c.fillStyle = 'rgba(10, 20, 51, 0.66)';
    c.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    c.lineWidth = 1.05;
    roundRectPath(c, pillX, pillY, pillW, pillH, pillH / 2);
    c.fill();
    c.stroke();

    c.textBaseline = 'middle';
    c.textAlign = 'left';
    const textCenterY = pillY + pillH / 2 + 0.5;
    c.translate(cssW / 2, textCenterY);
    if (totalW > pillW - 16) c.scale((pillW - 16) / totalW, 1);
    const startX = -totalW / 2;
    c.shadowColor = 'rgba(0, 0, 0, 0.45)';
    c.shadowBlur = 4;
    c.fillStyle = '#ffffff';
    c.fillText(me, startX, 0);
    c.fillStyle = '#f48fab';
    c.fillText(' ❤ ', startX + wMe, 0);
    c.fillStyle = '#ffffff';
    c.fillText(pa, startX + wMe + wHeart, 0);
    c.restore();

    // 2) Couple Wish (multi-line Thai wrapped, proportional & non-overlapping)
    const wishText = state.wish.trim();
    if (wishText) {
      const wishFs = clamp(Math.round(minDim * 0.039), 11, 17);
      const maxWishLines = cssH < 320 ? 2 : 3;
      const maxWishW = Math.min(cssW - pad * 2 - 28, cssW * 0.86);
      c.save();
      c.font = `600 ${wishFs}px "Mali", "Prompt", sans-serif`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillStyle = '#fde9b8';
      c.shadowColor = 'rgba(5, 10, 31, 0.92)';
      c.shadowBlur = 9;
      c.shadowOffsetY = 1.5;

      const lines = wrapThaiText(c, `“${wishText}”`, maxWishW, maxWishLines);
      const lineH = Math.round(wishFs * 1.68);
      let wy = pillY + pillH + Math.round(wishFs * 1.05);
      for (const line of lines) {
        c.fillText(line, cssW / 2, wy);
        wy += lineH;
      }
      c.restore();
    }

    // 3) Bottom Watermark Pill (always inside frame, auto-fits narrow mobile screens)
    let wmFs = clamp(Math.round(minDim * 0.027), 10, 13);
    const wmMaxW = cssW - pad * 2 - 18;
    let wmTextW = 0;
    c.save();
    while (wmFs >= 8.5) {
      c.font = `500 ${wmFs}px "Prompt", sans-serif`;
      wmTextW = c.measureText(watermarkText).width;
      if (wmTextW + wmFs * 2.2 <= wmMaxW || wmFs <= 9) break;
      wmFs -= 0.5;
    }
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    const wmW = Math.min(wmMaxW, wmTextW + wmFs * 2.2);
    const wmH = Math.round(wmFs * 2.25);
    const wmX = (cssW - wmW) / 2;
    const wmY = cssH - pad - wmH - clamp(Math.round(minDim * 0.016), 5, 9);

    c.fillStyle = 'rgba(10, 20, 51, 0.74)';
    c.strokeStyle = 'rgba(244, 199, 107, 0.36)';
    c.lineWidth = 1;
    roundRectPath(c, wmX, wmY, wmW, wmH, wmH / 2);
    c.fill();
    c.stroke();

    c.fillStyle = '#fde9b8';
    c.fillText(watermarkText, cssW / 2, wmY + wmH / 2 + 0.5, wmW - 14);
    c.restore();

    c.restore();
  }

  /* ================= 8) UI CONTROLLER ================= */
  const els = {};
  const IDS = ['scene', 'sceneWrap', 'panel', 'sceneCanvas', 'coupleLayer', 'krathongLayer', 'krathongBob', 'capMe', 'capPartner', 'capWish', 'sceneWatermark',
    'inMe', 'inPartner', 'inWish', 'inSecret', 'cntWish', 'cntSecret', 'wishPresets', 'btnSweetIdea', 'tabName0', 'tabName1',
    'optFace', 'optHair', 'optHairColor', 'optSkin', 'optOutfit', 'optAcc', 'optBase', 'optFlower', 'optCandle', 'optExtra', 'togLabel', 'labelPreview', 'optPlace',
    'finalNames', 'finalWish', 'btnLight', 'btnLightLb', 'btnRelease', 'btnReleaseLb', 'btnLantern', 'btnFirework', 'btnSave', 'btnSaveLb',
    'shareLink', 'btnCopy', 'btnNativeShare', 'btnPreview', 'btnMakeOwn', 'rcvFrom', 'rcvSecret', 'rcvBack', 'btnReplaySecret',
    'btnPrev', 'btnNext', 'musicBtn', 'musicIcon', 'musicLabel', 'inviteOverlay', 'inviteTitle', 'inviteSub', 'btnOpenInvite',
    'photoModal', 'photoImg', 'photoDownload', 'photoShare', 'photoClose', 'photoCloseTop', 'toast',
    'btnRandomAvatar', 'btnSwapCouple', 'btnRandomKt', 'btnExpandScene', 'expandIcon'];

  let toastTimer = 0;
  function toast(msg, ms = 2800) {
    els.toast.textContent = msg; els.toast.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => els.toast.classList.remove('show'), ms);
  }

  function renderCouple() { els.coupleLayer.innerHTML = coupleSVG(); }
  function renderKrathong() { els.krathongBob.innerHTML = krathongSVG(); }
  let ktTimer = 0;
  function renderKrathongSoon() { clearTimeout(ktTimer); ktTimer = setTimeout(renderKrathong, 200); }

  function updateCaption() {
    const me = state.me.trim() || 'เรา', pa = state.partner.trim() || 'แฟน';
    els.capMe.textContent = me; els.capPartner.textContent = pa;
    els.tabName0.textContent = me; els.tabName1.textContent = pa;
    els.capWish.textContent = state.wish.trim() ? `“${state.wish.trim()}”` : '';
    els.capWish.classList.toggle('show', ui.step === 4 && !!state.wish.trim());
    els.labelPreview.textContent = `${trunc(me, 8)} ♥ ${trunc(pa, 8)}`;
  }
  function updateCounters() {
    els.cntWish.textContent = `${state.wish.length}/160`;
    els.cntSecret.textContent = `${state.secret.length}/300`;
  }

  function renderWishPresets() {
    const shortLabels = ['💖 รักกันนานๆ', '🪷 ลอยทุกข์ลอยโศก', '✨ สุขภาพแข็งแรง', '🌕 ลอยด้วยกันทุกปี'];
    els.wishPresets.innerHTML = WISH_PRESETS.map((w, i) =>
      `<button type="button" class="preset-chip" data-i="${i}">${shortLabels[i]}</button>`).join('');
    els.wishPresets.onclick = e => {
      const b = e.target.closest('button[data-i]');
      if (!b) return;
      state.wish = WISH_PRESETS[+b.dataset.i];
      els.inWish.value = state.wish;
      updateCaption(); updateCounters(); saveDraft();
      toast('✨ ใส่คำอธิษฐานให้แล้ว แก้ไขเพิ่มได้นะ');
    };
  }

  function chips(el, items, cur, onPick) {
    el.innerHTML = items.map((it, i) =>
      `<button type="button" class="chip${i === cur ? ' active' : ''}" data-i="${i}" aria-pressed="${i === cur}"><span class="chip-ic">${it.icon}</span><span>${it.name}</span></button>`).join('');
    el.onclick = e => { const b = e.target.closest('button[data-i]'); if (b) onPick(+b.dataset.i); };
  }
  function swatches(el, items, cur, onPick) {
    el.innerHTML = items.map((it, i) =>
      `<button type="button" class="swatch${i === cur ? ' active' : ''}" data-i="${i}" style="--c:${it.c}" title="${it.name}" aria-label="${it.name}" aria-pressed="${i === cur}"></button>`).join('');
    el.onclick = e => { const b = e.target.closest('button[data-i]'); if (b) onPick(+b.dataset.i); };
  }

  function renderOptions() {
    const av = state.av[ui.person];
    const setAv = key => i => { av[key] = i; changed('av'); };
    chips(els.optFace, FACES, av.face || 0, setAv('face'));
    chips(els.optHair, HAIRS, av.hair, setAv('hair'));
    swatches(els.optHairColor, HAIR_COLORS, av.hc, setAv('hc'));
    swatches(els.optSkin, SKIN_TONES, av.skin, setAv('skin'));
    chips(els.optOutfit, OUTFITS, av.outfit, setAv('outfit'));
    chips(els.optAcc, ACCESSORIES, av.acc, setAv('acc'));
    $$('.tab').forEach(t => { const on = +t.dataset.person === ui.person; t.classList.toggle('active', on); t.setAttribute('aria-selected', on); });

    const setKt = key => i => { state.kt[key] = i; changed('kt'); };
    chips(els.optBase, BASES, state.kt.base, setKt('base'));
    chips(els.optFlower, FLOWERS, state.kt.flower, setKt('flower'));
    chips(els.optCandle, CANDLES, state.kt.candle, setKt('candle'));
    chips(els.optExtra, EXTRAS, state.kt.extra || 0, setKt('extra'));
    els.togLabel.checked = !!state.kt.label;

    els.optPlace.innerHTML = PLACES.map((p, i) => `<button type="button" class="place-card${i === state.place ? ' active' : ''}" data-i="${i}" aria-pressed="${i === state.place}">
      <span class="place-thumb" style="background:${p.thumb}">${p.icon}</span>
      <span class="min-w-0"><span class="block font-semibold text-gold-200">${p.name}</span><span class="block text-xs text-white/65 mt-0.5 leading-relaxed">${p.desc}</span></span>
    </button>`).join('');
  }

  function changed(kind) {
    if (kind === 'av') renderCouple();
    if (kind === 'kt') renderKrathong();
    if (kind === 'place') Scene.setPlace(state.place);
    renderOptions();
    saveDraft();
    if (ui.step === 4) updateShare();
  }

  function validateNames() {
    const bad = [];
    if (!state.me.trim()) bad.push(els.inMe);
    if (!state.partner.trim()) bad.push(els.inPartner);
    if (!bad.length) return true;
    bad.forEach(e => { e.classList.remove('invalid'); void e.offsetWidth; e.classList.add('invalid'); });
    bad[0].focus({ preventScroll: false });
    toast('กรอกชื่อของเราและชื่อแฟนก่อนนะ 💕');
    return false;
  }

  function scrollToPanel() {
    if (window.innerWidth >= 1024) return;
    const y = els.panel.getBoundingClientRect().top + window.scrollY - els.sceneWrap.offsetHeight - 8;
    if (window.scrollY > y + 4) window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
  }

  function goStep(n, opts = {}) {
    n = clamp(n, 0, 4);
    if (n > 0 && !ui.receiver && !validateNames()) {
      if (ui.step !== 0) goStep(0, opts);
      return;
    }
    if (ui.step === 4 && n !== 4) resetFloat(true);
    ui.step = n;
    $$('.step-panel').forEach(p => p.classList.toggle('hidden', +p.dataset.step !== n));
    $$('.step-btn').forEach(b => { const i = +b.dataset.go; b.classList.toggle('active', i === n); b.classList.toggle('done', i < n); });
    els.scene.dataset.focus = n === 1 ? 'couple' : n === 2 ? 'krathong' : '';
    els.scene.classList.toggle('tappable', n === 4);
    els.btnPrev.disabled = n === 0;
    els.btnNext.style.visibility = n === 4 ? 'hidden' : 'visible';
    els.btnNext.textContent = n === 3 ? 'ไปลอยกระทงกันเลย ✨' : 'ถัดไป →';
    updateCaption();
    if (n === 4) { updateFinal(); updateShare(); }
    if (!opts.noScroll) scrollToPanel();
    saveDraft();
  }

  function updateFinal() {
    els.finalNames.textContent = `${state.me.trim() || 'เรา'} & ${state.partner.trim() || 'แฟน'}`;
    els.finalWish.textContent = state.wish.trim() ? `“${state.wish.trim()}”` : 'ขอให้เรารักกันแบบนี้ตลอดไป 💖';
  }

  /* ---- candles, lanterns, fireworks & floating ---- */
  function lightCandles(silent) {
    if (ui.lit) { if (!silent) toast('เทียนสว่างอยู่แล้ว ตั้งจิตอธิษฐานได้เลย 🙏'); return; }
    ui.lit = true;
    $$('[data-flame]', els.krathongBob).forEach(f => { f.style.opacity = '1'; });
    els.krathongLayer.classList.add('lit');
    els.btnLight.classList.add('lit');
    els.btnLightLb.textContent = 'เทียนสว่างแล้ว ✨';
    els.capWish.classList.toggle('show', !!state.wish.trim());
    Music.chime([523.25, 659.25, 783.99]);
    if (!silent) toast('🕯️ จุดเทียนแล้ว… หลับตาแล้วอธิษฐานพร้อมกันนะ');
  }
  function releaseKrathong() {
    if (ui.busy) return;
    if (ui.released) { resetFloat(); return; }
    const go = () => {
      ui.released = true; ui.busy = true;
      const L = els.krathongLayer;
      L.classList.remove('returning'); void L.offsetWidth; L.classList.add('released');
      const r = L.getBoundingClientRect(), s = els.scene.getBoundingClientRect();
      Scene.burstLanterns(r.left + r.width / 2 - s.left, r.top - s.top + r.height * 0.4, 10, true);
      Scene.celebrate(14);
      Music.chime([523.25, 659.25, 783.99, 1046.5]);
      els.btnRelease.disabled = true; els.btnReleaseLb.textContent = 'กระทงกำลังลอยไป…';
      toast('🪷 ปล่อยกระทงแล้ว! ขอให้ทุกคำอธิษฐานเป็นจริงนะ 💖', 3600);
      clearTimeout(ui.releaseTimer);
      ui.releaseTimer = setTimeout(() => {
        ui.busy = false; els.btnRelease.disabled = false; els.btnReleaseLb.textContent = 'ลอยอีกครั้ง 🔁';
      }, 11500);
    };
    if (!ui.lit) { lightCandles(true); toast('🕯️ จุดเทียนอธิษฐาน…'); ui.busy = true; setTimeout(() => { ui.busy = false; go(); }, 1100); }
    else go();
  }
  function resetFloat(quiet) {
    clearTimeout(ui.releaseTimer);
    const wasReleased = ui.released;
    ui.released = false; ui.busy = false;
    els.btnRelease.disabled = false;
    els.btnReleaseLb.textContent = ui.receiver ? 'ลอยกระทงไปด้วยกัน' : 'ปล่อยกระทงคู่';
    const L = els.krathongLayer;
    L.classList.remove('released');
    if (wasReleased && !quiet) { void L.offsetWidth; L.classList.add('returning'); }
  }

  /* ---- share link ---- */
  const baseUrl = () => location.href.split('#')[0].split('?')[0];
  const buildLink = () => `${baseUrl()}?k=${encodeState(state)}`;
  function updateShare() { els.shareLink.value = buildLink(); }
  async function copyLink() {
    const url = buildLink(); els.shareLink.value = url;
    let ok = false;
    try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(url); ok = true; } } catch (e) { ok = false; }
    if (!ok) {
      try { els.shareLink.focus(); els.shareLink.select(); els.shareLink.setSelectionRange(0, url.length); ok = document.execCommand('copy'); } catch (e) { ok = false; }
    }
    if (ok) {
      toast('✅ คัดลอกลิงก์แล้ว! ส่งให้แฟนได้เลย 💌');
      els.btnCopy.textContent = '✓ คัดลอกแล้ว';
      setTimeout(() => { els.btnCopy.textContent = '🔗 คัดลอกลิงก์ส่งให้แฟน'; }, 2200);
    } else {
      toast('คัดลอกอัตโนมัติไม่ได้ กดค้างที่ลิงก์เพื่อคัดลอกนะ');
    }
  }

  /* ---- souvenir photo ---- */
  const thaiDate = () => { try { return new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }); } catch (e) { return new Date().toDateString(); } };
  const safeName = s => (String(s || '').trim().replace(/[\\/:*?"<>|\s]+/g, '-').slice(0, 20) || 'love');
  function svgToImg(svg, w, h, scale = 2) {
    return new Promise((res, rej) => {
      const clone = svg.cloneNode(true);
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      clone.setAttribute('width', Math.max(1, Math.round(w * scale)));
      clone.setAttribute('height', Math.max(1, Math.round(h * scale)));
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = rej;
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(clone));
    });
  }
  async function composeSceneCanvas(sr) {
    const s = clamp(window.devicePixelRatio || 2, 2, 2.5);
    const out = document.createElement('canvas');
    out.width = Math.max(1, Math.round(sr.width * s));
    out.height = Math.max(1, Math.round(sr.height * s));
    const c = out.getContext('2d');
    c.setTransform(s, 0, 0, s, 0, 0);

    // 1) Base night canvas (sky, moon, landmarks, water, lanterns, fireflies, fireworks)
    c.fillStyle = '#070c26';
    c.fillRect(0, 0, sr.width, sr.height);
    c.drawImage(els.sceneCanvas, 0, 0, sr.width, sr.height);

    // 2) Couple SVG layer (crisp retina rasterization at exact live position)
    const coupleSvg = els.coupleLayer.querySelector('svg');
    if (coupleSvg) {
      const b = coupleSvg.getBoundingClientRect();
      const op = parseFloat(getComputedStyle(els.coupleLayer).opacity);
      if (b.width > 0 && b.height > 0 && op > 0.01) {
        const img = await svgToImg(coupleSvg, b.width, b.height, s);
        c.save();
        c.globalAlpha = isNaN(op) ? 1 : op;
        c.shadowColor = 'rgba(0, 0, 0, 0.42)';
        c.shadowBlur = 12;
        c.shadowOffsetY = 5;
        c.drawImage(img, b.left - sr.left, b.top - sr.top, b.width, b.height);
        c.restore();
      }
    }

    // 3) Krathong water ripple, candle glow (when lit), and Krathong SVG layer
    const ktSvg = els.krathongBob.querySelector('svg');
    if (ktSvg) {
      const b = ktSvg.getBoundingClientRect();
      const op = parseFloat(getComputedStyle(els.krathongLayer).opacity);
      if (b.width > 0 && b.height > 0 && op > 0.01) {
        const kx = b.left - sr.left + b.width / 2;
        const ky = b.top - sr.top + b.height;

        // Subtle water ripples beneath krathong
        c.save();
        c.globalAlpha = (isNaN(op) ? 1 : op) * 0.34;
        c.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        c.lineWidth = 1.1;
        c.beginPath();
        c.ellipse(kx, ky - b.height * 0.14, b.width * 0.44, b.height * 0.08, 0, 0, TAU);
        c.stroke();
        c.globalAlpha = (isNaN(op) ? 1 : op) * 0.18;
        c.beginPath();
        c.ellipse(kx, ky - b.height * 0.14, b.width * 0.62, b.height * 0.12, 0, 0, TAU);
        c.stroke();
        c.restore();

        // Warm radial glow when candle is lit
        if (ui.lit) {
          c.save();
          c.globalAlpha = isNaN(op) ? 1 : op;
          c.translate(kx, ky - b.height * 0.28);
          c.scale(1.55, 0.72);
          const gr = c.createRadialGradient(0, 0, 0, 0, 0, b.width * 0.58);
          gr.addColorStop(0, 'rgba(255, 196, 110, 0.56)');
          gr.addColorStop(0.45, 'rgba(255, 150, 80, 0.18)');
          gr.addColorStop(1, 'rgba(255, 150, 80, 0)');
          c.fillStyle = gr;
          c.beginPath();
          c.arc(0, 0, b.width * 0.58, 0, TAU);
          c.fill();
          c.restore();
        }

        // Crisp retina krathong SVG
        const img = await svgToImg(ktSvg, b.width, b.height, s);
        c.save();
        c.globalAlpha = isNaN(op) ? 1 : op;
        c.shadowColor = 'rgba(0, 0, 0, 0.38)';
        c.shadowBlur = 9;
        c.shadowOffsetY = 4;
        c.drawImage(img, b.left - sr.left, b.top - sr.top, b.width, b.height);
        c.restore();
      }
    }

    return out;
  }
  async function savePhoto() {
    if (ui.saving) return;
    ui.saving = true; els.btnSave.disabled = true; els.btnSaveLb.textContent = 'กำลังสร้างรูป…';
    const watermarkText = `🪷 ${state.me.trim() || 'เรา'} ❤ ${state.partner.trim() || 'แฟน'} · ลอยกระทง ${thaiDate()}`;
    const sr = els.scene.getBoundingClientRect();

    // Hide DOM text pills during capture, then draw crisp overlays with reset transform
    els.scene.classList.add('capturing-clean');
    let out = null;
    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      out = await composeSceneCanvas(sr);
    } catch (e) { out = null; }

    // Fallback to html2canvas if direct SVG composition is unavailable
    if (!out && typeof window.html2canvas === 'function') {
      try {
        out = await window.html2canvas(els.scene, {
          backgroundColor: '#070c26',
          width: Math.round(sr.width),
          height: Math.round(sr.height),
          scrollX: 0, scrollY: 0,
          scale: clamp(window.devicePixelRatio || 2, 2, 2.5),
          logging: false, useCORS: true,
          onclone: doc => { const w = doc.getElementById('sceneWrap'); if (w) w.style.position = 'relative'; }
        });
      } catch (e) { out = null; }
    }
    els.scene.classList.remove('capturing-clean');

    if (out) {
      drawSouvenirOverlays(out, sr.width, sr.height, watermarkText);
    }

    ui.saving = false; els.btnSave.disabled = false; els.btnSaveLb.textContent = 'บันทึกรูปที่ระลึก (PNG)';
    if (!out) { toast('ขออภัย บันทึกรูปไม่สำเร็จ ลองใหม่อีกครั้งนะ 🙏'); return; }

    let url;
    try { url = out.toDataURL('image/png'); } catch (e) { toast('ขออภัย บันทึกรูปไม่สำเร็จ'); return; }
    const name = `loykrathong-${safeName(state.me)}-${safeName(state.partner)}.png`;
    ui.lastPhotoName = name;
    out.toBlob(blob => {
      ui.lastPhotoBlob = blob;
      const canShareFile = !!(blob && navigator.canShare && navigator.canShare({ files: [new File([blob], name, { type: 'image/png' })] }));
      els.photoShare.classList.toggle('hidden', !canShareFile);
    }, 'image/png');

    els.photoImg.src = url;
    els.photoDownload.href = url;
    els.photoDownload.setAttribute('download', name);
    els.photoModal.classList.remove('hidden');

    if (window.matchMedia && window.matchMedia('(pointer: fine)').matches) {
      const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    }
    toast('📸 สร้างรูปที่ระลึกเรียบร้อย!');
  }

  async function sharePhotoFile() {
    if (!ui.lastPhotoBlob || !navigator.share) return;
    try {
      const file = new File([ui.lastPhotoBlob], ui.lastPhotoName, { type: 'image/png' });
      await navigator.share({ title: 'รูปที่ระลึกลอยกระทง 💖', text: `${state.me || 'เรา'} ❤ ${state.partner || 'แฟน'}`, files: [file] });
    } catch (e) { /* user cancelled */ }
  }

  /* ---- music ---- */
  function setMusicUI(on) {
    els.musicBtn.classList.toggle('on', on);
    els.musicBtn.setAttribute('aria-pressed', String(on));
    els.musicIcon.textContent = on ? '🎶' : '🔇';
    els.musicLabel.textContent = on ? 'ปิดเพลง' : 'เปิดเพลง';
  }
  function toggleMusic() {
    if (Music.playing) { Music.stop(); setMusicUI(false); return; }
    const ok = Music.start(); setMusicUI(ok);
    if (ok) toast('🎶 เปิดเพลงบรรเลงบรรยากาศลอยกระทงแล้ว'); else toast('เบราว์เซอร์นี้ไม่รองรับการเล่นเสียง');
  }

  /* ---- receiver mode ---- */
  function showInvite() {
    const me = state.me.trim() || 'ใครบางคน';
    els.inviteTitle.innerHTML = `💌 <span class="text-gold-300">${esc(me)}</span> ชวนคุณมาลอยกระทงด้วยกัน`;
    els.inviteSub.textContent = state.partner.trim()
      ? `ถึง ${state.partner.trim()} คนพิเศษ… คืนนี้พระจันทร์เต็มดวง มาลอยกระทงด้วยกันนะ 🌕`
      : 'คืนนี้พระจันทร์เต็มดวง มาลอยกระทงด้วยกันนะ 🌕';
    const box = $('.invite-hearts', els.inviteOverlay);
    box.innerHTML = Array.from({ length: 18 }, () =>
      `<span style="left:${rand(2, 96).toFixed(1)}%;font-size:${rand(14, 30).toFixed(0)}px;animation-duration:${rand(7, 13).toFixed(1)}s;animation-delay:${rand(-12, 0).toFixed(1)}s">${pick(['💖', '💗', '✨', '🪷', '💕', '🏮'])}</span>`).join('');
    els.inviteOverlay.classList.remove('hidden');
    setTimeout(() => els.btnOpenInvite.focus({ preventScroll: true }), 300);
  }
  function typeSecret(delay = 800) {
    const g = graphemes(state.secret.trim() || 'รักนะ คืนนี้ขอให้ได้ลอยกระทงด้วยกันนะ ❤️');
    let i = 0; els.rcvSecret.textContent = '';
    clearInterval(ui.typeTimer);
    setTimeout(() => {
      ui.typeTimer = setInterval(() => {
        i++; els.rcvSecret.textContent = g.slice(0, i).join('');
        if (i >= g.length) clearInterval(ui.typeTimer);
      }, 50);
    }, delay);
  }
  function openInvite() {
    if (Music.start()) setMusicUI(true);
    els.inviteOverlay.classList.add('closing');
    setTimeout(() => { els.inviteOverlay.classList.add('hidden'); els.inviteOverlay.classList.remove('closing'); }, 800);
    goStep(4, { noScroll: true });
    typeSecret(700);
    setTimeout(() => toast(`🕯️ จุดเทียน แล้วกด “ลอยกระทงไปด้วยกัน” กับ ${state.me.trim() || 'คนพิเศษ'} นะ`, 3600), 1500);
  }
  function makeOwn() {
    const s = DEFAULT_STATE();
    s.me = state.partner; s.partner = state.me;
    s.av = [{ ...state.av[1] }, { ...state.av[0] }];
    s.kt = { ...state.kt }; s.place = state.place;
    saveDraft(s);
    location.href = baseUrl();
  }

  /* ---- events ---- */
  function bind() {
    const onText = () => { updateCaption(); updateCounters(); renderKrathongSoon(); saveDraft(); if (ui.step === 4) { updateFinal(); updateShare(); } };
    els.inMe.addEventListener('input', () => { state.me = els.inMe.value; els.inMe.classList.remove('invalid'); onText(); });
    els.inPartner.addEventListener('input', () => { state.partner = els.inPartner.value; els.inPartner.classList.remove('invalid'); onText(); });
    els.inWish.addEventListener('input', () => { state.wish = els.inWish.value; onText(); });
    els.inSecret.addEventListener('input', () => { state.secret = els.inSecret.value; onText(); });

    // Mobile keyboard-friendly: unstick scene while typing in inputs
    let blurTimer = 0;
    document.addEventListener('focusin', e => {
      if (e.target && e.target.matches('input:not([readonly]), textarea')) {
        clearTimeout(blurTimer);
        document.body.classList.add('typing');
      }
    });
    document.addEventListener('focusout', e => {
      if (e.target && e.target.matches('input:not([readonly]), textarea')) {
        blurTimer = setTimeout(() => document.body.classList.remove('typing'), 180);
      }
    });

    // Expand / collapse scene on mobile
    els.btnExpandScene.addEventListener('click', () => {
      ui.expanded = !ui.expanded;
      els.scene.classList.toggle('expanded', ui.expanded);
      els.btnExpandScene.setAttribute('aria-pressed', String(ui.expanded));
      els.expandIcon.textContent = ui.expanded ? '⤡' : '⤢';
      setTimeout(() => Scene.resize(), 400);
    });

    els.btnSweetIdea.addEventListener('click', () => {
      state.secret = pick(SWEET_IDEAS);
      els.inSecret.value = state.secret;
      updateCounters(); saveDraft();
      toast('💌 สุ่มข้อความหวานๆ ให้แล้ว ปรับแก้ได้ตามใจเลย!');
    });

    $$('.step-btn').forEach(b => b.addEventListener('click', () => goStep(+b.dataset.go)));
    els.btnPrev.addEventListener('click', () => goStep(ui.step - 1));
    els.btnNext.addEventListener('click', () => goStep(ui.step + 1));
    $$('.tab').forEach(t => t.addEventListener('click', () => { ui.person = +t.dataset.person; renderOptions(); }));
    els.togLabel.addEventListener('change', () => { state.kt.label = els.togLabel.checked ? 1 : 0; changed('kt'); });
    els.optPlace.addEventListener('click', e => { const b = e.target.closest('button[data-i]'); if (b) { state.place = +b.dataset.i; changed('place'); } });

    els.btnSwapCouple.addEventListener('click', () => {
      state.av = [state.av[1], state.av[0]];
      changed('av');
      toast('🔀 สลับตำแหน่งคู่รักซ้าย-ขวาแล้ว');
    });
    els.btnRandomAvatar.addEventListener('click', () => {
      state.av[ui.person] = {
        hair: ri(HAIRS.length), hc: ri(HAIR_COLORS.length), skin: ri(SKIN_TONES.length),
        outfit: ri(OUTFITS.length), acc: ri(ACCESSORIES.length), face: ri(FACES.length)
      };
      changed('av');
    });
    els.btnRandomKt.addEventListener('click', () => {
      state.kt = { base: ri(BASES.length), flower: ri(FLOWERS.length), candle: ri(CANDLES.length), extra: ri(EXTRAS.length), label: state.kt.label };
      changed('kt');
    });

    els.btnLight.addEventListener('click', () => lightCandles(false));
    els.btnRelease.addEventListener('click', releaseKrathong);
    els.btnLantern.addEventListener('click', () => {
      Scene.releaseSpecialLantern();
      Music.chime([659.25, 783.99, 1046.5]);
      toast('🏮 ปล่อยโคมลอยคู่ขึ้นสู่ท้องฟ้าแล้ว ขอให้สมหวังนะ ✨');
    });
    els.btnFirework.addEventListener('click', () => {
      Scene.celebrate(6);
      Music.chime([523.25, 783.99, 1046.5]);
      toast('🎆 จุดพลุฉลองคืนวันเพ็ญ!');
    });
    els.btnSave.addEventListener('click', savePhoto);
    els.btnCopy.addEventListener('click', copyLink);
    els.shareLink.addEventListener('focus', () => els.shareLink.select());
    els.btnPreview.addEventListener('click', () => window.open(buildLink(), '_blank', 'noopener'));
    els.btnNativeShare.addEventListener('click', () => {
      navigator.share({ title: 'ลอยกระทงออนไลน์กับแฟน 💖', text: `💌 ${state.me || 'เรา'} ชวน ${state.partner || 'คุณ'} มาลอยกระทงด้วยกัน`, url: buildLink() }).catch(() => {});
    });
    els.btnMakeOwn.addEventListener('click', makeOwn);
    els.btnReplaySecret.addEventListener('click', () => typeSecret(100));
    els.musicBtn.addEventListener('click', toggleMusic);
    els.btnOpenInvite.addEventListener('click', openInvite);

    const closePhoto = () => els.photoModal.classList.add('hidden');
    els.photoClose.addEventListener('click', closePhoto);
    els.photoCloseTop.addEventListener('click', closePhoto);
    els.photoShare.addEventListener('click', sharePhotoFile);
    els.photoModal.addEventListener('click', e => { if (e.target === els.photoModal) closePhoto(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closePhoto(); });

    // tap the sky for fireworks / tap krathong to light
    els.scene.addEventListener('pointerdown', e => {
      if (e.target.closest('button')) return;
      if (ui.step !== 4) return;
      if (e.target.closest('.krathong-layer')) { lightCandles(false); return; }
      if (e.target.closest('.couple-layer')) return;
      const r = els.scene.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      if (y < r.height * 0.62) Scene.launchAt(x, y);
    });
  }

  /* ================= 9) BOOT ================= */
  function boot() {
    IDS.forEach(id => { els[id] = document.getElementById(id); });

    let badLink = false;
    const code = new URLSearchParams(location.search).get('k');
    if (code) {
      try { state = decodeState(code); ui.receiver = true; } catch (e) { badLink = true; loadDraft(); }
    } else {
      loadDraft();
    }
    if (ui.receiver) {
      document.body.classList.add('receiver');
      els.rcvFrom.textContent = state.me.trim() || 'คนพิเศษ';
      els.rcvBack.textContent = state.me.trim() || 'คนพิเศษ';
      els.btnReleaseLb.textContent = 'ลอยกระทงไปด้วยกัน';
      document.title = `💌 ${state.me.trim() || 'คนพิเศษ'} ชวนคุณมาลอยกระทงด้วยกัน`;
    }

    els.inMe.value = state.me; els.inPartner.value = state.partner;
    els.inWish.value = state.wish; els.inSecret.value = state.secret;
    updateCounters();
    renderWishPresets();

    Scene.init(els.sceneCanvas, state.place);
    renderCouple(); renderKrathong(); renderOptions(); updateCaption();
    bind();

    if (navigator.share) els.btnNativeShare.classList.remove('hidden');
    if (location.protocol === 'file:') {
      const note = document.createElement('p');
      note.className = 'text-[11px] text-gold-300/80 mt-2 leading-relaxed';
      note.textContent = '⚠️ ตอนนี้เปิดจากไฟล์ในเครื่อง ลิงก์จะเปิดได้เฉพาะเครื่องนี้ — อัปโหลดขึ้นโฮสต์ (เช่น GitHub Pages / Netlify) เพื่อส่งให้แฟนเปิดบนมือถือได้จริง';
      $('.share-box').appendChild(note);
    }

    if (ui.receiver) { goStep(4, { noScroll: true }); showInvite(); }
    else goStep(0, { noScroll: true });
    if (badLink) toast('ลิงก์นี้ไม่ถูกต้องหรือไม่สมบูรณ์ 😢 มาสร้างกระทงใหม่กันนะ', 4000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
