/* ============ 记账本 · 1.0.1 ============ */
(function () {
  'use strict';

  var KEY = 'ledger.v3';
  var raf = window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function (f) { return setTimeout(f, 16); };
  var VERSION = '2.1.8';
  var WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  var CATS = {
    expense: [
      ['餐饮', '#ffb05c'], ['交通', '#5ab0ff'], ['汽车', '#7cc4ff'], ['零食', '#ffa6c1'],
      ['居住', '#7fd7b0'], ['娱乐', '#ffd36e'], ['医疗', '#ff8f9c'], ['社交', '#c1a6ff'],
      ['通讯', '#a8d96e'], ['购物', '#6aa8ff'], ['孩子', '#ffc471'], ['其他', '#b8c4d4']
    ],
    income: [
      ['工资', '#34c98b'], ['奖金', '#4fd6a0'], ['兼职', '#5ab0ff'],
      ['理财', '#a58bff'], ['红包', '#ff8fa3'], ['其他', '#b8c4d4']
    ]
  };
  var CAT_MAP = {};
  CATS.expense.concat(CATS.income).forEach(function (c) { CAT_MAP[c[0]] = c[1]; });

  /* 分类图标：用户手绘的一套扁平图标，assets/icons/*.png */
  var ICONF = {
    '餐饮': 'food', '交通': 'bus', '汽车': 'car', '零食': 'snack', '居住': 'home',
    '娱乐': 'game', '医疗': 'med', '社交': 'social', '通讯': 'phone', '购物': 'shop',
    '孩子': 'family', '其他': 'more', '工资': 'salary', '奖金': 'gift', '兼职': 'part',
    '理财': 'invest', '红包': 'redpack'
  };
  function catIcon(cat) {
    var f = ICONF[cat];
    if (!f) f = 'more';
    return '<img class="ci" src="icons/' + f + '.png" alt="" draggable="false">';
  }

  var ICON = {
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 3.6v2.2M12 18.2v2.2M3.6 12h2.2M18.2 12h2.2M6.1 6.1l1.6 1.6M16.3 16.3l1.6 1.6M17.9 6.1l-1.6 1.6M7.7 16.3l-1.6 1.6"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5.4" width="16" height="15" rx="4"/><path d="M8 3.4v3.6M16 3.4v3.6M4 10h16"/><path d="M8.4 13.4h.1M12 13.4h.1M15.6 13.4h.1M8.4 16.8h.1M12 16.8h.1"/></svg>',
    pencil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4.2 19.8h4L19 9 15 5 4.2 15.8v4Z"/><path d="m13.5 6.5 4 4"/></svg>'
  };

  var CAT_SVG = '<svg class="cat-art" viewBox="0 0 180 140" aria-hidden="true">' +
    '<path d="M138 112c16 2 22-8 18-20" fill="none" stroke="#f6e3d2" stroke-width="9" stroke-linecap="round"/>' +
    '<ellipse cx="90" cy="108" rx="58" ry="26" fill="#fffdf8" stroke="#f3e4d4" stroke-width="2"/>' +
    '<ellipse cx="64" cy="128" rx="12" ry="7" fill="#fffdf8" stroke="#f3e4d4" stroke-width="2"/>' +
    '<ellipse cx="108" cy="128" rx="12" ry="7" fill="#fffdf8" stroke="#f3e4d4" stroke-width="2"/>' +
    '<path d="M44 68 46 34l24 19Z" fill="#fffdf8" stroke="#f3e4d4" stroke-width="2" stroke-linejoin="round"/>' +
    '<path d="M104 53l22-19 2 34Z" fill="#fffdf8" stroke="#f3e4d4" stroke-width="2" stroke-linejoin="round"/>' +
    '<path d="M50 61 51 44l15 12Z" fill="#ffc2cd"/>' +
    '<path d="M109 54l14-12 1 17Z" fill="#ffc2cd"/>' +
    '<circle cx="82" cy="80" r="36" fill="#fffdf8" stroke="#f3e4d4" stroke-width="2"/>' +
    '<path d="M82 44c15 0 27 8 32 21-9 4-19 5-29 2-10-3-17-9-21-17 5-4 11-6 18-6Z" fill="#ffe4c4" opacity=".8"/>' +
    '<path d="M66 78q6 6 12 0" stroke="#7d6a56" stroke-width="3" fill="none" stroke-linecap="round"/>' +
    '<path d="M88 78q6 6 12 0" stroke="#7d6a56" stroke-width="3" fill="none" stroke-linecap="round"/>' +
    '<ellipse cx="62" cy="90" rx="7" ry="4.5" fill="#ffd3d8" opacity=".9"/>' +
    '<ellipse cx="104" cy="90" rx="7" ry="4.5" fill="#ffd3d8" opacity=".9"/>' +
    '<path d="M80 86l4 0-2 3Z" fill="#ff9aae"/>' +
    '<path d="M82 90q-4 4-7 1M82 90q4 4 7 1" stroke="#7d6a56" stroke-width="2" fill="none" stroke-linecap="round"/>' +
    '<path d="M50 86h-10M50 92h-9M114 86h10M114 92h9" stroke="#e8d5c2" stroke-width="2" stroke-linecap="round"/>' +
    '<path d="M128 62c3-6 11-5 11 1 0 5-7 9-11 12-4-3-11-7-11-12 0-6 8-7 11-1Z" fill="#ff9fb2" opacity=".85"/>' +
    '</svg>';

  var PLANT_SVG = '<svg class="plant-art" viewBox="0 0 80 110" aria-hidden="true">' +
    '<path d="M40 76V38" stroke="#79b98a" stroke-width="3" stroke-linecap="round"/>' +
    '<path d="M40 58c-14 0-22-8-24-20 12-2 22 6 24 20Z" fill="#8fd3a4"/>' +
    '<path d="M40 50c12-2 20-10 20-22-11 0-19 8-20 22Z" fill="#a8e0b8"/>' +
    '<path d="M40 40c-8-6-10-16-6-26 8 4 10 14 6 26Z" fill="#6fc98c"/>' +
    '<path d="M25 78h30l-4 25a4 4 0 0 1-4 3H33a4 4 0 0 1-4-3Z" fill="#ffcf87"/>' +
    '<rect x="22" y="73" width="36" height="8" rx="3" fill="#ffdfae"/>' +
    '</svg>';

  var FLOWERS = '<svg viewBox="0 0 360 60" preserveAspectRatio="xMidYMax slice" aria-hidden="true">' +
    '<path d="M18 60c0-12 4-20 12-26" stroke="#a5dbbc" stroke-width="3" fill="none" stroke-linecap="round"/>' +
    '<path d="M28 46c-7-2-10-7-10-13 6 0 11 4 10 13Z" fill="#bfe8cf"/>' +
    '<circle cx="34" cy="30" r="6" fill="#ffd3dc"/><circle cx="34" cy="30" r="2.4" fill="#ffd166"/>' +
    '<circle cx="25" cy="35" r="4" fill="#ffe3ea"/>' +
    '<path d="M340 60c2-14-2-22-10-28" stroke="#a5dbbc" stroke-width="3" fill="none" stroke-linecap="round"/>' +
    '<path d="M330 44c7-2 10-7 10-13-6 0-11 4-10 13Z" fill="#bfe8cf"/>' +
    '<circle cx="326" cy="28" r="6" fill="#ffe3ea"/><circle cx="326" cy="28" r="2.4" fill="#ffd166"/>' +
    '</svg>';

  var STAT_ART = '<svg class="sh-art" viewBox="0 0 130 100" aria-hidden="true">' +
    '<defs><linearGradient id="barGrad" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#9dc9ff"/><stop offset="1" stop-color="#4a8cf7"/></linearGradient></defs>' +
    '<rect x="14" y="58" width="15" height="28" rx="5" fill="#cfe4ff"/>' +
    '<rect x="38" y="46" width="15" height="40" rx="5" fill="#a9d0ff"/>' +
    '<rect x="62" y="34" width="15" height="52" rx="5" fill="url(#barGrad)"/>' +
    '<circle cx="104" cy="64" r="13" fill="#ffd15c"/>' +
    '<text x="104" y="69" text-anchor="middle" font-size="13" font-weight="700" fill="#b07a10">¥</text>' +
    '<path d="M20 46 48 30 74 18 106 8" stroke="#4a8cf7" stroke-width="3" fill="none" stroke-linecap="round"/>' +
    '<path d="M98 10l10-3-2 11" fill="none" stroke="#4a8cf7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>';

  var TIP_ART = '<svg class="tip-art" viewBox="0 0 60 60" aria-hidden="true">' +
    '<circle cx="30" cy="34" r="17" fill="rgba(34,181,115,.10)"/>' +
    '<path d="M30 46V26" stroke="#58b98a" stroke-width="2.4" stroke-linecap="round"/>' +
    '<path d="M30 34c-9 0-14-5-15-13 8-1 14 4 15 13Z" fill="#8fd9ae"/>' +
    '<path d="M30 30c7-1 12-6 12-13-7 0-12 5-12 13Z" fill="#6fcb9a"/>' +
    '<circle cx="42" cy="44" r="8" fill="#ffd15c"/>' +
    '<text x="42" y="47" text-anchor="middle" font-size="8" font-weight="700" fill="#b07a10">¥</text>' +
    '</svg>';

  /* ---------- 工具 ---------- */
  function $(s, root) { return (root || document).querySelector(s); }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parseYmd(s) {
    var p = String(s || '').split('-');
    return new Date(+p[0], (+p[1] || 1) - 1, +p[2] || 1);
  }
  function today() { return ymd(new Date()); }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function rgba(hex, a) {
    var h = String(hex || '#b8c4d4').replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  function money(n) {
    n = Number(n) || 0;
    var neg = n < 0;
    var s = Math.abs(n).toFixed(2);
    var p = s.split('.');
    p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (neg ? '-' : '') + p.join('.');
  }
  function yuan(n) { n = Number(n) || 0; return (n < 0 ? '-¥' : '¥') + money(Math.abs(n)); }
  function cnMonth(m) {
    return ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'][m - 1] + '月';
  }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function sum(list, type) {
    var t = 0;
    list.forEach(function (r) { if (r.type === type) t += r.amount; });
    return Math.round(t * 100) / 100;
  }
  function hhmm(ts) {
    var d = new Date(Number(ts) || 0);
    if (isNaN(d.getTime())) return '';
    return pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  function haptic() {
    try { if (window.Native && Native.haptic) { Native.haptic(); return; } } catch (e) {}
    try { if (navigator.vibrate) navigator.vibrate(8); } catch (e) {}
  }

  /* ---------- 存储 ---------- */
  var BG_ORDER = ['blue', 'sky', 'teal', 'navy', 'pink', 'wine', 'bean', 'mauve', 'purple', 'green', 'forest', 'sage', 'yellow', 'apricot', 'coco', 'slate', 'gray', 'rainbow'];
  var DB = loadDB();
  var saveTimer = 0;

  function loadDB() {
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) {}
    var d = null;
    if (raw) { try { d = JSON.parse(raw); } catch (e) { d = null; } }
    if (!d || typeof d !== 'object') d = {};
    d.v = 3;
    if (!Array.isArray(d.records)) d.records = [];
    d.records = d.records.map(normRec).filter(Boolean);
    if (!d.notes || typeof d.notes !== 'object') d.notes = {};
    if (['system', 'light', 'dark'].indexOf(d.theme) < 0) d.theme = 'system';
    if (BG_ORDER.indexOf(d.bg) < 0) d.bg = 'blue';
    if (typeof d.plusTint !== 'boolean') d.plusTint = false;
    if (!d.sync || typeof d.sync !== 'object') d.sync = {};
    d.sync = {
      enabled: false,
      server: d.sync.server || 'https://dav.jianguoyun.com/dav',
      user: d.sync.user || '',
      pass: d.sync.pass || '',
      file: d.sync.file || '记账本.json'
    };
    d.updatedAt = d.updatedAt || 0;
    d.lastSync = d.lastSync || 0;
    return d;
  }

  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(DB)); }
    catch (e) { toast('保存失败，存储空间可能满了'); }
  }

  function save() {
    clearTimeout(saveTimer);
    setTimeout(pushWidget, 0);
    DB.updatedAt = Date.now();
    DB.rev = Date.now();
    persist();
    scheduleAutoSync();
  }
  function pushWidget() {
    try {
      if (!window.Native || !Native.setWidgetData) return;
      var now = new Date(), y = now.getFullYear(), m = now.getMonth();
      var me = 0, mi = 0, te = 0, td = today();
      DB.records.forEach(function (r) {
        var p = String(r.date).split('-');
        var sameM = Number(p[0]) === y && (Number(p[1]) - 1) === m;
        if (r.type === 'expense') {
          if (sameM) me += r.amount;
          if (r.date === td) te += r.amount;
        } else if (sameM) { mi += r.amount; }
      });
      Native.setWidgetData(JSON.stringify({
        monthExp: yuan(me), monthInc: yuan(mi), todayExp: yuan(te),
        monthLabel: y + '年' + (m + 1) + '月',
        accent: (BG_PRESETS[DB.bg] || BG_PRESETS.blue).accent
      }));
    } catch (e) {}
  }

  function saveSoon() { clearTimeout(saveTimer); saveTimer = setTimeout(save, 250); }

  function normRec(o) {
    if (!o || typeof o !== 'object') return null;
    var amt = Number(String(o.amount == null ? 0 : o.amount).replace(/[^\d.-]/g, ''));
    if (!isFinite(amt) || amt <= 0) return null;
    var date = String(o.date || '').replace(/\//g, '-');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) date = today();
    var t = o.type;
    var type = (t === 'income' || t === '收入' || t === 'in') ? 'income' : 'expense';
    var cat = String(o.cat || o.category || '其他');
    if (!CAT_MAP[cat]) cat = '其他';
    return {
      id: String(o.id || uid()),
      type: type,
      cat: cat,
      amount: Math.round(amt * 100) / 100,
      note: String(o.note || '').slice(0, 60),
      date: date,
      createdAt: Number(o.createdAt) || Date.now()
    };
  }

  /* ---------- 主题 ---------- */
  function systemDark() {
    try { if (window.Native && Native.systemDark) return !!Native.systemDark(); } catch (e) {}
    try { return !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches); } catch (e) {}
    return false;
  }
  var BG_PRESETS = {
    blue:   { label: '浅蓝', bg: '#eaf4ff', sky: '#cfe7ff', sky2: '#dff0ff', sky3: '#eef8ff', nav: '#ffffff', hue: '0deg', sat: '1', accent: '#3f7ef0', soft: 'rgba(120,170,255,.15)' },
    pink:   { label: '浅粉', bg: '#ffecef', sky: '#ffd6de', sky2: '#ffe6ea', sky3: '#fff4f6', nav: '#fff6f7', hue: '125deg', sat: '1.05', accent: '#e0637f', soft: 'rgba(232,110,140,.15)' },
    green:  { label: '暗紫', bg: '#dccdf0', sky: '#c0a8e6', sky2: '#d0bdee', sky3: '#f0e8fb', nav: '#ffffff', hue: '60deg', sat: '1.05', accent: '#6b4fb0', soft: 'rgba(107,79,176,.14)' },
    yellow: { label: '浅黄', bg: '#fff7e8', sky: '#ffe8bd', sky2: '#fff2d3', sky3: '#fffaee', nav: '#fffbf3', hue: '-170deg', sat: '1.15', accent: '#c08a1c', soft: 'rgba(232,186,80,.18)' },
    purple: { label: '浅紫', bg: '#e9ddfc', sky: '#d3c0f4', sky2: '#e0d0fa', sky3: '#f5eeff', nav: '#f9f6ff', hue: '60deg', sat: '1.05', accent: '#7a5cf0', soft: 'rgba(150,120,255,.16)' },
    rainbow:{ label: '多彩', bg: '#f2f4fa', sky: '#ffdbe5', sky2: '#e4eaff', sky3: '#e6f8ee', nav: '#ffffff', hue: '0deg', sat: '1', accent: '#111111', soft: 'rgba(0,0,0,.07)', rainbow: true },
    sky:    { label: '天蓝', bg: '#e6f5fc', sky: '#c6e6f6', sky2: '#d8effa', sky3: '#eff9fd', nav: '#ffffff', hue: '-12deg', sat: '1', accent: '#1d7fa6', soft: 'rgba(29,127,166,.13)' },
    wine:   { label: '酒红', bg: '#f1d3da', sky: '#deaab5', sky2: '#ecc4cc', sky3: '#f9e7ea', nav: '#ffffff', hue: '135deg', sat: '1.1', accent: '#9c2a44', soft: 'rgba(156,42,68,.12)' },
    mauve:  { label: '藕荷', bg: '#f6ecf6', sky: '#e6d0e6', sky2: '#f0e0f0', sky3: '#fbf4fb', nav: '#ffffff', hue: '98deg', sat: '1.05', accent: '#8a4f8a', soft: 'rgba(138,79,138,.12)' },
    apricot:{ label: '杏橙', bg: '#fff1e4', sky: '#ffd9bb', sky2: '#ffe6d1', sky3: '#fff8f0', nav: '#ffffff', hue: '-158deg', sat: '1.12', accent: '#bd661a', soft: 'rgba(189,102,26,.13)' },
    teal:   { label: '青碧', bg: '#ddf2ef', sky: '#bfe6df', sky2: '#d3ece7', sky3: '#eff9f7', nav: '#ffffff', hue: '-122deg', sat: '1.05', accent: '#1d7a6b', soft: 'rgba(29,122,107,.12)' },
    navy:   { label: '藏青', bg: '#dfe7f4', sky: '#c3d3ea', sky2: '#d5e0f0', sky3: '#eef3f9', nav: '#ffffff', hue: '6deg', sat: '.9', accent: '#2b4a80', soft: 'rgba(43,74,128,.12)' },
    bean:   { label: '豆沙', bg: '#f0dcda', sky: '#e2c3c0', sky2: '#eed6d3', sky3: '#fbf0ee', nav: '#ffffff', hue: '140deg', sat: '1.08', accent: '#9c4f48', soft: 'rgba(156,79,72,.12)' },
    sage:   { label: '青灰', bg: '#e3ece8', sky: '#c7dbd2', sky2: '#d9e7e0', sky3: '#f2f7f4', nav: '#ffffff', hue: '-95deg', sat: '.95', accent: '#3d6b5c', soft: 'rgba(61,107,92,.12)' },
    coco:   { label: '可可', bg: '#efe2d6', sky: '#e0c9b3', sky2: '#eedcc9', sky3: '#faf3ec', nav: '#ffffff', hue: '-175deg', sat: '1.1', accent: '#8a5a30', soft: 'rgba(138,90,48,.12)' },
    slate:  { label: '雾蓝', bg: '#e5edf7', sky: '#c9d9ec', sky2: '#dbe6f3', sky3: '#eff4fa', nav: '#ffffff', hue: '8deg', sat: '.85', accent: '#2f5c94', soft: 'rgba(47,92,148,.12)' },
    forest: { label: '墨绿', bg: '#e4f1ea', sky: '#c4ddcd', sky2: '#d7ebdf', sky3: '#eff8f2', nav: '#ffffff', hue: '-76deg', sat: '1.1', accent: '#1f6b4a', soft: 'rgba(31,107,74,.12)' },
    gray:   { label: '浅灰', bg: '#f0f3f7', sky: '#dce4ee', sky2: '#e9eef4', sky3: '#f6f8fa', nav: '#fafbfc', hue: '0deg', sat: '.18', accent: '#5b6b80', soft: 'rgba(140,155,175,.16)' }
  };

  function applyBg() {
    var p = BG_PRESETS[DB.bg] || BG_PRESETS.blue;
    var r = document.documentElement.style;
    var dark = isDark();
    var DK = '#0b0b12';
    r.setProperty('--page-bg', dark ? DK : p.bg);
    r.setProperty('--sky', dark ? DK : p.sky);
    r.setProperty('--sky2', dark ? DK : p.sky2);
    r.setProperty('--sky3', dark ? DK : p.sky3);
    r.setProperty('--nav-bg', dark ? '#111119' : '#ffffff');
    r.setProperty('--nav-hue', dark ? '0deg' : p.hue);
    r.setProperty('--nav-sat', dark ? '1' : p.sat);
    r.setProperty('--accent', dark ? '#6fb3ff' : p.accent);
    r.setProperty('--accent-soft', dark ? 'rgba(111,179,255,.14)' : p.soft);
    document.documentElement.setAttribute('data-plustint', (!dark && DB.plusTint) ? '1' : '0');
    if (!dark && p.rainbow) document.documentElement.setAttribute('data-bg', 'rainbow');
    else document.documentElement.removeAttribute('data-bg');
    try {
      var g = dark ? glowBg(p)
        : (p.rainbow ? ('radial-gradient(130% 76% at 8% 0%, #ffdbe5 0%, rgba(255,219,229,0) 62%),' +
            'radial-gradient(110% 66% at 96% 6%, #e4eaff 0%, rgba(228,234,255,0) 60%),' +
            'radial-gradient(120% 70% at 26% 100%, #e6f8ee 0%, rgba(230,248,238,0) 66%),' +
            'radial-gradient(96% 60% at 88% 92%, #fff0d9 0%, rgba(255,240,217,0) 62%)')
          : 'none');
      r.setProperty('--glow-img', g);
      var gl = document.getElementById('glowLayer');
      if (gl) gl.style.backgroundImage = g;
      if (document.body) {
        document.body.style.backgroundColor = dark ? DK : p.bg;
        document.body.style.backgroundImage = 'none';
      }
    } catch (e) {}
    try { if (window.Native && Native.setBg) Native.setBg(dark ? DK : p.bg); } catch (e) {}
  }

  function bgRipple() {
    var p = BG_PRESETS[DB.bg] || BG_PRESETS.blue;
    if (p.rainbow || isDark()) { applyTheme(); return; }
    var ov = document.createElement('div');
    ov.className = 'bg-ripple';
    ov.style.background = p.bg;
    document.body.appendChild(ov);
    var d = Math.ceil(Math.sqrt(window.innerWidth * window.innerWidth + window.innerHeight * window.innerHeight)) + 30;
    ov.style.clipPath = 'circle(0px at 0px 0px)';
    raf(function () {
      raf(function () {
        ov.style.transition = 'clip-path 2.2s cubic-bezier(.3,.66,.22,1)';
        ov.style.clipPath = 'circle(' + d + 'px at 0px 0px)';
      });
    });
    setTimeout(function () {
      applyTheme();
      if (ov.parentNode) ov.parentNode.removeChild(ov);
    }, 2200);
  }

  function hexA(hex, a) {
    var h = String(hex || '#6fb3ff').replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    if (isNaN(n)) return 'rgba(111,179,255,' + a + ')';
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  function glowBg(preset) {
    preset = preset || BG_PRESETS.blue;
    var rb = !!preset.rainbow;
    var accent = rb ? '#7b8cff' : preset.accent;
    var accent2 = rb ? '#ff8fd0' : preset.accent;
    var g = DB.glow;
    if (!g || !g.a || !g.b || g.v !== 4) {   // v4：光晕往中间挪一点
      g = DB.glow = {
        v: 4,
        a: [Math.round(62 + Math.random() * 16), Math.round(4 + Math.random() * 10)],
        b: [Math.round(28 + Math.random() * 22), Math.round(70 + Math.random() * 14)]
      };
      try { persist(); } catch (e) {}
    }
    function g1(p) { return 'radial-gradient(105% 64% at ' + p[0] + '% ' + p[1] + '%, ' + hexA(accent, .34) + ' 0%, ' + hexA(accent, 0) + ' 66%)'; }
    function g2(p) { return 'radial-gradient(88% 52% at ' + p[0] + '% ' + p[1] + '%, ' + hexA(accent2, .24) + ' 0%, ' + hexA(accent2, 0) + ' 68%)'; }
    if (rb) {
      var g3 = 'radial-gradient(120% 70% at 18% 72%, ' + hexA('#4fd6c4', .22) + ' 0%, ' + hexA('#4fd6c4', 0) + ' 70%)';
      var g4 = 'radial-gradient(100% 60% at 82% 34%, ' + hexA('#c58bff', .20) + ' 0%, ' + hexA('#c58bff', 0) + ' 68%)';
      var g5 = 'radial-gradient(90% 54% at 52% 96%, ' + hexA('#ffb45e', .16) + ' 0%, ' + hexA('#ffb45e', 0) + ' 72%)';
      return g1(g.a) + ',' + g2(g.b) + ',' + g3 + ',' + g4 + ',' + g5;
    }
    return g1(g.a) + ',' + g2(g.b);
  }

  function isDark() {
    return DB.theme === 'dark' || (DB.theme === 'system' && systemDark());
  }
  function applyTheme() {
    var dark = isDark();
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    applyBg();
    try { if (window.Native && Native.setTheme) Native.setTheme(dark); } catch (e) {}
    setTimeout(syncStatusBar, 30);
  }

  /* ---------- 状态 ---------- */
  var tab = 'home';
  var listYM = new Date();
  var listFilter = 'all';
  var statMetric = 'expense';
  var statMode = 'month';
  var statYM = new Date();
  var meOpen = false;
  var openRec = null;
  var suppressClick = false;
  var netCbs = {};
  var netSeq = 0;
  var view = $('#view');

  /* ---------- 渲染入口 ---------- */
  var slideSeq = 0;
  function contentSlide(dir, dur) {
    dur = dur || 780;
    var seq = ++slideSeq;
    view.style.transition = 'none';
    view.style.transform = 'translateX(' + (dir * 54) + 'px)';
    view.style.opacity = '.25';
    raf(function () {
      raf(function () {
        if (seq !== slideSeq) return;
        view.style.transition = 'transform ' + dur + 'ms cubic-bezier(.16,.74,.24,1),opacity ' + Math.round(dur * 0.62) + 'ms ease';
        view.style.transform = 'translateX(0)';
        view.style.opacity = '1';
      });
    });
    setTimeout(function () {
      if (seq !== slideSeq) return;
      view.style.transition = '';
      view.style.transform = '';
      view.style.opacity = '';
    }, dur + 80);
  }

  function go(t) {
    if (t === tab) { view.scrollTop = 0; return; }
    var order = ['home', 'stats', 'list', 'me'];
    var dir = order.indexOf(t) >= order.indexOf(tab) ? 1 : -1;
    tab = t;
    render();
    view.scrollTop = 0;
    contentSlide(dir, 700);
  }

  var numCache = {};
  function animateNums() {
    var els = view.querySelectorAll('[data-nk]');
    for (var i = 0; i < els.length; i++) {
      (function (el) {
        var k = el.getAttribute('data-nk');
        var v = parseFloat(el.getAttribute('data-nv')) || 0;
        var p = el.getAttribute('data-np') || '';
        var from = numCache[k];
        if (from === undefined) from = 0;
        numCache[k] = v;
        if (Math.abs(v - from) < 0.005) { el.textContent = p + money(v); return; }
        var t0 = performance.now(), dur = 520;
        function tick(now) {
          var t = Math.min(1, (now - t0) / dur);
          var e = 1 - Math.pow(1 - t, 3);
          el.textContent = p + money(from + (v - from) * e);
          if (t < 1) raf(tick);
        }
        raf(tick);
      })(els[i]);
    }
  }
  function animateCharts() {
    var segs = view.querySelectorAll('.donut-seg');
    for (var i = 0; i < segs.length; i++) {
      (function (c) {
        var len = parseFloat(c.getAttribute('data-len')) || 0;
        var comma = c.getAttribute('stroke-dasharray').split(' ')[1];
        var t0 = performance.now(), dur = 620;
        function tick(now) {
          var t = Math.min(1, (now - t0) / dur);
          var e = 1 - Math.pow(1 - t, 3);
          c.setAttribute('stroke-dasharray', (len * e).toFixed(1) + ' ' + comma);
          if (t < 1) raf(tick);
        }
        raf(tick);
      })(segs[i]);
    }
    var spark = view.querySelector('.spark');
    if (spark) spark.classList.add('play');
  }

  function numTag(key, value, prefix, cls) {
    return '<b' + (cls ? ' class="' + cls + '"' : '') + ' data-nk="' + key + '" data-np="' + prefix +
      '" data-nv="' + value + '">' + prefix + money(value) + '</b>';
  }

  function render() {
    var top = view.scrollTop;
    if (tab === 'home') view.innerHTML = homeHTML();
    else if (tab === 'stats') view.innerHTML = statsHTML();
    else if (tab === 'me') view.innerHTML = meHTML();
    else view.innerHTML = listHTML();
    view.scrollTop = top;
    updateChrome();
    syncThInd(false);
    animateNums();
    animateCharts();
    openRec = null;
  }

  function syncStatusBar() {
    try {
      if (!window.Native || !Native.statusBarHeight) return;
      var h = Native.statusBarHeight() || 0;
      document.documentElement.style.setProperty('--sat', h.toFixed(1) + 'px');
    } catch (e) {}
  }

  function updateChrome() {
    syncStatusBar();
    var ind = $('#navInd');
    Array.prototype.forEach.call(document.querySelectorAll('#nav button'), function (b) {
      if (!b.hasAttribute('data-tab')) return;
      var on = b.getAttribute('data-tab') === tab;
      b.classList.toggle('on', on);
      if (on && ind) {
        ind.style.width = b.offsetWidth + 'px';
        ind.style.transform = 'translateX(' + b.offsetLeft + 'px)';
      }
    });
    var fab = $('#fab');
    if (fab) fab.classList.toggle('on', tab === 'list' && !meOpen);
  }

  /* ---------- 数据筛选 ---------- */
  function monthRecords(y, m) {
    var p = y + '-' + pad(m);
    return DB.records.filter(function (r) { return r.date.slice(0, 7) === p; });
  }
  function sortRecs(a, b) {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return (b.createdAt || 0) - (a.createdAt || 0);
  }
  function groupDays(recs) {
    var map = {}, out = [];
    recs.forEach(function (r) {
      if (!map[r.date]) { map[r.date] = []; out.push(r.date); }
      map[r.date].push(r);
    });
    out.sort().reverse();
    return out.map(function (d) { return { date: d, list: map[d] }; });
  }

  function metricTotal(d, metric) {
    var recs = monthRecords(d.getFullYear(), d.getMonth() + 1);
    if (metric === 'income') return sum(recs, 'income');
    if (metric === 'balance') return Math.round((sum(recs, 'income') - sum(recs, 'expense')) * 100) / 100;
    return sum(recs, 'expense');
  }

  function deltaChip(cur, prev, goodUp) {
    if (!prev) return '';
    var d = (cur - prev) / Math.abs(prev) * 100;
    if (!isFinite(d)) return '';
    var up = d >= 0;
    var good = goodUp ? up : !up;
    return '<span class="delta ' + (good ? 'down' : 'up') + '">较上月 ' +
      (up ? '↑' : '↓') + Math.abs(d).toFixed(0) + '%</span>';
  }

  /* ---------- 行 ---------- */
  function txHTML(r) {
    var col = CAT_MAP[r.cat] || '#b8c4d4';
    var inc = r.type === 'income';
    return '<div class="tx-wrap">' +
      '<button class="tx-del" data-act="del" data-id="' + esc(r.id) + '">删除</button>' +
      '<div class="tx" data-act="edit" data-id="' + esc(r.id) + '">' +
      '<span class="tx-ic" style="background:' + rgba(col, .16) + '">' + catIcon(r.cat) + '</span>' +
      '<span class="tx-mid"><b>' + esc(r.cat) + '</b>' +
      '<small>' + hhmm(r.createdAt) + (r.note ? ' · ' + esc(r.note) : '') + '</small></span>' +
      '<span class="tx-amt' + (inc ? ' inc' : '') + '">' + (inc ? '+' : '-') + '¥' + money(r.amount) + '</span>' +
      '</div></div>';
  }

  function recHTML(r) {
    var col = CAT_MAP[r.cat] || '#b8c4d4';
    var inc = r.type === 'income';
    return '<div class="rec-wrap">' +
      '<button class="rec-del" data-act="del" data-id="' + esc(r.id) + '">删除</button>' +
      '<div class="rec" data-act="edit" data-id="' + esc(r.id) + '">' +
        '<span class="r-ic" style="background:' + rgba(col, .16) + '">' + catIcon(r.cat) + '</span>' +
        '<span class="r-mid"><b>' + esc(r.cat) + '</b>' +
        '<small>' + esc(r.note || '无备注') + '</small></span>' +
        '<span class="r-amt' + (inc ? ' inc' : '') + '">' + (inc ? '+' : '-') + '¥' + money(r.amount) + '</span>' +
      '</div></div>';
  }

  function emptyHTML(emoji, title, sub) {
    return '<div class="empty"><div class="em">' + emoji + '</div><p>' + esc(title) +
      (sub ? '<br>' + esc(sub) : '') + '</p></div>';
  }

  /* ---------- 首页 ---------- */
  function homeHTML() {
    var now = new Date();
    var y = now.getFullYear(), m = now.getMonth() + 1;
    var recs = monthRecords(y, m).sort(sortRecs);
    var e = sum(recs, 'expense'), i = sum(recs, 'income');
    var prev = new Date(y, m - 2, 1);
    var pe = metricTotal(prev, 'expense');

    var h = '<div class="topbar"><div class="brand">' +
      '<img class="bic-sun" src="sun.webp" alt="">' +
      '<img class="bic-moon" src="moon.webp" alt="">' +
      '<span class="bt">记账本</span>' +
      '</div></div>' +
      '<div class="home-top">' +
      '<img class="cat-art" src="cat.webp" alt="" draggable="false">' +
      '</div>';

    h += '<div class="hero lx-card" id="lxCard">' +
      '<div class="hero-top"><span class="hero-lab">本月支出</span>' + deltaChip(e, pe, false) + '</div>' +
      '<div class="hero-num"><button data-act="viewAll"><small>¥</small>' + numTag('heroExp', e, '') + '<i class="chev">›</i></button></div>' +
      '<div class="hero-row">' +
        '<div><span>本月收入</span>' + numTag('heroInc', i, '¥') + '</div>' +
        '<div><span>结余</span>' + numTag('heroBal', i - e, '¥') + '</div>' +
      '</div>' +
      '</div>';

    var QORDER = ['居住', '娱乐', '餐饮', '交通', '汽车', '零食', '医疗', '社交', '通讯', '购物', '孩子', '其他'];
    h += '<div class="quick" id="quick">' + QORDER.map(function (name) {
      var col = CAT_MAP[name] || '#b8c4d4';
      return '<button class="q" data-act="quickAdd" data-cat="' + name + '">' +
        '<span class="q-ic" style="background:' + rgba(col, .16) + '">' + catIcon(name) + '</span>' +
        '<span class="q-lb">' + name + '</span></button>';
    }).join('') + '</div>';

    var mRecs = recs.slice(0, 4);
    h += '<div class="card today-card"><div class="card-h"><h3>本月账单</h3>' +
      (recs.length ? '<button data-act="viewAll">查看全部 <i class="chev">›</i></button>' : '') + '</div>';
    if (!mRecs.length) {
      h += '<div class="tx-empty">本月还没有记账<br>点下面的「记一笔」开始吧 ♡</div>';
    } else {
      var lastDay = '';
      h += mRecs.map(function (r) {
        var head = '';
        if (r.date !== lastDay) {
          lastDay = r.date;
          var dd = parseYmd(r.date);
          head = '<div class="home-day"><b>' + (dd.getMonth() + 1) + '月' + dd.getDate() + '日</b>' +
            '<span>' + WEEK[dd.getDay()] + '</span></div>';
        }
        return head + txHTML(r);
      }).join('');
    }
    h += '</div>';

    return h;
  }

  /* ---------- 明细 ---------- */
  function filteredRecs(recs) {
    if (listFilter === 'income') return recs.filter(function (r) { return r.type === 'income'; });
    if (listFilter === 'expense') return recs.filter(function (r) { return r.type === 'expense'; });
    return recs;
  }

  function listHTML() {
    var y = listYM.getFullYear(), m = listYM.getMonth() + 1;
    var all = monthRecords(y, m).sort(sortRecs);
    var recs = all;
    var e = sum(all, 'expense'), i = sum(all, 'income');
    var bal = i - e;

    var h = '<div class="page-head"><div class="ph-left"><h1>明细</h1>' +
      '<span class="ph-sub">' + y + '年' + m + '月</span></div></div>';

    h += '<div class="month-nav">' +
      '<button class="mn-btn" data-act="prevM" aria-label="上个月"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 5.5 8 12l6.5 6.5"/></svg></button>' +
      '<span class="mn-label" data-act="picker">' + y + '年' + m + '月</span>' +
      '<button class="mn-btn" data-act="nextM" aria-label="下个月"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 5.5 16 12l-6.5 6.5"/></svg></button>' +
      '</div>';

    h += '<div class="sum3 lx-card">' +
      '<div class="s3"><span>支出</span>' + numTag('sumExp', e, '¥', 'red') + '</div>' +
      '<div class="s3"><span>收入</span>' + numTag('sumInc', i, '¥', 'green') + '</div>' +
      '<div class="s3"><span>结余</span>' + numTag('sumBal', bal, '¥') + '</div>' +
      '</div>';

    if (!recs.length) {
      h += emptyHTML('🐱', '这个月还没有记录', '点下面的加号记一笔');
      return h;
    }

    h += groupDays(recs).map(function (g) {
      var d = parseYmd(g.date);
      var de = sum(g.list, 'expense'), di = sum(g.list, 'income');
      var ds = de ? '支出 ¥' + money(de) : (di ? '收入 ¥' + money(di) : '');
      return '<div class="day"><div class="day-card dayc">' +
        '<div class="card-h day-h2"><b>' + (d.getMonth() + 1) + '月' + d.getDate() + '日 ' +
        WEEK[d.getDay()] + '</b><span class="day-sum">' + ds + '</span></div>' +
        g.list.map(recHTML).join('') + '</div></div>';
    }).join('');
    return h;
  }

  /* ---------- 统计 ---------- */
  function statRange() {
    var y = statYM.getFullYear(), m = statYM.getMonth(), d = statYM.getDate();
    if (statMode === 'week') {
      var off = (statYM.getDay() + 6) % 7;
      var f = new Date(y, m, d - off), t = new Date(y, m, d - off + 6);
      return { from: ymd(f), to: ymd(t), days: 7,
        label: (f.getMonth() + 1) + '月' + f.getDate() + '日 - ' + (t.getMonth() + 1) + '月' + t.getDate() + '日' };
    }
    if (statMode === 'year') {
      return { from: y + '-01-01', to: y + '-12-31', days: 365, label: y + '年' };
    }
    var f2 = new Date(y, m, 1), t2 = new Date(y, m + 1, 0);
    return { from: ymd(f2), to: ymd(t2), days: t2.getDate(), label: y + '年' + (m + 1) + '月' };
  }

  function shiftStat(dir) {
    if (statMode === 'week') statYM = new Date(statYM.getFullYear(), statYM.getMonth(), statYM.getDate() + 7 * dir);
    else if (statMode === 'year') statYM = new Date(statYM.getFullYear() + dir, statYM.getMonth(), 1);
    else statYM = new Date(statYM.getFullYear(), statYM.getMonth() + dir, 1);
    render();
  }

  function sparkSVG() {
    var vals = [], max = 1;
    for (var i = 5; i >= 0; i--) {
      var d = new Date(statYM.getFullYear(), statYM.getMonth() - i, 1);
      var key = d.getFullYear() + '-' + pad(d.getMonth() + 1);
      var v = 0;
      DB.records.forEach(function (r) { if (r.type === 'expense' && r.date.slice(0, 7) === key) v += r.amount; });
      vals.push(v); if (v > max) max = v;
    }
    var W = 104, H = 58, L = 4, R = 4, T = 8, B = 6;
    var pts = vals.map(function (v, i) {
      return [L + (W - L - R) * i / 5, T + (H - T - B) * (1 - v / max)];
    });
    var line = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
    var area = 'M ' + pts[0][0] + ' ' + (H - B) + ' ' + pts.map(function (p) { return 'L ' + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ') +
      ' L ' + pts[5][0] + ' ' + (H - B) + ' Z';
    var last = pts[5];
    return '<svg class="spark" viewBox="0 0 ' + W + ' ' + H + '">' +
      '<defs><linearGradient id="sparkG" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#6fa8ff" stop-opacity=".35"/><stop offset="1" stop-color="#6fa8ff" stop-opacity="0"/></linearGradient></defs>' +
      '<path class="spark-area" d="' + area + '" fill="url(#sparkG)"/>' +
      '<path class="spark-line" d="' + line + '" fill="none" stroke="#5f9cf5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<circle class="spark-dot" cx="' + last[0].toFixed(1) + '" cy="' + last[1].toFixed(1) + '" r="2.6" fill="#5f9cf5"/>' +
      '</svg>';
  }

  function statParts(metric, recs) {
    if (metric === 'balance') {
      var inc = sum(recs, 'income'), exp = sum(recs, 'expense');
      return [
        { name: '收入', value: inc, color: '#34c98b' },
        { name: '支出', value: exp, color: '#ff8f8f' }
      ].filter(function (p) { return p.value > 0; });
    }
    var type = metric === 'income' ? 'income' : 'expense';
    var by = {};
    recs.forEach(function (r) {
      if (r.type !== type) return;
      by[r.cat] = (by[r.cat] || 0) + r.amount;
    });
    var parts = Object.keys(by).map(function (k) {
      return { name: k, value: Math.round(by[k] * 100) / 100, color: CAT_MAP[k] || '#b8c4d4' };
    }).sort(function (a, b) { return b.value - a.value; });
    if (parts.length > 6) {
      var rest = parts.slice(5), rv = 0;
      rest.forEach(function (p) { rv += p.value; });
      parts = parts.slice(0, 5);
      parts.push({ name: '其他', value: Math.round(rv * 100) / 100, color: '#b8c4d4' });
    }
    return parts;
  }

  function donutHTML(parts, total, label, value) {
    var C = 2 * Math.PI * 40, off = 0, segs = '';
    if (total > 0) {
      parts.forEach(function (p) {
        var len = C * p.value / total;
        segs += '<circle class="donut-seg" data-len="' + Math.max(0, len).toFixed(1) + '" cx="58" cy="58" r="40" fill="none" stroke="' + p.color + '" stroke-width="14" ' +
          'stroke-dasharray="0 ' + C.toFixed(1) + '" ' +
          'stroke-dashoffset="' + (-off).toFixed(1) + '" transform="rotate(-90 58 58)"/>';
        off += len;
      });
    }
    return '<div class="donut-wrap"><svg viewBox="0 0 116 116">' +
      '<circle cx="58" cy="58" r="40" fill="none" stroke="rgba(140,170,215,.16)" stroke-width="14"/>' +
      segs + '</svg><div class="donut-c"><span>' + esc(label) + '</span><b>' + value + '</b></div></div>';
  }

  function trendSVG(metric) {
    var vals = [], labels = [];
    for (var i = 5; i >= 0; i--) {
      var d = new Date(statYM.getFullYear(), statYM.getMonth() - i, 1);
      var key = d.getFullYear() + '-' + pad(d.getMonth() + 1);
      var rs = DB.records.filter(function (r) { return r.date.slice(0, 7) === key; });
      var v = metric === 'balance' ? (sum(rs, 'income') - sum(rs, 'expense'))
        : sum(rs, metric === 'income' ? 'income' : 'expense');
      vals.push(Math.round(v * 100) / 100);
      labels.push((d.getMonth() + 1) + '月');
    }
    var maxV = Math.max.apply(null, vals.concat([0]));
    var minV = Math.min.apply(null, vals.concat([0]));
    var hi = Math.max(1000, Math.ceil(maxV / 1000) * 1000);
    var lo = minV < 0 ? Math.floor(minV / 1000) * 1000 : 0;
    if (hi <= lo) hi = lo + 1000;

    var W = 320, H = 142, L = 34, R = 8, T = 16, B = 22;
    function X(i) { return L + (W - L - R) * i / 5; }
    function Y(v) { return T + (H - T - B) * (1 - (v - lo) / (hi - lo)); }

    var grid = '';
    for (var g = 0; g <= 4; g++) {
      var gv = lo + (hi - lo) * g / 4, gy = Y(gv);
      grid += '<line class="trend-grid" x1="' + L + '" y1="' + gy.toFixed(1) + '" x2="' + (W - R) + '" y2="' + gy.toFixed(1) + '"/>';
      var lab = Math.abs(gv) >= 1000 ? (Math.abs(gv) / 1000).toFixed(Math.abs(gv) % 1000 ? 1 : 0) + 'k' : Math.round(gv) + '';
      grid += '<text class="trend-ylab" x="' + (L - 5) + '" y="' + (gy + 3).toFixed(1) + '" text-anchor="end">' +
        (gv < 0 ? '-' : '') + lab + '</text>';
    }

    var pts = vals.map(function (v, i) { return [X(i), Y(v)]; });
    var line = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
    var area = 'M ' + pts[0][0].toFixed(1) + ' ' + (H - B) + ' ' +
      pts.map(function (p) { return 'L ' + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ') +
      ' L ' + pts[5][0].toFixed(1) + ' ' + (H - B) + ' Z';
    var dots = pts.map(function (p, i) {
      return '<circle class="trend-dot" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (i === 5 ? 3.4 : 2.2) + '"/>';
    }).join('');
    var xlab = labels.map(function (l, i) {
      return '<text class="trend-x" x="' + X(i).toFixed(1) + '" y="' + (H - 5) + '" text-anchor="middle">' + l + '</text>';
    }).join('');

    var last = pts[5];
    var txt = '¥' + money(vals[5]);
    var bw = Math.max(46, Math.min(96, txt.length * 5.4 + 14));
    var bx = Math.min(W - R - bw, Math.max(L, last[0] - bw / 2));
    var by = last[1] - 28;
    if (by < T) by = last[1] + 9;
    var bubble = '<rect class="trend-bubble" x="' + bx.toFixed(1) + '" y="' + by.toFixed(1) + '" width="' + bw.toFixed(1) +
      '" height="18" rx="9"/><text class="trend-btext" x="' + (bx + bw / 2).toFixed(1) + '" y="' + (by + 12).toFixed(1) +
      '" text-anchor="middle">' + txt + '</text>';

    return '<svg viewBox="0 0 ' + W + ' ' + H + '">' +
      '<defs><linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#4a8cf7" stop-opacity=".22"/>' +
      '<stop offset="1" stop-color="#4a8cf7" stop-opacity="0"/></linearGradient></defs>' +
      grid + '<path class="trend-area" d="' + area + '"/><path class="trend-line" d="' + line + '"/>' +
      dots + xlab + bubble + '</svg>';
  }

  function statsHTML() {
    var r = statRange();
    var recs = DB.records.filter(function (x) { return x.date >= r.from && x.date <= r.to; });
    var e = sum(recs, 'expense'), inc = sum(recs, 'income'), bal = inc - e;
    var avg = e / (r.days || 1);
    var parts = statParts('expense', recs);
    var total = e;
    var label = statMode === 'week' ? '本周' : (statMode === 'year' ? '本年' : '本月');

    var h = '<div class="page-head"><div class="ph-left"><h1>统计</h1>' +
      '<span class="ph-sub">周 · 月 · 年 三种视角</span></div></div>';

    var mi = statMode === 'week' ? 0 : (statMode === 'month' ? 1 : 2);
    h += '<div class="seg stat-mode">' +
      '<span class="seg-ind" id="segInd" style="transform:translateX(' + (mi * 100) + '%)"></span>' +
      '<button data-act="statMode" data-m="week" class="' + (statMode === 'week' ? 'on' : '') + '">周</button>' +
      '<button data-act="statMode" data-m="month" class="' + (statMode === 'month' ? 'on' : '') + '">月</button>' +
      '<button data-act="statMode" data-m="year" class="' + (statMode === 'year' ? 'on' : '') + '">年</button>' +
      '</div>';

    h += '<div class="month-nav">' +
      '<button class="mn-btn" data-act="prevS" aria-label="上一个"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 5.5 8 12l6.5 6.5"/></svg></button>' +
      '<span class="mn-label" data-act="picker">' + r.label + '</span>' +
      '<button class="mn-btn" data-act="nextS" aria-label="下一个"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 5.5 16 12l-6.5 6.5"/></svg></button>' +
      '</div>';

    h += '<div class="stat-card lx-card">' +
      '<div class="sc-top"><div><span class="sh-lab">' + label + '支出</span>' +
      '<div class="sh-num">' + numTag('statExp', e, '') + '</div></div>' + sparkSVG() + '</div>' +
      '<div class="sh-row">' +
      '<div><span>收入</span>' + numTag('statInc', inc, '¥', 'green') + '</div>' +
      '<div><span>结余</span>' + numTag('statBal', Math.abs(bal), bal < 0 ? '-¥' : '¥', 'red') + '</div>' +
      '<div><span>日均</span>' + numTag('statAvg', avg, '¥') + '</div>' +
      '</div></div>';

    var legend = parts.length ? parts.map(function (p, i) {
      var pct = total > 0 ? (p.value / total * 100) : 0;
      return '<div class="lg-row" style="animation-delay:' + (i * 40) + 'ms"><i class="lg-dot" style="background:' + p.color + '"></i>' +
        '<span class="lg-name">' + esc(p.name) + '</span>' +
        '<span class="lg-pct">' + pct.toFixed(0) + '%</span>' +
        '<span class="lg-val">' + numTag('lg-' + p.name, p.value, '¥') + '</span></div>';
    }).join('') : '<div class="lg-row" style="color:var(--dim2)">这段时间没有记录</div>';

    h += '<div class="card lx-card stat-donut"><div class="card-h"><h3>支出构成</h3></div>' +
      '<div class="donut-row">' +
      donutHTML(parts, total, '支出', '¥' + money(total)) +
      '<div class="legend">' + legend + '</div></div></div>';

    if (!recs.length) {
      h += emptyHTML('🐱', '这一段时间还没有记录', '换个周期看看');
    }
    return h;
  }

  /* ---------- 我的 ---------- */
  function lastSyncText() {
    if (!DB.lastSync) return '还没有同步过';
    var d = new Date(DB.lastSync);
    return '上次同步 ' + (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + hhmm(DB.lastSync);
  }

  function ico(name) {
    var p = {
      out: '<path d="M12 16.4V4.6"/><path d="m7.6 9 4.4-4.4 4.4 4.4"/><path d="M4.4 16.4v2.2a1.8 1.8 0 0 0 1.8 1.8h11.6a1.8 1.8 0 0 0 1.8-1.8v-2.2"/>',
      csv: '<path d="M6 3.8h9l3 3v13.4H6z"/><path d="M15 3.8v3.2h3"/><path d="M9 12h6M9 15.4h6M9 18.4h3"/>',
      imp: '<path d="M12 3.6v11.2"/><path d="m7.6 10.6 4.4 4.4 4.4-4.4"/><path d="M4.4 16.4v2.2a1.8 1.8 0 0 0 1.8 1.8h11.6a1.8 1.8 0 0 0 1.8-1.8v-2.2"/>',
      ver: '<circle cx="12" cy="12" r="8.4"/><path d="M12 8.4v4l2.6 2"/>',
      plus: '<path d="M12 5.6v12.8M5.6 12h12.8"/>',
      cloud: '<path d="M7.4 17.6h9.3a3.5 3.5 0 0 0 .6-6.9 4.9 4.9 0 0 0-9.5-1.1 3.6 3.6 0 0 0-.4 8z"/>',
      pal: '<circle cx="8.9" cy="7.7" r="3.5" fill="#3f7ef0" stroke="none"/><circle cx="16.3" cy="9.2" r="2.7" fill="#ff9f1c" stroke="none"/><circle cx="16.5" cy="15.8" r="2.7" fill="#22b8a0" stroke="none"/><circle cx="8.6" cy="15.5" r="2.7" fill="#a855f7" stroke="none"/>',
      info: '<circle cx="12" cy="12" r="8.6"/><path d="M12 11v5.2"/><path d="M12 7.8v.3"/>',
      db: '<ellipse cx="12" cy="6.4" rx="7" ry="2.8"/><path d="M5 6.4v11.2c0 1.6 3.1 2.8 7 2.8s7-1.2 7-2.8V6.4"/><path d="M5 12c0 1.6 3.1 2.8 7 2.8s7-1.2 7-2.8"/>',
      trash: '<path d="M4.8 6.6h14.4"/><path d="M9 6.6V5.2a1.4 1.4 0 0 1 1.4-1.4h3.2A1.4 1.4 0 0 1 15 5.2v1.4"/><path d="M6.6 6.6l.9 12a1.6 1.6 0 0 0 1.6 1.5h5.8a1.6 1.6 0 0 0 1.6-1.5l.9-12"/>'
    };
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + (p[name] || p.ver) + '</svg>';
  }

  function openSheet(inner) {
    var host = document.getElementById('sheetHost');
    if (!host) return;
    host.classList.remove('show');
    host.classList.remove('out');
    host.innerHTML = inner;
    void host.offsetHeight;            // 先落地初始位置，再触发上滑
    host.classList.add('show');
    haptic();
  }

  function closeSheet() {
    var host = document.getElementById('sheetHost');
    if (!host || !host.classList.contains('show')) return;
    host.classList.add('out');
    host.classList.remove('show');
    setTimeout(function () {
      if (host && !host.classList.contains('show')) {
        host.classList.remove('out');
        host.innerHTML = '';
      }
    }, 1200);
  }

  function openAbout() {
    openSheet('<div class="sheet-mask" data-act="closeSheet">' +
      '<div class="sheet-card about-card" data-act="noop">' +
      '<button class="ab-danger" data-act="clearAll">清除数据</button>' +
      '<img class="ab-ic" src="appicon.png" alt="">' +
      '<div class="ab-name">广铁一号</div>' +
      '<div class="ab-ver">版本 ' + VERSION + '</div>' +
      '<div class="ab-note">记录只存在这台手机，只有你主动发起的备份才会联网。</div>' +
      '<button class="btn primary ab-btn" data-act="closeSheet">知道了</button>' +
      '</div></div>');
  }

  function closeAbout() { closeSheet(); }

  function openSyncSheet() {
    openSheet('<div class="sheet-mask" data-act="closeSheet">' +
      '<div class="sheet-card sync-sheet" data-act="noop">' +
      '<div class="sync-top"><button class="sync-restore" data-act="syncPull">从云端恢复</button></div>' +
      '<div class="bs-h"><b>云数据同步</b><span>坚果云 · 自动上传，云端更新不会被覆盖</span></div>' +
      '<div class="sync-head"><span class="sync-dot"></span><span class="sync-state" id="syncStatus">' + esc(lastSyncText()) + '</span>' +
      '<button class="sync-mini" data-act="syncTest">测试连接</button></div>' +
      '<label class="ff"><input id="syncServer" value="' + esc(DB.sync.server) + '" placeholder=" " autocomplete="off"><span>服务器</span></label>' +
      '<label class="ff"><input id="syncUser" value="' + esc(DB.sync.user) + '" placeholder=" " autocomplete="off"><span>账号（邮箱）</span></label>' +
      '<label class="ff"><input id="syncPass" type="password" value="' + esc(DB.sync.pass) + '" placeholder=" " autocomplete="off"><span>应用密码</span></label>' +
      '<label class="ff"><input id="syncFile" value="' + esc(DB.sync.file) + '" placeholder=" " autocomplete="off"><span>文件名</span></label>' +
      '<div class="sync-actions"><button class="btn primary" data-act="syncPush">上传备份</button>' +
      '<button class="btn green" data-act="syncSave">保存设置</button></div>' +
      '<div class="sync-hint">配置好账号后，每次记录保存 30 秒会自动上传。</div>' +
      '</div></div>');
  }

  function openBgSheet() {
    var items = BG_ORDER.map(function (k) {
      var pre = BG_PRESETS[k];
      var cs = pre.rainbow ? 'conic-gradient(from 20deg,#ffd1dc,#ffe9c7,#d6f5e3,#cfe4ff,#e6d6ff,#ffd1dc)' : pre.bg;
      return '<button class="bg-item' + (DB.bg === k ? ' on' : '') + '" data-act="setBg" data-bg="' + k + '">' +
        '<span class="bgsw" style="background:' + cs + '"></span><span class="bgsw-n">' + pre.label + '</span></button>';
    }).join('');
    openSheet('<div class="sheet-mask" data-act="closeSheet">' +
      '<div class="sheet-card bg-sheet" data-act="noop">' +
      '<div class="bs-h"><b>多彩背景</b><span>浅色模式的页面底色</span></div>' +
      '<div class="bg-row bs-row">' + items + '</div>' +
      '<button class="btn primary ab-btn" data-act="closeSheet">完成</button>' +
      '</div></div>');
  }

  function meHTML() {
    var t = DB.theme;
    function th(v, label, cls) {
      return '<button class="th' + (t === v ? ' on' : '') + '" data-act="theme" data-v="' + v + '" aria-label="' + label + '">' +
        '<span class="sw ' + cls + '"></span></button>';
    }
    var curBg = BG_PRESETS[DB.bg] || BG_PRESETS.blue;
    var curCs = curBg.rainbow ? 'conic-gradient(from 20deg,#ffd1dc,#ffe9c7,#d6f5e3,#cfe4ff,#e6d6ff,#ffd1dc)' : curBg.bg;
    var h = '<div class="page-head"><h1>设置</h1></div>' +
      '<div class="m-label">外观</div><div class="m-card">' +
      '<div class="themes"><span class="th-ind"></span>' + th('system', '跟随系统', 'auto') + th('light', '浅色', 'light') + th('dark', '深色', 'dark') + '</div>' +
      '<button class="mrow" data-act="plusTint"><span class="m-ic plus">' + ico('plus') + '</span>' +
      '<span class="m-txt"><b>加号色彩跟随</b><small>中间按钮的配色跟着主题走</small></span>' +
      '<span class="sw2' + (DB.plusTint ? ' on' : '') + '"><i></i></span></button>' +
      '<button class="mrow" data-act="openBgSheet"><span class="m-ic pal">' + ico('pal') + '</span>' +
      '<span class="m-txt"><b>多彩背景</b><small>' + curBg.label + '</small></span>' +
      '<span class="bgsw" style="background:' + curCs + '"></span><span class="m-go">›</span></button>' +
      '</div>';

    h += '<div class="m-label">数据</div><div class="m-card">' +
      (window.__PWA ? '' :
        '<button class="mrow" data-act="openSyncSheet"><span class="m-ic cloud">' + ico('cloud') + '</span>' +
        '<span class="m-txt"><b>云数据同步</b><small>' + esc(lastSyncText()) + '</small></span>' +
        '<span class="m-go">›</span></button>') +
      '<button class="mrow" data-act="exportJson"><span class="m-ic green">' + ico('out') + '</span>' +
      '<span class="m-txt"><b>导出备份</b></span><span class="m-go">›</span></button>' +
      '<button class="mrow" data-act="exportCsv"><span class="m-ic">' + ico('csv') + '</span>' +
      '<span class="m-txt"><b>导出表格</b></span><span class="m-go">›</span></button>' +
      '<button class="mrow" data-act="importData"><span class="m-ic purple">' + ico('imp') + '</span>' +
      '<span class="m-txt"><b>导入数据</b></span><span class="m-go">›</span></button>' +
      '</div>';

    h += '<div class="m-label">关于</div><div class="m-card">' +
      '<button class="mrow" data-act="aboutApp"><span class="m-ic orange">' + ico('info') + '</span>' +
      '<span class="m-txt"><b>关于本APP</b><small>广铁一号 ' + VERSION + '</small></span><span class="m-go">›</span></button>' +
      '</div>';
    return h;
  }

  function syncThInd(animate) {
    var wraps = document.querySelectorAll('.themes');
    for (var i = 0; i < wraps.length; i++) {
      var w = wraps[i];
      var on = w.querySelector('.th.on');
      var ind = w.querySelector('.th-ind');
      if (!on || !ind) continue;
      if (!animate) ind.style.transition = 'none';
      var ww = Math.round(on.offsetWidth * 0.5);
      ind.style.width = ww + 'px';
      ind.style.transform = 'translate3d(' + Math.round(on.offsetLeft + (on.offsetWidth - ww) / 2) + 'px,0,0)';
      if (!animate) { void ind.offsetWidth; ind.style.transition = ''; }
    }
  }

  function openMe() {
    meOpen = true;
    $('#meBody').innerHTML = meHTML();
    var p = $('#pageMe');
    p.classList.add('on');
    updateChrome();
    syncThInd(false);
    $('#meBody').scrollTop = 0;
  }
  function closeMe() {
    meOpen = false;
    $('#pageMe').classList.remove('on');
    updateChrome();
  }

  /* ---------- 记一笔 ---------- */
  /* ---------- 上滑/下拉到顶到底的整体回弹 ---------- */
  var bounceTop = $('#bounceTop');
  function attachBounce(el) {
    if (!el) return;
    var sy = 0, sx = 0, active = false, y = 0, maxTop = 0;
    function reset() {
      if (!y) return;
      el.style.transition = 'transform .5s cubic-bezier(.18,1.25,.32,1)';
      el.style.transform = 'translate3d(0,0,0)';
      y = 0;
      setTimeout(function () {
        el.style.transition = '';
        el.style.transform = '';
        el.style.willChange = '';
      }, 520);
      if (el === view && bounceTop) {
        bounceTop.style.transition = 'height .5s cubic-bezier(.18,1.25,.32,1)';
        bounceTop.style.height = '0px';
      }
    }
    el.addEventListener('touchstart', function (e) {
      if (!e.touches || !e.touches.length) return;
      active = true; y = 0;
      sy = e.touches[0].clientY; sx = e.touches[0].clientX;
      maxTop = el.scrollHeight - el.clientHeight;
    }, { passive: true });
    el.addEventListener('touchmove', function (e) {
      if (!active || !e.touches || !e.touches.length) return;
      var dy = e.touches[0].clientY - sy;
      var dx = e.touches[0].clientX - sx;
      if (Math.abs(dx) > Math.abs(dy)) return;
      if (el === view && tab === 'stats') return;
      var st = el.scrollTop;
      var top = st <= 0;
      var bot = st >= maxTop - 1;
      if (!((top && dy > 0) || (bot && dy < 0))) { if (y) reset(); return; }
      if (Math.abs(dy) < 6) return;
      if (e.cancelable) e.preventDefault();
      y = Math.max(-96, Math.min(96, dy * 0.42));
      if (!y) return;
      el.style.willChange = 'transform';
      el.style.transition = 'none';
      el.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0)';
      if (top && el === view && bounceTop && tab === 'home') {
        bounceTop.style.transition = 'none';
        bounceTop.style.height = Math.max(0, y).toFixed(1) + 'px';
      }
    }, { passive: false });
    el.addEventListener('touchend', reset, { passive: true });
    el.addEventListener('touchcancel', reset, { passive: true });
  }
  attachBounce(view);

  var addPage = $('#pageAdd');
  attachBounce($('.add-body'));
  var amtTxt = $('#amtTxt');
  var catGrid = $('#catGrid');
  var noteInput = $('#noteInput');
  var typeSwitch = $('#typeSwitch');
  var add = { id: null, type: 'expense', cat: '餐饮', amount: '', note: '', date: today() };

  function openAdd(rec, presetCat) {
    if (rec) {
      add = { id: rec.id, type: rec.type, cat: rec.cat, amount: String(rec.amount), note: rec.note || '', date: rec.date };
      $('#addTitle').textContent = '编辑';
    } else {
      add = { id: null, type: 'expense', cat: presetCat || '餐饮', amount: '', note: '', date: today() };
      $('#addTitle').textContent = '记一笔';
    }
    renderAdd();
    addPage.classList.add('on');
    addPage.classList.remove('kbd');
    syncStatusBar();
  }

  function closeAdd() {
    addPage.classList.remove('on');
    addPage.classList.remove('kbd');
    syncStatusBar();
    try { noteInput.blur(); } catch (e) {}
    add.id = null;
  }

  function renderNoteChips() {
    var box = $('#noteChips');
    if (!box) return;
    var seen = {}, notes = [];
    DB.records.slice().sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); }).forEach(function (r) {
      if (r.cat !== add.cat || r.type !== add.type) return;
      var n = String(r.note || '').trim();
      if (n && !seen[n] && notes.length < 6 && (DB.noteHidden || []).indexOf(n) < 0) { seen[n] = 1; notes.push(n); }
    });
    box.innerHTML = notes.map(function (n) {
      return '<button class="nchip' + (add.note === n ? ' on' : '') + '" data-act="pickNote" data-n="' + esc(n) + '">' + esc(n) + '</button>';
    }).join('');
    box.style.display = notes.length ? '' : 'none';
  }

  function renderAdd() {
    typeSwitch.classList.toggle('income', add.type === 'income');
    Array.prototype.forEach.call(typeSwitch.querySelectorAll('button'), function (b) {
      b.classList.toggle('on', b.getAttribute('data-t') === add.type);
    });
    amtTxt.textContent = formatTyping(add.amount) || '0';
    catGrid.innerHTML = CATS[add.type].map(function (c) {
      var name = c[0], col = c[1];
      return '<button class="cat' + (add.cat === name ? ' on' : '') + '" data-act="setCat" data-cat="' + esc(name) + '">' +
        '<span class="cat-ic" style="background:' + rgba(col, .16) + '">' + catIcon(name) + '</span>' +
        '<span class="cat-lb">' + esc(name) + '</span></button>';
    }).join('');
    if (addSlide) {
      catGrid.style.setProperty('--cd', (addSlide > 0 ? 18 : -18) + 'px');
      catGrid.classList.remove('slide');
      void catGrid.offsetWidth;
      catGrid.classList.add('slide');
    } else {
      catGrid.classList.remove('slide');
    }
    noteInput.value = add.note;
    var dtx = $('#dateTxt');
    if (dtx && add.date) dtx.textContent = add.date.replace(/-/g, '/');
    renderNoteChips();
  }

  function formatTyping(s) {
    if (!s) return '';
    var p = String(s).split('.');
    p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return p.length > 1 ? p[0] + '.' + p[1] : p[0];
  }

  function pressKey(k) {
    var s = add.amount;
    if (k === 'del') add.amount = s.slice(0, -1);
    else if (k === '.') {
      if (s.indexOf('.') < 0) add.amount = (s === '' ? '0' : s) + '.';
    } else {
      if (s.indexOf('.') >= 0) {
        var dec = s.split('.')[1] || '';
        if (dec.length >= 2) return;
      } else if (s.replace('.', '').length >= 9) {
        return;
      }
      if (s === '0') s = '';
      add.amount = s + k;
    }
    amtTxt.textContent = formatTyping(add.amount) || '0';
    haptic();
  }

  var addSlide = 0;
  function setAddType(t) {
    if (t !== 'income' && t !== 'expense') return;
    if (add.type === t) return;
    addSlide = t === 'income' ? 1 : -1;
    add.type = t;
    add.cat = CATS[t][0][0];
    renderAdd();
    addSlide = 0;
    haptic();
  }

  function saveAdd() {
    var amt = parseFloat(add.amount);
    if (!isFinite(amt) || amt <= 0) { toast('先填金额'); return; }
    var amount = Math.round(amt * 100) / 100;
    var note = String(noteInput.value || '').trim().slice(0, 40);
    var date = add.date || today();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) date = today();
    var editing = !!add.id;
    if (editing) {
      var i = DB.records.findIndex(function (r) { return r.id === add.id; });
      if (i >= 0) {
        DB.records[i].type = add.type;
        DB.records[i].cat = add.cat;
        DB.records[i].amount = amount;
        DB.records[i].note = note;
        DB.records[i].date = date;
      }
    } else {
      DB.records.push({
        id: uid(), type: add.type, cat: add.cat, amount: amount,
        note: note, date: date, createdAt: Date.now()
      });
    }
    save();
    closeAdd();
    render();
    toast(editing ? '已经改好' : '记好了');
    haptic();
  }

  /* ---------- 导入 / 导出 ---------- */
  function payload() {
    return {
      v: 3, app: 'ledger2', version: VERSION, theme: DB.theme,
      records: DB.records, notes: DB.notes, updatedAt: Date.now(), rev: DB.rev || Date.now()
    };
  }

  function webDownload(name, mime, text) {
    try {
      var blob = new Blob([text], { type: mime + ';charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = name; a.style.display = 'none';
      document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1500);
      toast('已导出 ' + name);
    } catch (e) { toast('导出失败'); }
  }

  function webImport() {
    var inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.json,.csv,text/plain,application/json,text/csv';
    inp.onchange = function () {
      var f = inp.files && inp.files[0];
      if (!f) return;
      var fr = new FileReader();
      fr.onload = function () { importText(String(fr.result || '')); };
      fr.readAsText(f);
    };
    inp.click();
  }

  function exportJson() {
    var name = '广铁一号-备份-' + today().replace(/-/g, '') + '.json';
    var text = JSON.stringify(payload());
    if (window.Native && Native.exportFile) Native.exportFile(name, 'application/json', text);
    else webDownload(name, 'application/json', text);
  }

  function exportCsv() {
    var name = '广铁一号-明细-' + today().replace(/-/g, '') + '.csv';
    var rows = [['日期', '类型', '分类', '金额', '备注']];
    DB.records.slice().sort(sortRecs).forEach(function (r) {
      rows.push([r.date, r.type === 'income' ? '收入' : '支出', r.cat, r.amount.toFixed(2), r.note || '']);
    });
    var csv = '\uFEFF' + rows.map(function (row) {
      return row.map(function (v) {
        v = String(v);
        return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
      }).join(',');
    }).join('\r\n');
    if (window.Native && Native.exportFile) Native.exportFile(name, 'text/csv', csv);
    else webDownload(name, 'text/csv', csv);
  }

  function importData() {
    if (window.Native && Native.importFile) Native.importFile();
    else webImport();
  }

  function parseAny(text) {
    text = String(text || '').replace(/^\uFEFF/, '').trim();
    if (!text) return [];
    if (text.charAt(0) === '{' || text.charAt(0) === '[') {
      try {
        var d = JSON.parse(text);
        var arr = Array.isArray(d) ? d : (d && Array.isArray(d.records) ? d.records : []);
        var out = [];
        arr.forEach(function (o) { var r = normRec(o); if (r) out.push(r); });
        return out;
      } catch (e) {}
    }
    return parseCsv(text);
  }

  function splitCsv(line) {
    var out = [], cur = '', q = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line.charAt(i);
      if (q) {
        if (ch === '"') {
          if (line.charAt(i + 1) === '"') { cur += '"'; i++; }
          else q = false;
        } else cur += ch;
      } else if (ch === '"') q = true;
      else if (ch === ',') { out.push(cur); cur = ''; }
      else cur += ch;
    }
    out.push(cur);
    return out;
  }

  function parseCsv(text) {
    var lines = String(text).split(/\r?\n/).filter(function (l) { return l.trim() !== ''; });
    if (lines.length < 2) return [];
    var head = splitCsv(lines[0]).map(function (s) { return s.trim(); });
    var hasHead = head.indexOf('日期') >= 0 || head.indexOf('date') >= 0 || head.indexOf('金额') >= 0;
    function at(name, def) { var i = head.indexOf(name); return i >= 0 ? i : def; }
    var ix = { date: at('日期', 0), type: at('类型', 1), cat: at('分类', 2), amount: at('金额', 3), note: at('备注', 4) };
    var out = [];
    for (var i = hasHead ? 1 : 0; i < lines.length; i++) {
      var c = splitCsv(lines[i]);
      var r = normRec({ date: c[ix.date], type: c[ix.type], cat: c[ix.cat], amount: c[ix.amount], note: c[ix.note] });
      if (r) out.push(r);
    }
    return out;
  }

  function mergeRecords(recs) {
    var have = {};
    DB.records.forEach(function (r) { have[r.id] = 1; });
    var n = 0;
    recs.forEach(function (r) {
      if (!r || have[r.id]) return;
      have[r.id] = 1;
      DB.records.push(r);
      n++;
    });
    if (n) { save(); render(); }
    return n;
  }

  function importText(text) {
    var recs = parseAny(text);
    if (!recs.length) { toast('没读到能用的记录'); return; }
    confirmDlg('导入 ' + recs.length + ' 条记录？', '会和现在本机的记录合并，重复的会自动跳过。', '导入', function () {
      var n = mergeRecords(recs);
      toast(n ? '已导入 ' + n + ' 条' : '这些都是已有记录');
    });
  }

  /* ---------- 云备份 ---------- */
  function syncFields() {
    var v = function (id, def) {
      var el = $('#' + id);
      return el ? el.value.trim() : def;
    };
    return {
      server: v('syncServer', DB.sync.server),
      user: v('syncUser', DB.sync.user),
      pass: (function () { var el = $('#syncPass'); return el ? el.value : DB.sync.pass; })(),
      file: v('syncFile', DB.sync.file) || '记账本.json'
    };
  }

  function setSyncStatus(txt, cls) {
    var el = $('#syncStatus');
    if (!el) return;
    el.textContent = txt;
    el.className = 'sync-state' + (cls ? ' ' + cls : '');
  }

  function netCall(method, body, cb) {
    var f = syncFields();
    if (!f.server) { cb(false, '先填服务器地址'); return; }
    var id = 'n' + (++netSeq);
    netCbs[id] = cb;
    if (window.Native && Native.webdav) {
      try { Native.webdav(id, method, f.server, f.user, f.pass, f.file, body || ''); }
      catch (e) { delete netCbs[id]; cb(false, '当前环境不支持'); }
    } else {
      delete netCbs[id];
      cb(false, '当前环境不支持');
    }
  }

  /* ---------- 自动同步：改动 30 秒后上传 ---------- */
  var autoTimer = null, autoRunning = false;

  function syncConf() {
    var s = DB.sync || {};
    return (s.server && s.user && s.pass && s.file) ? s : null;
  }

  function scheduleAutoSync() {
    if (!syncConf()) return;
    clearTimeout(autoTimer);
    autoTimer = setTimeout(autoSyncNow, 30000);
  }

  function remoteRev(text) {
    try { var o = JSON.parse(text); return Number(o && o.rev) || 0; } catch (e) { return 0; }
  }

  function autoSyncNow() {
    if (autoRunning || !syncConf()) return;
    if (!DB.records.length && !DB.cleared) return;
    autoRunning = true;
    netCall('get', '', function (ok, data) {
      var rr = ok ? remoteRev(data) : 0;
      var rc = ok ? parseAny(data).length : 0;
      if (ok && rc > 0 && rr > (DB.remoteRev || 0) && rr !== DB.rev) {
        autoRunning = false;
        setSyncStatus('云端有更新的数据，已暂停自动上传', 'err');
        return;
      }
      netCall('put', JSON.stringify(payload()), function (ok2, msg) {
        autoRunning = false;
        if (ok2) {
          DB.lastSync = Date.now();
          DB.remoteRev = DB.rev;
          DB.cleared = false;
          persist();
          setSyncStatus(lastSyncText(), 'ok');
        } else {
          setSyncStatus('自动同步失败：' + msg, 'err');
        }
      });
    });
  }

  function maybeAutoPull() {
    if (!syncConf() || DB.records.length || DB.cleared) return;
    netCall('get', '', function (ok, data) {
      if (!ok) return;
      var recs = parseAny(data);
      if (!recs.length) return;
      DB.records = recs;
      DB.remoteRev = remoteRev(data);
      DB.lastSync = Date.now();
      persist(); render();
      toast('已从云端恢复 ' + recs.length + ' 条');
    });
  }

  window.__netCb = function (id, ok, data) {
    var cb = netCbs[id];
    delete netCbs[id];
    if (cb) cb(!!ok, data || '');
  };

  function ensureSyncSaved() {
    DB.sync = syncFields();
    DB.sync.enabled = true;
    save();
  }

  function syncTest() {
    ensureSyncSaved();
    setSyncStatus('连接中…');
    netCall('test', '', function (ok, msg) {
      setSyncStatus(msg, ok ? 'ok' : 'err');
      toast(ok ? '连接正常' : msg);
    });
  }

  function syncPush() {
    confirmDlg('上传备份？', '会用本机数据覆盖云端备份，云端旧版本会被替换。', '上传', function () { syncPushNow(); });
  }

  function syncPushNow() {
    ensureSyncSaved();
    setSyncStatus('上传中…');
    netCall('put', JSON.stringify(payload()), function (ok, msg) {
      if (ok) {
        DB.lastSync = Date.now(); DB.remoteRev = DB.rev; DB.cleared = false; persist();
        setSyncStatus('上传成功，' + lastSyncText(), 'ok');
        toast('已备份到云端');
      } else {
        setSyncStatus(msg, 'err'); toast(msg);
      }
    });
  }

  function syncPull() {
    ensureSyncSaved();
    confirmDlg('从云端恢复？', '会用云端备份替换本机所有记录，覆盖后不能撤销。', '恢复', function () {
      setSyncStatus('下载中…');
      netCall('get', '', function (ok, data) {
        if (!ok) { setSyncStatus(data, 'err'); toast(data); return; }
        var recs = parseAny(data);
        if (!recs.length) { setSyncStatus('备份里没有记录', 'err'); toast('备份里没有记录'); return; }
        DB.records = recs;
        DB.lastSync = Date.now();
        DB.remoteRev = remoteRev(data);
        DB.cleared = false;
        persist(); render();
        setSyncStatus('已恢复 ' + recs.length + ' 条，' + lastSyncText(), 'ok');
        toast('已恢复 ' + recs.length + ' 条');
      });
    });
  }

  window.__exportDone = function (ok, msg) { toast(msg || (ok ? '已导出' : '导出失败')); };
  window.__importDone = function (ok, text) {
    if (!ok) { toast(text || '导入失败'); return; }
    importText(text);
  };

  /* ---------- 删除 ---------- */
  function delRec(id) {
    var i = DB.records.findIndex(function (r) { return r.id === id; });
    if (i < 0) return;
    var r = DB.records.splice(i, 1)[0];
    save(); render();
    toast('已删除', '撤销', function () {
      DB.records.push(r); save(); render();
    });
  }

  /* ---------- 对话框 / 吐司 ---------- */
  var dlgCb = null;
  function confirmDlg(title, sub, okLabel, cb, danger) {
    $('#dlgT').textContent = title;
    $('#dlgS').textContent = sub || '';
    var yes = $('#dlgYes');
    yes.textContent = okLabel || '确定';
    yes.classList.toggle('danger', !!danger);
    dlgCb = cb || null;
    $('#dlgMask').classList.add('on');
    $('#dlg').classList.add('on');
  }
  function closeDlg() {
    $('#dlgMask').classList.remove('on');
    $('#dlg').classList.remove('on');
    dlgCb = null;
  }

  var toastTimer = 0, toastFn = null;
  function toast(msg, actionLabel, fn) {
    var box = $('#toast'), txt = $('#toastTxt'), btn = $('#toastAct');
    txt.textContent = msg;
    if (actionLabel) {
      btn.hidden = false;
      btn.textContent = actionLabel;
      toastFn = fn || null;
    } else {
      btn.hidden = true;
      toastFn = null;
    }
    box.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { box.classList.remove('on'); }, actionLabel ? 4200 : 2200);
  }

  /* ---------- 事件 ---------- */
  document.addEventListener('click', function (e) {
    var tb = e.target.closest('[data-tab]');
    if (tb) { go(tb.getAttribute('data-tab')); return; }
    if (suppressClick) { suppressClick = false; return; }

    var kb = e.target.closest('[data-k]');
    if (kb) { pressKey(kb.getAttribute('data-k')); return; }

    var t = e.target.closest('[data-act]');
    if (!t) return;
    var act = t.getAttribute('data-act');

    switch (act) {
      case 'openMe': openMe(); break;
      case 'closeMe': closeMe(); break;
      case 'openAdd': openAdd(null); break;
      case 'quickAdd': openAdd(null, t.getAttribute('data-cat')); break;
      case 'closeAdd': closeAdd(); break;
      case 'saveAdd': saveAdd(); break;
      case 'setType': setAddType(t.getAttribute('data-t')); break;
      case 'aboutApp': openAbout(); break;
      case 'closeAbout': closeAbout(); break;
      case 'openBgSheet': openBgSheet(); break;
      case 'openSyncSheet': openSyncSheet(); break;
      case 'closeSheet': closeSheet(); break;
      case 'noop': break;
      case 'plusTint':
        DB.plusTint = !DB.plusTint;
        save(); applyTheme(); render(); haptic();
        break;
      case 'setBg':
        var nb = t.getAttribute('data-bg');
        if (nb === DB.bg) break;
        DB.bg = nb;
        save(); render(); bgRipple(); haptic();
        closeSheet();
        break;
      case 'pickAddDate':
        pkOpen('选择日期', addDateObj(add.date), function (d) {
          add.date = fmtDate(d);
          var dtx = $('#dateTxt');
          if (dtx) dtx.textContent = add.date.replace(/-/g, '/');
        });
        break;
      case 'pickNote':
        var nn = t.getAttribute('data-n');
        add.note = nn;
        noteInput.value = nn;
        Array.prototype.forEach.call($('#noteChips').children, function (b) {
          b.classList.toggle('on', b.getAttribute('data-n') === nn);
        });
        noteInput.blur();
        if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
        haptic();
        break;
      case 'setCat':
        add.cat = t.getAttribute('data-cat');
        Array.prototype.forEach.call(catGrid.querySelectorAll('.cat'), function (b) {
          b.classList.toggle('on', b.getAttribute('data-cat') === add.cat);
        });
        renderNoteChips();
        haptic();
        break;
      case 'edit':
        if (openRec === t) { swClose(); break; }
        (function () {
          var r = DB.records.find(function (x) { return x.id === t.getAttribute('data-id'); });
          if (r) openAdd(r);
        })();
        break;
      case 'del': delRec(t.getAttribute('data-id')); break;
      case 'viewAll': go('list'); break;
      case 'prevM': listYM = new Date(listYM.getFullYear(), listYM.getMonth() - 1, 1); render(); contentSlide(-1); break;
      case 'nextM': listYM = new Date(listYM.getFullYear(), listYM.getMonth() + 1, 1); render(); contentSlide(1); break;
      case 'todayJump': listYM = new Date(); render(); break;
      case 'prevS': shiftStat(-1); break;
      case 'nextS': shiftStat(1); break;
      case 'statMode':
        var prev = statMode === 'week' ? 0 : (statMode === 'month' ? 1 : 2);
        statMode = t.getAttribute('data-m');
        render();
        (function (from) {
          var ind = $('#segInd');
          if (!ind) return;
          ind.style.transition = 'none';
          ind.style.transform = 'translateX(' + (from * 100) + '%)';
          raf(function () {
            ind.style.transition = '';
            ind.style.transform = 'translateX(' + (statMode === 'week' ? 0 : statMode === 'month' ? 100 : 200) + '%)';
          });
        })(prev);
        break;
      case 'picker': if (tab === 'list') openListPicker(); else openStatPicker(); break;
      case 'pkOk':
        if (pkCb) pkCb(pkDate);
        pkClose();
        break;
      case 'pkClose': pkClose(); break;
      case 'filter': listFilter = t.getAttribute('data-f'); render(); break;
      case 'theme':
        DB.theme = t.getAttribute('data-v');
        save();
        document.documentElement.classList.add('theme-anim');
        applyTheme();
        setTimeout(function () { document.documentElement.classList.remove('theme-anim'); }, 520);
        var wrap = t.parentNode;
        if (wrap) {
          var cells = wrap.querySelectorAll('.th');
          for (var ci = 0; ci < cells.length; ci++) cells[ci].classList.toggle('on', cells[ci] === t);
          syncThInd(true);
        }
        break;
      case 'exportJson': exportJson(); break;
      case 'exportCsv': exportCsv(); break;
      case 'importData': importData(); break;
      case 'syncSave': ensureSyncSaved(); toast('设置已保存'); closeSheet(); break;
      case 'syncTest': syncTest(); break;
      case 'syncPush': syncPush(); break;
      case 'syncPull': syncPull(); break;
      case 'clearAll':
        confirmDlg('清除所有数据？', '本机 ' + DB.records.length + ' 条记录会被永久删除，云端备份不受影响，此操作不可撤销。', '确认清除', function () {
          DB.records = []; DB.cleared = true; save(); render(); closeAbout(); toast('已清除');
        }, true);
        break;
      case 'noop': break;
    }
  });

  $('#dlgYes').addEventListener('click', function () {
    var cb = dlgCb;
    closeDlg();
    if (cb) cb();
  });
  $('#dlgNo').addEventListener('click', closeDlg);
  $('#dlgMask').addEventListener('click', closeDlg);
  $('#toastAct').addEventListener('click', function () {
    $('#toast').classList.remove('on');
    var fn = toastFn;
    toastFn = null;
    if (fn) fn();
  });

  $('#meBody').addEventListener('input', function (e) {
    var id = e.target.id;
    if (id === 'syncServer') DB.sync.server = e.target.value.trim();
    else if (id === 'syncUser') DB.sync.user = e.target.value.trim();
    else if (id === 'syncPass') DB.sync.pass = e.target.value;
    else if (id === 'syncFile') DB.sync.file = e.target.value.trim();
    else return;
    saveSoon();
  });

  noteInput.addEventListener('input', function () { add.note = noteInput.value; });

  addPage.addEventListener('focusin', function (e) {
    if (e.target === noteInput) {
      addPage.classList.add('kbd');
      setTimeout(function () {
        try { e.target.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (err) {}
      }, 260);
    }
  });
  addPage.addEventListener('focusout', function () {
    setTimeout(function () {
      if (document.activeElement !== noteInput) addPage.classList.remove('kbd');
    }, 120);
  });

  function addDateObj(str) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(str || ''));
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    var t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), t.getDate());
  }
  function fmtDate(d) {
    function p2(n) { return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
  }
  (function () {
    var timer = 0, chip = null, sx = 0, sy = 0;
    document.addEventListener('touchstart', function (e) {
      var c = e.target.closest && e.target.closest('.nchip');
      if (!c || !e.touches.length) return;
      chip = c; sx = e.touches[0].clientX; sy = e.touches[0].clientY;
      clearTimeout(timer);
      timer = setTimeout(function () {
        if (!chip) return;
        var note = chip.getAttribute('data-n');
        chip = null;
        if (!note) return;
        haptic();
        confirmDlg('删除这条常用备注？', '只会从常用备注里移除，不影响已经记好的账。', '删除', function () {
          DB.noteHidden = DB.noteHidden || [];
          if (DB.noteHidden.indexOf(note) < 0) DB.noteHidden.push(note);
          save();
          renderAdd();
        }, true);
      }, 560);
    }, { passive: true });
    document.addEventListener('touchmove', function (e) {
      if (!chip || !e.touches.length) return;
      if (Math.abs(e.touches[0].clientX - sx) > 8 || Math.abs(e.touches[0].clientY - sy) > 8) {
        clearTimeout(timer); chip = null;
      }
    }, { passive: true });
    document.addEventListener('touchend', function () { clearTimeout(timer); });
    document.addEventListener('touchcancel', function () { clearTimeout(timer); chip = null; });
    document.addEventListener('contextmenu', function (e) {
      if (e.target.closest && e.target.closest('.nchip')) e.preventDefault();
    });
  })();

  /* ---------- 日期滚动选择（年月日三列） ---------- */
  var pkCb = null, pkDate = new Date();
  var PK_ITEM = 44;

  function pkCol(el, values, selected, onPick) {
    el.innerHTML = values.map(function (v) {
      return '<div class="pk-ci' + (v === selected ? ' on' : '') + '" data-v="' + v + '">' + v + '</div>';
    }).join('');
    var idx = Math.max(0, values.indexOf(selected));
    el._idx = idx;
    el._vals = values;
    el._pick = onPick;
    el.onscroll = function () {
      var i = Math.round(el.scrollTop / PK_ITEM);
      if (i < 0) i = 0;
      if (i >= values.length) i = values.length - 1;
      if (i === el._idx) return;
      var steps = Math.abs(i - el._idx);
      el._idx = i;
      for (var k = 1; k <= Math.min(steps, 8); k++) setTimeout(haptic, k * 22);
      onPick(values[i]);
      Array.prototype.forEach.call(el.querySelectorAll('.pk-ci'), function (b, kk) {
        b.classList.toggle('on', kk === i);
      });
    };
    raf(function () { el.scrollTop = idx * PK_ITEM; });
  }

  function pkRefreshDays() {
    var dim = new Date(pkDate.getFullYear(), pkDate.getMonth() + 1, 0).getDate();
    if (pkDate.getDate() > dim) pkDate.setDate(dim);
    var days = [];
    for (var i = 1; i <= dim; i++) days.push(i);
    pkCol($('#pkD'), days, pkDate.getDate(), function (v) { pkDate.setDate(v); });
  }

  function pkOpen(title, date, cb) {
    pkCb = cb;
    pkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    $('#pkTitle').textContent = title;
    var years = [];
    for (var y = 2018; y <= 2032; y++) years.push(y);
    pkCol($('#pkY'), years, pkDate.getFullYear(), function (v) { pkDate.setFullYear(v); pkRefreshDays(); });
    pkCol($('#pkM'), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], pkDate.getMonth() + 1, function (v) {
      pkDate.setMonth(v - 1);
      pkRefreshDays();
    });
    pkRefreshDays();
    $('#pk').classList.add('on');
    $('#pkMask').classList.add('on');
  }

  function pkClose() {
    $('#pk').classList.remove('on');
    $('#pkMask').classList.remove('on');
  }

  function openListPicker() {
    pkOpen('选择日期', listYM, function (d) {
      var dir = (d.getFullYear() * 12 + d.getMonth()) >= (listYM.getFullYear() * 12 + listYM.getMonth()) ? 1 : -1;
      listYM = new Date(d.getFullYear(), d.getMonth(), 1);
      render();
      contentSlide(dir);
    });
  }

  function openStatPicker() {
    pkOpen('选择日期', statYM, function (d) {
      statYM = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      render();
    });
  }

  /* ---------- 左滑删除 ---------- */
  var swClose = function () {};
  (function () {
    var sw = { rec: null, pid: null, x0: 0, y0: 0, base: 0, mode: 0, v: 0, moved: false, ow: -86 };

    function anim(rec) { rec.style.transition = 'transform .22s cubic-bezier(.32,.72,0,1)'; }

    swClose = function () {
      if (!openRec) return;
      anim(openRec);
      openRec.style.transform = 'translateX(0)';
      openRec._open = false;
      openRec = null;
    };

    view.addEventListener('pointerdown', function (e) {
      var rec = e.target.closest('.rec,.tx');
      if (rec) sw.ow = rec.classList.contains('tx') ? -72 : -86;
      if (!rec) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      sw.rec = rec;
      sw.pid = e.pointerId;
      sw.x0 = e.clientX;
      sw.y0 = e.clientY;
      sw.base = rec._open ? -86 : 0;
      sw.mode = 0;
      sw.v = sw.base;
      sw.moved = false;
      rec.style.transition = 'none';
    }, { passive: true });

    document.addEventListener('pointermove', function (e) {
      if (!sw.rec || e.pointerId !== sw.pid) return;
      var dx = e.clientX - sw.x0, dy = e.clientY - sw.y0;
      if (sw.mode === 0) {
        if (Math.abs(dx) < 7 && Math.abs(dy) < 7) return;
        if (Math.abs(dy) > Math.abs(dx)) {
          sw.rec.style.transition = '';
          sw.rec = null;
          return;
        }
        sw.mode = 1;
        if (openRec && openRec !== sw.rec) swClose();
      }
      if (sw.mode !== 1) return;
      var v = sw.base + dx;
      v = v > 0 ? v * 0.25 : Math.max(-96, v);
      sw.v = v;
      if (Math.abs(dx) > 8) sw.moved = true;
      sw.rec.style.transform = 'translateX(' + v.toFixed(1) + 'px)';
    }, { passive: true });

    function end(e) {
      if (!sw.rec || (e && e.pointerId !== undefined && e.pointerId !== sw.pid)) return;
      var rec = sw.rec;
      sw.rec = null;
      sw.pid = null;
      if (sw.mode === 1) {
        if (sw.v < -40) {
          anim(rec);
          rec.style.transform = 'translateX(' + sw.ow + 'px)';
          rec._open = true;
          openRec = rec;
        } else {
          anim(rec);
          rec.style.transform = 'translateX(0)';
          if (rec._open) { rec._open = false; if (openRec === rec) openRec = null; }
        }
        if (sw.moved) {
          suppressClick = true;
          setTimeout(function () { suppressClick = false; }, 350);
        }
      } else {
        rec.style.transition = '';
      }
      sw.mode = 0;
    }

    document.addEventListener('pointerup', end);
    document.addEventListener('pointercancel', function () {
      if (!sw.rec) return;
      sw.rec.style.transition = '';
      sw.rec.style.transform = 'translateX(' + (sw.base < 0 ? sw.ow + 'px' : '0') + ')';
      sw.rec = null;
      sw.pid = null;
      sw.mode = 0;
    });
  })();

  /* ---------- 首页汇总卡：液态形变 ---------- */
  (function () {
    var lxEl = null, lxPid = null, lxBase = 24, lxX0 = 0, lxY0 = 0, lxRect = null;
    var lxMoved = 0, lxHoriz = false, lxDead = false, lxRaf = 0;
    var lxDx = 0, lxDy = 0, lxGx = 0, lxGy = 0, lxVx = 0, lxVy = 0;
    var lxPrevDx = 0, lxPrevDy = 0, lxPrevT = 0, lxSt = null;

    function paint(st) {
      if (!lxEl) return;
      var s = st.s;
      var sx = 1 + s * 0.13, sy = 1 - s * 0.06;
      lxEl.style.setProperty('--lx-tf',
        'translate3d(' + st.tx.toFixed(1) + 'px,' + st.ty.toFixed(1) + 'px,0) ' +
        'rotate(' + st.rot.toFixed(2) + 'deg) scale(' + sx.toFixed(3) + ',' + sy.toFixed(3) + ')');
      lxEl.style.setProperty('--lx-ox', st.ox.toFixed(0) + 'px');
      lxEl.style.setProperty('--lx-oy', st.oy.toFixed(0) + 'px');
      var g = s * 18, ux = st.ux, uy = st.uy;
      var cs = [[-1, -1], [1, -1], [1, 1], [-1, 1]], r = [];
      for (var i = 0; i < 4; i++) {
        var ccx = cs[i][0], ccy = cs[i][1];
        r.push(clamp(lxBase + g * (0.5 + 0.5 * ccx * ux) + g * 0.35 * (0.5 + 0.5 * ccy * uy), 8, lxBase + 30).toFixed(1));
      }
      var rs = r.join('px ') + 'px';
      lxEl.style.setProperty('--lx-r', rs + ' / ' + rs);
      lxEl.style.setProperty('--lx-gx', st.gx.toFixed(0) + 'px');
      lxEl.style.setProperty('--lx-gy', st.gy.toFixed(0) + 'px');
      lxEl.style.setProperty('--lx-gs', st.gs.toFixed(0) + 'px');
      lxEl.style.setProperty('--lx-ga', Math.max(0, st.ga).toFixed(2));
    }

    function neutral(el) {
      if (!el) return;
      el.classList.remove('lx-down', 'lx-drag', 'lx-spring');
      void el.offsetHeight;
      el.style.setProperty('--lx-tf', 'translate3d(0,0,0) scale(1,1)');
      el.style.setProperty('--lx-r', lxBase + 'px');
      el.style.setProperty('--lx-ga', '0');
      lxSt = null;
    }

    function down(e) {
      var card = e.target.closest('.lx-card');
      if (!card) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (lxPid !== null) return;
      if (lxRaf) { cancelAnimationFrame(lxRaf); lxRaf = 0; }
      lxEl = card;
      lxPid = e.pointerId;
      lxBase = parseFloat(getComputedStyle(card).borderTopLeftRadius) || 24;
      lxRect = card.getBoundingClientRect();
      lxX0 = e.clientX; lxY0 = e.clientY;
      lxMoved = 0; lxHoriz = false; lxDead = false;
      lxVx = lxVy = 0; lxPrevDx = lxPrevDy = 0; lxPrevT = 0;
      lxGx = lxX0 - lxRect.left; lxGy = lxY0 - lxRect.top;
      card.style.setProperty('--lx-ox', clamp(lxGx, 6, lxRect.width - 6).toFixed(0) + 'px');
      card.style.setProperty('--lx-oy', clamp(lxGy, 6, lxRect.height - 6).toFixed(0) + 'px');
      card.classList.remove('lx-tap', 'lx-spring');
      card.classList.add('lx-down');
      card.style.setProperty('--lx-tf', 'scale(.982)');
      card.style.setProperty('--lx-r', (lxBase + 1) + 'px');
      card.style.setProperty('--lx-gx', lxGx.toFixed(0) + 'px');
      card.style.setProperty('--lx-gy', lxGy.toFixed(0) + 'px');
      card.style.setProperty('--lx-gs', '130px');
      card.style.setProperty('--lx-ga', '.35');
      try { card.setPointerCapture(e.pointerId); } catch (err) {}
    }

    function move(e) {
      if (lxPid === null || e.pointerId !== lxPid || !lxEl || lxDead) return;
      var dx = e.clientX - lxX0, dy = e.clientY - lxY0;
      var ad = Math.abs(dx), ay = Math.abs(dy);
      lxMoved = Math.max(lxMoved, Math.sqrt(dx * dx + dy * dy));
      if (!lxHoriz) {
        if (ad < 4 && ay < 4) return;
        if (ay > ad * 1.05) {
          lxDead = true; lxPid = null;
          neutral(lxEl);
          return;
        }
        lxHoriz = true;
        lxEl.classList.add('lx-drag');
        haptic();
      }
      var now = performance.now();
      if (lxPrevT) {
        var dt = Math.max(8, Math.min(64, now - lxPrevT));
        lxVx = lxVx * 0.55 + ((dx - lxPrevDx) / dt) * 0.45;
        lxVy = lxVy * 0.55 + ((dy - lxPrevDy) / dt) * 0.45;
      }
      lxPrevDx = dx; lxPrevDy = dy; lxPrevT = now;
      lxDx = dx; lxDy = dy;
      frame();
    }

    function frame() {
      if (!lxEl || !lxPid || !lxHoriz) return;
      var dx = lxDx, dy = lxDy;
      var spd = Math.sqrt(lxVx * lxVx + lxVy * lxVy);
      var boost = clamp(spd / 2.0, 0, 1);
      var s = clamp(0.62 * clamp((Math.abs(dx) - 3) / 120, 0, 1) + 0.5 * boost, 0, 1.1);
      var tx = clamp(dx * 0.62, -90, 90);
      var ty = clamp(dy * 0.4, -50, 50);
      var w = lxRect.width || 340;
      var q = clamp((Math.abs(dx) - 4) / 56, 0, 1);
      lxSt = {
        s: s, tx: tx, ty: ty,
        rot: clamp(lxVx * 1.9, -3, 3),
        ox: lxGx + ((dx > 0 ? w : 0) - lxGx) * q,
        oy: lxGy,
        ux: clamp(dx / 70, -1, 1),
        uy: clamp(dy / 60, -1, 1),
        ga: 0.30 + 0.5 * boost,
        gx: lxGx + dx - tx,
        gy: lxGy + dy - ty,
        gs: 120 + 260 * s
      };
      paint(lxSt);
    }

    function spring(spd) {
      if (!lxEl || !lxSt) return;
      var el = lxEl, st = lxSt;
      el.classList.add('lx-spring');
      var e = 1, ev = -(0.8 + Math.min(1.8, spd * 0.6));
      var last = performance.now();
      function tick(now) {
        if (lxEl !== el || lxPid !== null || !el.isConnected) {
          lxRaf = 0;
          el.classList.remove('lx-spring');
          if (!el.isConnected) neutral(el);
          return;
        }
        var dt = Math.min(0.032, Math.max(0.008, (now - last) / 1000));
        last = now;
        ev += (-260 * e - 13 * ev) * dt;
        e += ev * dt;
        if (Math.abs(e) < 0.004 && Math.abs(ev) < 0.08) {
          lxRaf = 0;
          el.classList.remove('lx-spring');
          neutral(el);
          return;
        }
        paint({
          s: st.s * e, tx: st.tx * e, ty: st.ty * e, rot: st.rot * e,
          ox: st.ox, oy: st.oy, ux: st.ux, uy: st.uy,
          ga: st.ga * Math.max(0, e) + 0.05, gx: st.gx, gy: st.gy, gs: st.gs
        });
        lxRaf = raf(tick);
      }
      lxRaf = raf(tick);
    }

    function up(e) {
      if (lxPid === null || !lxEl) return;
      if (e && e.pointerId !== undefined && e.pointerId !== lxPid) return;
      var el = lxEl;
      var wasDrag = lxHoriz && !lxDead;
      var tap = (!lxHoriz && !lxDead && lxMoved < 5);
      var spd = Math.sqrt(lxVx * lxVx + lxVy * lxVy);
      try { el.releasePointerCapture(lxPid); } catch (err) {}
      lxPid = null;
      if (wasDrag) {
        suppressClick = true;
        setTimeout(function () { suppressClick = false; }, 320);
        spring(spd);
        return;
      }
      neutral(el);
      if (tap) {
        el.classList.remove('lx-tap');
        void el.offsetWidth;
        el.classList.add('lx-tap');
        var done = function () { el.classList.remove('lx-tap'); el.removeEventListener('animationend', done); };
        el.addEventListener('animationend', done);
      }
    }

    function cancel() {
      if (!lxEl) return;
      lxPid = null;
      if (lxRaf) { cancelAnimationFrame(lxRaf); lxRaf = 0; }
      neutral(lxEl);
    }

    document.addEventListener('pointerdown', down, { passive: true });
    document.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerup', up);
    document.addEventListener('pointercancel', cancel);
    view.addEventListener('scroll', function () {
      if (lxPid === null || !lxEl) return;
      lxPid = null; lxDead = true;
      cancel();
    }, { passive: true });
  })();

  /* ---------- 返回键 ---------- */
  window.__dshBack = function () {
    var host = document.getElementById('sheetHost');
    if (host && host.classList.contains('show')) { closeSheet(); return true; }
    if (addPage.classList.contains('on')) { closeAdd(); return true; }
    if ($('#pk') && $('#pk').classList.contains('on')) { pkClose(); return true; }
    if ($('#dlg').classList.contains('on')) { closeDlg(); return true; }
    if (openRec) { swClose(); return true; }
    if ($('#pageMe') && $('#pageMe').classList.contains('on')) { closeMe(); return true; }
    if (tab !== 'home') { go('home'); return true; }
    return false;
  };

  /* ---------- 系统主题 ---------- */
  try {
    var mq = matchMedia('(prefers-color-scheme: dark)');
    var onSys = function () {
      if (DB.theme !== 'system') return;
      applyTheme();
      if (tab === 'me') render();
    };
    if (mq.addEventListener) mq.addEventListener('change', onSys);
    else if (mq.addListener) mq.addListener(onSys);
  } catch (e) {}

  window.__sysTheme = function () {
    if (DB.theme !== 'system') return;
    applyTheme();
    if (tab === 'me') render();
  };
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && DB.theme === 'system') window.__sysTheme();
  });

  /* ---------- 启动 ---------- */
  function boot() {
    applyTheme();
    pushWidget();
    setTimeout(maybeAutoPull, 1200);
    render();
    raf(function () {
      var app = $('#app');
      if (app) app.classList.add('reveal');
      var sp = $('#splash');
      if (!sp) return;
      var done = false;
      function finish() {
        if (done) return;
        done = true;
        sp.classList.add('out');
        sp.style.pointerEvents = 'none';
        setTimeout(function () { if (sp.parentNode) sp.parentNode.removeChild(sp); }, 900);
      }
      sp.addEventListener('click', finish);
      // 自己驱动时间轴：只有真正画出一帧时前进，卡顿不会让动画「偷偷跑完」
      var started = false;
      function start() {
        if (started) return;
        started = true;
        sp.classList.add('go');
        var els = [sp.querySelector('.sp-logo'), sp.querySelector('.sp-name')];
        var anims = [];
        els.forEach(function (el) {
          if (el && el.getAnimations) anims = anims.concat(el.getAnimations());
        });
        var DUR = 2200, t = 0, last = 0, wall = 0;
        if (!anims.length) { setTimeout(finish, 1500); return; }
        anims.forEach(function (a) { try { a.pause(); a.currentTime = 0; } catch (e) {} });
        requestAnimationFrame(function step(ts) {
          if (!wall) wall = ts;
          // 每帧最多推进 34ms：卡顿只会让动画变慢，不会把入场跳过去
          var d = last ? Math.min(ts - last, 34) : 17;
          last = ts;
          t = Math.min(t + d, DUR);
          anims.forEach(function (a) { try { a.currentTime = t; } catch (e) {} });
          if (t >= DUR || ts - wall > 6000) { finish(); return; }
          requestAnimationFrame(step);
        });
      }
      window.__splashGo = start;
      setTimeout(start, 2500); // 兜底：万一没收到原生回调
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
