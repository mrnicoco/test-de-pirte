/* ==========================================================================
   Pur ou Pas — application (vanilla JS, aucun framework)
   Modules : Utils · Store · Data · Engine · Score · Codec · UI (écrans) ·
             Quiz · Profil · Bande · Live (PeerJS) · Router
   Tout est piloté par window.POP_DATA : aucun id de question n'est codé en dur.
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ *
   * Utils
   * ------------------------------------------------------------------ */
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const reduceMotion = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /** Crée un élément DOM. Le texte passe TOUJOURS par des text nodes (jamais innerHTML). */
  function h(tag, props) {
    const el = document.createElement(tag);
    if (props) {
      for (const k in props) {
        const v = props[k];
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = v;
        else if (k === 'style') el.style.cssText = v;
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else if (v === true) el.setAttribute(k, '');
        else el.setAttribute(k, String(v));
      }
    }
    for (let i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  }
  function append(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) { c.forEach((x) => append(el, x)); return; }
    el.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  const SVGNS = 'http://www.w3.org/2000/svg';
  function s(tag, attrs) {
    const el = document.createElementNS(SVGNS, tag);
    if (attrs) for (const k in attrs) if (attrs[k] != null) el.setAttribute(k, String(attrs[k]));
    for (let i = 2; i < arguments.length; i++) {
      const c = arguments[i];
      if (c == null) continue;
      el.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
    }
    return el;
  }

  /** Format FR : 63,4 % (espace fine insécable). */
  function fmtPct(v, dec) {
    const d = dec == null ? 1 : dec;
    return (Math.round(v * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d).replace('.', ',') + ' %';
  }
  function plural(n, one, many) { return n + ' ' + (n > 1 ? many : one); }

  /** Nettoie un pseudo : pas de caractères de contrôle / bidi, 16 caractères max. */
  function cleanName(v) {
    const str = String(v == null ? '' : v)
      .replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2066-\u2069\ufeff]/g, '')
      .replace(/\s+/g, ' ').trim();
    return Array.from(str).slice(0, 16).join('').trim();
  }
  function initials(name) {
    const a = Array.from(cleanName(name) || '?');
    return a[0].toUpperCase();
  }
  function hashStr(str) {
    let x = 2166136261;
    for (let i = 0; i < str.length; i++) { x ^= str.charCodeAt(i); x = Math.imul(x, 16777619); }
    return x >>> 0;
  }
  function randId(len, alpha) {
    const A = alpha || 'abcdefghijklmnopqrstuvwxyz0123456789';
    const buf = new Uint32Array(len);
    (window.crypto || window.msCrypto).getRandomValues(buf);
    let out = '';
    for (let i = 0; i < len; i++) out += A[buf[i] % A.length];
    return out;
  }
  const NEON = ['#ff2fb9', '#22e8ff', '#dcff3a', '#a173ff', '#ff8a3d', '#7dffb2'];
  const colorFor = (key) => NEON[hashStr(String(key)) % NEON.length];

  /** Stockage local : toutes les lectures/écritures protégées (navigation privée, quota…). */
  function makeStore(kind) {
    const area = () => { try { return window[kind]; } catch (e) { return null; } };
    return {
      get(k, def) {
        try { const a = area(); const v = a && a.getItem('pop.' + k); return v == null ? def : JSON.parse(v); }
        catch (e) { return def; }
      },
      set(k, v) { try { const a = area(); if (a) a.setItem('pop.' + k, JSON.stringify(v)); return true; } catch (e) { return false; } },
      del(k) { try { const a = area(); if (a) a.removeItem('pop.' + k); } catch (e) { /* ignore */ } }
    };
  }
  const Store = makeStore('localStorage');
  const Session = makeStore('sessionStorage');

  /** Chargement paresseux d'un script externe, avec URLs de repli. */
  const scriptCache = {};
  function loadScript(urls, test) {
    const key = urls[0];
    if (test()) return Promise.resolve();
    if (scriptCache[key]) return scriptCache[key];
    scriptCache[key] = new Promise((resolve, reject) => {
      let i = 0;
      const next = () => {
        if (i >= urls.length) { delete scriptCache[key]; reject(new Error('script')); return; }
        const el = document.createElement('script');
        el.src = urls[i++]; el.async = true; el.crossOrigin = 'anonymous';
        el.onload = () => (test() ? resolve() : next());
        el.onerror = () => { el.remove(); next(); };
        document.head.appendChild(el);
      };
      next();
    });
    return scriptCache[key];
  }
  const QR_URLS = ['https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js', 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js'];
  const PEER_URLS = ['https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js', 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js'];

  /* ------------------------------------------------------------------ *
   * Feedback : toasts, annonces lecteur d'écran, vibration, sons
   * ------------------------------------------------------------------ */
  function toast(msg, kind, ms) {
    const box = $('#toasts');
    const t = h('div', { class: 'toast ' + (kind || '') }, msg);
    box.appendChild(t);
    while (box.children.length > 3) box.firstChild.remove();
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 320); }, ms || 2600);
  }
  function announce(msg) { const sr = $('#sr'); sr.textContent = ''; setTimeout(() => { sr.textContent = msg; }, 30); }
  function buzz(ms) {
    try {
      const ua = navigator.userActivation;
      if (navigator.vibrate && (!ua || ua.hasBeenActive)) navigator.vibrate(ms || 12);
    } catch (e) { /* ignore */ }
  }
  const Sound = (function () {
    let on = !!Store.get('sound', false);
    let ctx = null;
    function ensure() {
      if (!ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; ctx = new AC(); }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    }
    function tone(freq, dur, type, when, vol) {
      const c = ensure(); if (!c) return;
      const t0 = c.currentTime + (when || 0);
      const o = c.createOscillator(); const g = c.createGain();
      o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g).connect(c.destination); o.start(t0); o.stop(t0 + dur + 0.02);
    }
    const sounds = {
      yes() { tone(520, 0.12, 'triangle'); tone(780, 0.16, 'triangle', 0.06); },
      no() { tone(330, 0.14, 'sine'); },
      pop() { tone(900, 0.07, 'square', 0, 0.05); },
      reveal() { [440, 554, 659].forEach((f, i) => tone(f, 0.2, 'triangle', i * 0.07)); },
      win() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.28, 'triangle', i * 0.09, 0.1)); }
    };
    return {
      get on() { return on; },
      toggle() { on = !on; Store.set('sound', on); if (on) { ensure(); sounds.pop(); } return on; },
      play(name) { if (on && sounds[name]) { try { sounds[name](); } catch (e) { /* ignore */ } } }
    };
  })();

  /* ------------------------------------------------------------------ *
   * Data : validation + index du jeu de questions
   * ------------------------------------------------------------------ */
  const D = (function () {
    const raw = window.POP_DATA;
    if (!raw || !Array.isArray(raw.categories) || !Array.isArray(raw.questions) || !raw.questions.length) return null;
    const cats = raw.categories.filter((c) => c && typeof c.id === 'string').map((c) => ({ id: c.id, label: String(c.label || c.id), emoji: String(c.emoji || '•') }));
    const catIdx = new Map(cats.map((c, i) => [c.id, i]));
    const qs = [];
    const qIdx = new Map();
    raw.questions.forEach((q) => {
      if (!q || typeof q.id !== 'string' || typeof q.q !== 'string' || qIdx.has(q.id) || !catIdx.has(q.cat)) return;
      qIdx.set(q.id, qs.length);
      qs.push({ id: q.id, cat: q.cat, c: catIdx.get(q.cat), q: q.q, gate: q.gate || null, quip: typeof q.quip === 'string' && q.quip ? q.quip : null });
    });
    const n = qs.length;
    // Index du parent (-1 = pas de porte). Une porte inconnue est ignorée.
    const gateIdx = qs.map((q) => (q.gate && qIdx.has(q.gate) ? qIdx.get(q.gate) : -1));
    const depth = qs.map((_, i) => { let d = 0, g = gateIdx[i], guard = 0; while (g >= 0 && guard++ < 50) { d++; g = gateIdx[g]; } return d; });
    const byCat = cats.map((_, ci) => qs.map((q, i) => (q.c === ci ? i : -1)).filter((i) => i >= 0));
    const tiers = (Array.isArray(raw.tiers) ? raw.tiers : []).filter((t) => t && typeof t.min === 'number').slice().sort((a, b) => b.min - a.min);
    const archetypes = (Array.isArray(raw.archetypes) ? raw.archetypes : []).filter((a) => a && a.rule && a.name);
    const badges = (Array.isArray(raw.badges) ? raw.badges : []).filter((b) => b && b.rule && b.name);
    return { version: Number(raw.version) | 0, cats, catIdx, qs, qIdx, n, gateIdx, depth, byCat, tiers, archetypes, badges };
  })();

  /* ------------------------------------------------------------------ *
   * Engine : portes (gates), questions éligibles, progression
   * Réponses = tableau de longueur n : 1 = OUI, 0 = NON, -1 = pas (encore) répondu
   * ------------------------------------------------------------------ */
  const Engine = {
    blank() { return new Int8Array(D.n).fill(-1); },
    /** Une question est posée si toute sa chaîne de parents a reçu OUI. */
    eligible(i, ans) {
      let g = D.gateIdx[i], guard = 0;
      while (g >= 0 && guard++ < 50) { if (ans[g] !== 1) return false; g = D.gateIdx[g]; }
      return true;
    },
    /** Peut-elle encore être posée ? (parents à OUI ou pas encore répondus) */
    possible(i, ans) {
      let g = D.gateIdx[i], guard = 0;
      while (g >= 0 && guard++ < 50) { if (ans[g] === 0) return false; g = D.gateIdx[g]; }
      return true;
    },
    /** Le parent le plus haut auquel on n'a pas dit OUI (pour « tu as dit non à … »). */
    blocker(i, ans) {
      let g = D.gateIdx[i], found = -1, guard = 0;
      while (g >= 0 && guard++ < 50) { if (ans[g] !== 1) found = g; g = D.gateIdx[g]; }
      return found;
    },
    next(from, ans) { for (let i = Math.max(0, from); i < D.n; i++) if (Engine.eligible(i, ans)) return i; return -1; },
    remaining(from, ans) { let c = 0; for (let i = Math.max(0, from); i < D.n; i++) if (ans[i] === -1 && Engine.possible(i, ans)) c++; return c; },
    /** Normalise : non-répondu → 0, et un OUI dont la porte est fermée → 0. */
    finalize(ans) {
      const out = new Uint8Array(D.n);
      for (let i = 0; i < D.n; i++) out[i] = ans[i] === 1 && Engine.eligible(i, out) ? 1 : 0;
      return out;
    }
  };

  /* ------------------------------------------------------------------ *
   * Score : pureté, impureté par catégorie, palier, archétype, badges
   * ------------------------------------------------------------------ */
  const Score = {
    fromBits(name, bits) {
      let yes = 0;
      for (let i = 0; i < D.n; i++) yes += bits[i] ? 1 : 0;
      const catImp = D.byCat.map((list) => (list.length ? (100 * list.reduce((a, i) => a + (bits[i] ? 1 : 0), 0)) / list.length : 0));
      return { name, kind: 'full', bits, yes, purity: (100 * (D.n - yes)) / D.n, catImp };
    },
    tier(p) {
      for (const t of D.tiers) if (p >= t.min) return t;
      return D.tiers[D.tiers.length - 1] || { title: '', text: '' };
    },
    /** Priorité : pure > all > duo > dominant. */
    archetype(p) {
      const A = D.archetypes;
      const order = p.catImp.map((v, i) => i).sort((a, b) => p.catImp[b] - p.catImp[a] || a - b);
      const byType = (t) => A.filter((a) => a.rule.type === t);
      if (p.purity >= 85) { const a = byType('pure')[0]; if (a) return a; }
      if (p.purity <= 30) { const a = byType('all')[0]; if (a) return a; }
      if (order.length >= 2) {
        const c1 = D.cats[order[0]].id, c2 = D.cats[order[1]].id;
        if (p.catImp[order[0]] >= 40 && p.catImp[order[1]] >= 40) {
          const duo = byType('duo').find((a) => Array.isArray(a.rule.cats) && a.rule.cats.length === 2 && a.rule.cats.includes(c1) && a.rule.cats.includes(c2) && c1 !== c2);
          if (duo) return duo;
        }
      }
      for (const ci of order) {
        const dom = byType('dominant').find((a) => a.rule.cat === D.cats[ci].id);
        if (dom) return dom;
      }
      return A[0] || { emoji: '🎲', name: 'Inclassable', desc: 'Même les données ne savent pas quoi penser de vous.' };
    },
    /** Badges : yes (toutes les ids à OUI ; rule.mode:"any" = au moins une), catMin, catMax. */
    badges(p) {
      return D.badges.filter((b) => {
        const r = b.rule;
        if (r.type === 'yes') {
          if (!p.bits || !Array.isArray(r.ids) || !r.ids.length) return false;
          const vals = r.ids.map((id) => (D.qIdx.has(id) ? p.bits[D.qIdx.get(id)] === 1 : false));
          return r.mode === 'any' ? vals.some(Boolean) : vals.every(Boolean);
        }
        const ci = D.catIdx.get(r.cat);
        if (ci == null) return false;
        if (r.type === 'catMin') return p.catImp[ci] >= Number(r.min);
        if (r.type === 'catMax') return p.catImp[ci] <= Number(r.max);
        return false;
      });
    }
  };

  /* ------------------------------------------------------------------ *
   * Codec : codes de résultat sans serveur (base64url)
   *  #r= complet : [1][ver data][len pseudo][pseudo UTF-8 ≤48][bits réponses][checksum]
   *  #p= discret : [2][ver data][len pseudo][pseudo][pureté×10 (2 octets)][impureté/cat (1 octet chacune)][checksum]
   * ------------------------------------------------------------------ */
  const Codec = (function () {
    const enc = new TextEncoder();
    function b64enc(bytes) {
      let bin = '';
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    function b64dec(str) {
      try {
        let t = str.replace(/-/g, '+').replace(/_/g, '/');
        while (t.length % 4) t += '=';
        const bin = atob(t);
        const out = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
        return out;
      } catch (e) { return null; }
    }
    function checksum(bytes, len) { let c = 0x5a; for (let i = 0; i < len; i++) c = (Math.imul(c, 31) + bytes[i]) & 0xff; return c; }
    function nameBytes(name) {
      const chars = Array.from(cleanName(name));
      let b = enc.encode(chars.join(''));
      while (b.length > 48) { chars.pop(); b = enc.encode(chars.join('')); }
      return b;
    }
    function finish(arr) { const out = new Uint8Array(arr.length + 1); out.set(arr); out[arr.length] = checksum(out, arr.length); return b64enc(out); }

    function encodeFull(name, bits) {
      const nb = nameBytes(name);
      const nBytes = Math.ceil(D.n / 8);
      const arr = new Uint8Array(3 + nb.length + nBytes);
      arr[0] = 1; arr[1] = D.version & 0xff; arr[2] = nb.length; arr.set(nb, 3);
      for (let i = 0; i < D.n; i++) if (bits[i]) arr[3 + nb.length + (i >> 3)] |= 0x80 >> (i & 7);
      return finish(arr);
    }
    function encodeScore(name, purity, catImp) {
      const nb = nameBytes(name);
      const arr = new Uint8Array(3 + nb.length + 2 + D.cats.length);
      arr[0] = 2; arr[1] = D.version & 0xff; arr[2] = nb.length; arr.set(nb, 3);
      const p10 = clamp(Math.round(purity * 10), 0, 1000);
      let o = 3 + nb.length;
      arr[o++] = p10 >> 8; arr[o++] = p10 & 0xff;
      catImp.forEach((v) => { arr[o++] = clamp(Math.round(v), 0, 100); });
      return finish(arr);
    }
    /** Extrait le code depuis une URL complète, un hash, « r=… » ou le code brut. */
    function extract(input) {
      const str = String(input || '').trim();
      const m = str.match(/(?:^|[#&?\s/])([rp])=([A-Za-z0-9_-]{4,})/);
      if (m) return m[2];
      if (/^[A-Za-z0-9_-]{4,}$/.test(str)) return str;
      return null;
    }
    const ERR = {
      empty: 'Colle un lien ou un code de profil 😉',
      bad: 'Ce code est illisible. Vérifie que tu as bien copié le lien en entier.',
      broken: 'Ce code semble abîmé ou incomplet (un caractère manquant ?).',
      format: 'Ce code ne ressemble pas à un profil Pur ou Pas.',
      version: 'Ce profil vient d\'une autre version du test. Demande-lui de le refaire, ça prend 5 minutes 😇'
    };
    function decode(input) {
      if (!D) return { ok: false, error: ERR.format };
      const code = extract(input);
      if (!code) return { ok: false, error: String(input || '').trim() ? ERR.bad : ERR.empty };
      const b = b64dec(code);
      if (!b || b.length < 6) return { ok: false, error: ERR.bad };
      if (b[0] !== 1 && b[0] !== 2) return { ok: false, error: ERR.format };
      if (checksum(b, b.length - 1) !== b[b.length - 1]) return { ok: false, error: ERR.broken };
      if (b[1] !== (D.version & 0xff)) return { ok: false, error: ERR.version };
      const nl = b[2];
      if (nl > 48 || 3 + nl > b.length - 1) return { ok: false, error: ERR.broken };
      let name;
      try { name = cleanName(new TextDecoder('utf-8', { fatal: true }).decode(b.subarray(3, 3 + nl))) || 'Anonyme'; }
      catch (e) { return { ok: false, error: ERR.broken }; }
      let o = 3 + nl;
      if (b[0] === 1) {
        if (b.length !== o + Math.ceil(D.n / 8) + 1) return { ok: false, error: ERR.version };
        const raw = new Int8Array(D.n);
        for (let i = 0; i < D.n; i++) raw[i] = b[o + (i >> 3)] & (0x80 >> (i & 7)) ? 1 : 0;
        const bits = Engine.finalize(raw);
        const p = Score.fromBits(name, bits);
        p.code = encodeFull(name, bits);
        return { ok: true, profile: p };
      }
      if (b.length !== o + 2 + D.cats.length + 1) return { ok: false, error: ERR.version };
      const purity = clamp(((b[o] << 8) | b[o + 1]) / 10, 0, 100); o += 2;
      const catImp = D.cats.map((_, i) => clamp(b[o + i], 0, 100));
      return { ok: true, profile: { name, kind: 'score', purity, catImp, code: code } };
    }
    return { encodeFull, encodeScore, decode, extract, b64enc, b64dec };
  })();

  /** Liens de partage (fonctionne en local file:// comme sur GitHub Pages). */
  const baseUrl = () => location.href.split('#')[0];
  const fullLink = (p) => baseUrl() + '#r=' + p.code;
  const scoreCode = (p) => (p.kind === 'full' ? Codec.encodeScore(p.name, p.purity, p.catImp) : p.code);
  const scoreLink = (p) => baseUrl() + '#p=' + scoreCode(p);

  /* ------------------------------------------------------------------ *
   * Profils locaux : moi + ma bande
   * ------------------------------------------------------------------ */
  const Profiles = {
    me() {
      const code = Store.get('me', null);
      if (!code) return null;
      const r = Codec.decode(code);
      if (!r.ok) return null;
      r.profile.me = true;
      return r.profile;
    },
    setMe(bits, name) {
      const code = Codec.encodeFull(name, bits);
      Store.set('me', code);
      return Profiles.me();
    },
    renameMe(name) {
      const me = Profiles.me();
      if (me && me.kind === 'full' && name) Store.set('me', Codec.encodeFull(name, me.bits));
    },
    friendCodes() { const l = Store.get('band', []); return Array.isArray(l) ? l.filter((c) => typeof c === 'string') : []; },
    friends() {
      const out = [];
      let invalid = 0;
      Profiles.friendCodes().forEach((c) => { const r = Codec.decode(c); if (r.ok) out.push(r.profile); else invalid++; });
      out.invalid = invalid;
      return out;
    },
    all() { const me = Profiles.me(); const f = Profiles.friends(); const all = me ? [me].concat(f) : f.slice(); all.invalid = f.invalid; return all; },
    /** Ajoute (ou met à jour si même pseudo). Retourne {status, profile}. */
    add(p) {
      const me = Profiles.me();
      if (me && (me.code === p.code || (p.kind === 'score' && scoreCode(me) === p.code))) return { status: 'me', profile: p };
      const codes = Profiles.friendCodes();
      if (codes.includes(p.code)) return { status: 'dup', profile: p };
      const norm = (x) => x.toLocaleLowerCase('fr');
      const same = codes.findIndex((c) => { const r = Codec.decode(c); return r.ok && norm(r.profile.name) === norm(p.name); });
      if (same >= 0) {
        const old = Codec.decode(codes[same]).profile;
        // on garde la version la plus riche : un lien discret ne remplace pas un profil complet
        if (old.kind === 'full' && p.kind === 'score') return { status: 'dup', profile: p };
        codes[same] = p.code;
        Store.set('band', codes);
        return { status: 'updated', profile: p };
      }
      codes.push(p.code);
      if (codes.length > 40) codes.shift();
      Store.set('band', codes);
      return { status: 'added', profile: p };
    },
    remove(code) { Store.set('band', Profiles.friendCodes().filter((c) => c !== code)); },
    purgeInvalid() { Store.set('band', Profiles.friendCodes().filter((c) => Codec.decode(c).ok)); }
  };

  /* ------------------------------------------------------------------ *
   * Effets visuels : confettis, flash, compteur animé
   * ------------------------------------------------------------------ */
  const FX = (function () {
    let raf = 0;
    function confetti(count) {
      if (reduceMotion()) return;
      const cv = $('#fx'); const ctx = cv.getContext('2d');
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const parts = [];
      for (let i = 0; i < (count || 150); i++) {
        parts.push({
          x: innerWidth / 2 + (Math.random() - 0.5) * innerWidth * 0.4, y: innerHeight * 0.32,
          vx: (Math.random() - 0.5) * 13, vy: -Math.random() * 13 - 4,
          w: 5 + Math.random() * 7, hh: 8 + Math.random() * 10, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
          c: NEON[i % NEON.length], life: 0
        });
      }
      cancelAnimationFrame(raf);
      const t0 = performance.now();
      const step = (t) => {
        ctx.clearRect(0, 0, innerWidth, innerHeight);
        let alive = 0;
        parts.forEach((p) => {
          p.vy += 0.32; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
          if (p.y < innerHeight + 30) alive++;
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
          ctx.globalAlpha = clamp(1 - (t - t0) / 3800, 0, 1);
          ctx.fillStyle = p.c; ctx.shadowColor = p.c; ctx.shadowBlur = 8;
          ctx.fillRect(-p.w / 2, -p.hh / 2, p.w, p.hh * Math.abs(Math.cos(p.r * 2)) + 2);
          ctx.restore();
        });
        if (alive && t - t0 < 4000) raf = requestAnimationFrame(step);
        else ctx.clearRect(0, 0, innerWidth, innerHeight);
      };
      raf = requestAnimationFrame(step);
    }
    function flash() { if (reduceMotion()) return; const f = $('#flash'); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); }
    function counter(el, to, ms, fmt) {
      if (reduceMotion()) { el.textContent = fmt(to); return; }
      const t0 = performance.now(); const dur = ms || 1400;
      const tick = (t) => {
        const k = clamp((t - t0) / dur, 0, 1); const e = 1 - Math.pow(1 - k, 3);
        el.textContent = fmt(to * e);
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
    return { confetti, flash, counter };
  })();

  /* ------------------------------------------------------------------ *
   * Radar SVG fait main (N axes, plusieurs séries, animé)
   * ------------------------------------------------------------------ */
  function radar(series, opts) {
    const N = D.cats.length, R = 100;
    const ang = (i) => -Math.PI / 2 + (2 * Math.PI * i) / N;
    const pt = (i, v) => [Math.cos(ang(i)) * R * v, Math.sin(ang(i)) * R * v];
    const svg = s('svg', { class: 'radar', viewBox: '-172 -162 344 324', role: 'img', 'aria-label': (opts && opts.label) || 'Radar d\'impureté par catégorie' });
    [0.25, 0.5, 0.75, 1].forEach((k) => {
      svg.appendChild(s('polygon', { class: 'ring' + (k === 1 ? ' outer' : ''), points: D.cats.map((_, i) => pt(i, k).join(',')).join(' ') }));
    });
    D.cats.forEach((c, i) => {
      const [x, y] = pt(i, 1);
      svg.appendChild(s('line', { class: 'axis', x1: 0, y1: 0, x2: x, y2: y }));
      const [lx, ly] = pt(i, 1.3);
      const g = s('g', { transform: 'translate(' + lx.toFixed(1) + ',' + ly.toFixed(1) + ')' });
      g.appendChild(s('text', { class: 'lbl lbl-e', 'text-anchor': 'middle', y: -3 }, c.emoji));
      g.appendChild(s('text', { class: 'lbl', 'text-anchor': 'middle', y: 14 }, c.label));
      svg.appendChild(g);
    });
    // Repères 50 % / 100 %
    svg.appendChild(s('text', { class: 'lbl', x: 4, y: -R * 0.5 + 4, style: 'font-size:9px;fill:rgba(255,255,255,.35)' }, '50'));
    const polys = series.map((se) => {
      const poly = s('polygon', { fill: se.color, 'fill-opacity': series.length > 1 ? 0.12 : 0.22, stroke: se.color, 'stroke-width': 2.5, 'stroke-linejoin': 'round', style: 'filter:drop-shadow(0 0 6px ' + se.color + ')' });
      svg.appendChild(poly);
      const dots = se.values.map(() => { const d = s('circle', { r: 3.6, fill: se.color }); svg.appendChild(d); return d; });
      return { poly, dots, values: se.values };
    });
    const draw = (t) => {
      polys.forEach((p) => {
        const pts = p.values.map((v, i) => pt(i, Math.max(0.015, (v / 100) * t)));
        p.poly.setAttribute('points', pts.map((q) => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' '));
        p.dots.forEach((d, i) => { d.setAttribute('cx', pts[i][0].toFixed(1)); d.setAttribute('cy', pts[i][1].toFixed(1)); });
      });
    };
    if (reduceMotion()) draw(1);
    else {
      draw(0);
      const t0 = performance.now();
      const back = (k) => { const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
      const tick = (t) => { const k = clamp((t - t0) / 1000, 0, 1); draw(back(k)); if (k < 1) requestAnimationFrame(tick); };
      setTimeout(() => requestAnimationFrame(tick), (opts && opts.delay) || 150);
    }
    return svg;
  }
  function legend(items) {
    return h('div', { class: 'legend' }, items.map((it) => h('span', null, h('i', { style: 'background:' + it.color + ';box-shadow:0 0 8px ' + it.color }), it.name)));
  }

  /* ------------------------------------------------------------------ *
   * QR code (librairie chargée à la demande, rendu SVG maison)
   * ------------------------------------------------------------------ */
  function qrBlock(text) {
    const box = h('div', { class: 'qr' }, h('p', { class: 'small muted' }, 'Génération du QR code…'));
    loadScript(QR_URLS, () => typeof window.qrcode === 'function').then(() => {
      const qr = window.qrcode(0, 'M');
      qr.addData(text); qr.make();
      const n = qr.getModuleCount();
      let d = '';
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += 'M' + c + ' ' + r + 'h1v1h-1z';
      const svg = s('svg', { viewBox: '-1 -1 ' + (n + 2) + ' ' + (n + 2), 'shape-rendering': 'crispEdges', role: 'img', 'aria-label': 'QR code du lien' }, s('path', { d, fill: '#0b0616' }));
      box.textContent = '';
      box.appendChild(h('div', { class: 'qr-box' }, svg));
      box.appendChild(h('p', { class: 'small muted center', style: 'margin:0' }, 'Scanne avec l\'appareil photo 📸'));
    }).catch(() => {
      box.textContent = '';
      box.appendChild(h('p', { class: 'small muted center' }, 'QR code indisponible (pas de connexion ?). Copie plutôt le lien.'));
    });
    return box;
  }
  function modal(title, content) {
    const close = () => { m.remove(); document.removeEventListener('keydown', onKey); if (prev) prev.focus(); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    const prev = document.activeElement;
    const closeBtn = h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Fermer', onclick: close }, '✕');
    const m = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': title, onclick: (e) => { if (e.target === m) close(); } },
      h('div', { class: 'card' }, h('div', { class: 'card-title' }, h('h3', null, title), closeBtn), content));
    document.body.appendChild(m);
    document.addEventListener('keydown', onKey);
    closeBtn.focus();
    return close;
  }
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) { /* repli */ }
    try {
      const ta = h('textarea', { style: 'position:fixed;opacity:0;top:0;left:0', readonly: true });
      ta.value = text; document.body.appendChild(ta); ta.select();
      const ok = document.execCommand('copy'); ta.remove(); return ok;
    } catch (e) { return false; }
  }
  async function shareOrCopy(url, title, text) {
    if (navigator.share) {
      try { await navigator.share({ title, text, url }); return; }
      catch (e) { if (e && e.name === 'AbortError') return; }
    }
    if (await copyText(url)) toast('Lien copié ✨ Colle-le dans ta conv\' de groupe', 'ok');
    else toast('Impossible de copier automatiquement : sélectionne le lien à la main.', 'err');
  }

  /* ------------------------------------------------------------------ *
   * Écrans & routing (hash : #/quiz, #/resultat, #/bande, #/live, #r=, #p=, #room=)
   * ------------------------------------------------------------------ */
  let current = '';
  function showScreen(id) {
    $$('.screen').forEach((el) => el.classList.toggle('active', el.id === 'scr-' + id));
    const tb = $('#topbar');
    tb.classList.toggle('solid', id !== 'home');
    $('#homeLink').style.visibility = id === 'home' ? 'hidden' : 'visible';
    $('#bandLink').hidden = id === 'band' || id === 'quiz' || id === 'home';
    if (current !== id) { window.scrollTo(0, 0); }
    current = id;
  }
  function go(path) {
    if (location.hash === path || (path === '#/' && !location.hash)) route();
    else location.hash = path;
  }
  const isAdult = () => !!Store.get('adult', false);
  let pending = null; // route demandée avant la confirmation 18+

  function route() {
    if (!D) { $('#errorMsg').textContent = 'Les questions n\'ont pas pu être chargées (window.POP_DATA manquant ou invalide).'; showScreen('error'); return; }
    const hash = location.hash.replace(/^#/, '');
    const isShare = /^(r|p)=/.test(hash), isRoom = /^room=/.test(hash);
    if (hash && hash !== '/' && !isAdult()) { pending = '#' + hash; Home.render(isShare ? 'share' : isRoom ? 'room' : null); showScreen('home'); return; }
    if (isShare) { ProfileView.render(hash); showScreen('profile'); return; }
    if (isRoom) { Live.openFromHash(hash.slice(5)); showScreen('live'); return; }
    switch (hash) {
      case '/quiz': Quiz.enter(); showScreen('quiz'); break;
      case '/resultat': {
        const me = Profiles.me();
        if (!me) { go('#/'); return; }
        Result.render(me); showScreen('result'); break;
      }
      case '/bande': Band.render(); showScreen('band'); break;
      case '/live': Live.render(true); showScreen('live'); break;
      default: Home.render(); showScreen('home');
    }
  }

  /* ------------------------------------------------------------------ *
   * Accueil
   * ------------------------------------------------------------------ */
  const Home = {
    init() {
      const chk = $('#adultChk'), name = $('#nameInput');
      chk.checked = isAdult();
      name.value = cleanName(Store.get('name', ''));
      chk.addEventListener('change', () => {
        Store.set('adult', chk.checked);
        Home.sync();
        if (chk.checked) { buzz(10); Sound.play('pop'); if (pending) { const p = pending; pending = null; setTimeout(() => go(p), 250); } }
      });
      name.addEventListener('input', () => { const v = cleanName(name.value); Store.set('name', v); });
      name.addEventListener('change', () => { const v = cleanName(name.value); name.value = v; Profiles.renameMe(v); });
      name.addEventListener('keydown', (e) => { if (e.key === 'Enter') { name.blur(); if (isAdult()) $('#soloBtn').click(); } });
      $('#soloBtn').addEventListener('click', () => {
        if (!Home.guard()) return;
        if (Quiz.hasProgress() && !confirm('Recommencer une nouvelle partie ? Ta partie en cours sera effacée.')) return;
        Quiz.reset(); go('#/quiz');
      });
      $('#resumeBtn').addEventListener('click', () => { if (Home.guard()) go('#/quiz'); });
      $('#liveBtn').addEventListener('click', () => { if (Home.guard()) go('#/live'); });
      $('#bandBtn').addEventListener('click', () => { if (Home.guard()) go('#/bande'); });
      $('#myResultBtn').addEventListener('click', () => { if (Home.guard()) go('#/resultat'); });
    },
    guard() {
      if (!isAdult()) { toast('Coche d\'abord la case 18+ 🔞', 'err'); $('#adultChk').focus(); return false; }
      Profiles.renameMe(Home.name());
      return true;
    },
    name() { return cleanName($('#nameInput').value) || cleanName(Store.get('name', '')); },
    sync() {
      const ok = isAdult();
      ['#soloBtn', '#liveBtn', '#bandBtn', '#resumeBtn', '#myResultBtn'].forEach((id) => $(id).setAttribute('aria-disabled', ok ? 'false' : 'true'));
      $('#adultHint').hidden = ok;
    },
    render(reason) {
      Home.sync();
      const prog = Quiz.hasProgress();
      $('#resumeBtn').hidden = !prog;
      if (prog) $('#resumeSub').textContent = 'Question ' + (Quiz.savedCount() + 1) + ' · on reprend où tu t\'étais arrêté·e';
      $('#soloBtn').lastChild.textContent = prog ? 'Nouvelle partie solo' : 'Jouer en solo';
      const me = Profiles.me();
      $('#myResultBtn').hidden = !me;
      const nf = Profiles.friendCodes().length;
      $('#bandCount').textContent = nf ? '· ' + plural(nf, 'pote', 'potes') : '';
      if (Live.active()) { $('#liveBtn').lastChild.textContent = 'Retour à la room ' + Live.code(); }
      else $('#liveBtn').lastChild.textContent = 'Jouer en live avec la bande';
      if (reason === 'share') toast('Un·e pote t\'a envoyé son profil 👀 Confirme que tu as 18 ans pour le voir.', '', 5000);
      if (reason === 'room') toast('On t\'invite dans une room live 📡 Confirme que tu as 18 ans pour entrer.', '', 5000);
    }
  };

  /* ------------------------------------------------------------------ *
   * Carte question (partagée solo / live) + swipe
   * ------------------------------------------------------------------ */
  function questionCard(i, extra) {
    const q = D.qs[i], c = D.cats[q.c];
    return h('article', { class: 'qcard enter', 'aria-labelledby': 'qtext-' + i },
      h('span', { class: 'stamp yes', 'aria-hidden': 'true' }, 'OUI'),
      h('span', { class: 'stamp no', 'aria-hidden': 'true' }, 'NON'),
      h('div', { style: 'display:flex;gap:8px;flex-wrap:wrap' },
        h('span', { class: 'chip' }, h('span', { class: 'em', 'aria-hidden': 'true' }, c.emoji), c.label),
        D.gateIdx[i] >= 0 ? h('span', { class: 'chip', style: 'border-color:rgba(220,255,58,.5);color:var(--acid);font-size:12.5px' }, '🔓 Débloquée') : null),
      h('p', { class: 'qtext', id: 'qtext-' + i }, q.q),
      extra || h('div', { class: 'qhint', 'aria-hidden': 'true' }, h('span', null, '← Non'), h('span', null, 'Oui →')));
  }
  /** Swipe : la carte suit le doigt, s'envole au-delà du seuil. onCommit(true=OUI). */
  function attachSwipe(card, onCommit) {
    let sx = 0, sy = 0, dx = 0, t0 = 0, active = false, id = null;
    const yes = $('.stamp.yes', card), no = $('.stamp.no', card);
    const setT = (x, y) => {
      card.style.transform = 'translate(' + x + 'px,' + y * 0.15 + 'px) rotate(' + x / 16 + 'deg)';
      yes.style.opacity = clamp(x / 110, 0, 1); no.style.opacity = clamp(-x / 110, 0, 1);
    };
    card.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || card.dataset.locked) return;
      active = true; id = e.pointerId; sx = e.clientX; sy = e.clientY; dx = 0; t0 = performance.now();
      card.style.transition = 'none'; card.classList.remove('enter', 'back-in');
    });
    card.addEventListener('pointermove', (e) => {
      if (!active || e.pointerId !== id) return;
      dx = e.clientX - sx;
      const dy = e.clientY - sy;
      if (Math.abs(dx) > 8 && !card.hasPointerCapture(id)) { try { card.setPointerCapture(id); } catch (err) { /* ignore */ } }
      setT(dx, dy);
    });
    const end = (e) => {
      if (!active || e.pointerId !== id) return;
      active = false;
      const v = Math.abs(dx) / Math.max(1, performance.now() - t0);
      if (Math.abs(dx) > 100 || (Math.abs(dx) > 45 && v > 0.55)) { onCommit(dx > 0, true); }
      else {
        card.style.transition = 'transform .35s cubic-bezier(.34,1.56,.64,1)';
        card.style.transform = ''; yes.style.opacity = 0; no.style.opacity = 0;
      }
    };
    card.addEventListener('pointerup', end);
    card.addEventListener('pointercancel', (e) => { dx = 0; end(e); });
  }
  function flyOut(card, yes) {
    if (!card) return;
    card.dataset.locked = '1';
    card.classList.remove('enter', 'back-in');
    if (reduceMotion()) { card.remove(); return; }
    const dir = yes ? 1 : -1;
    const st = $(yes ? '.stamp.yes' : '.stamp.no', card); if (st) st.style.opacity = 1;
    card.style.transition = 'transform .42s cubic-bezier(.45,.05,.7,.4), opacity .42s ease-in';
    card.style.transform = 'translate(' + dir * 135 + '%, -6%) rotate(' + dir * 24 + 'deg)';
    card.style.opacity = '0';
    card.style.pointerEvents = 'none';
    setTimeout(() => card.remove(), 450);
  }
  function showQuip(text) {
    $$('.quip').forEach((q) => q.remove());
    const el = h('div', { class: 'quip', role: 'status' }, text);
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2700);
  }

  /* ------------------------------------------------------------------ *
   * Quiz solo
   * ------------------------------------------------------------------ */
  const Quiz = (function () {
    let hist = []; // [[index, 0|1], …] dans l'ordre où les questions ont été posées
    let busy = false;
    function answers() { const a = Engine.blank(); hist.forEach(([i, v]) => { a[i] = v; }); return a; }
    function cur() { const last = hist.length ? hist[hist.length - 1][0] : -1; return Engine.next(last + 1, answers()); }
    function save() { Store.set('progress', { v: D.version, n: D.n, h: hist.map(([i, v]) => [D.qs[i].id, v]) }); }
    /** Recharge en rejouant la séquence (ignore tout ce qui ne colle plus aux données). */
    function load() {
      hist = [];
      const p = Store.get('progress', null);
      if (!p || p.v !== D.version || !Array.isArray(p.h)) return;
      for (const e of p.h) {
        if (!Array.isArray(e) || !D.qIdx.has(e[0])) break;
        const i = D.qIdx.get(e[0]);
        if (i !== cur()) break;
        hist.push([i, e[1] ? 1 : 0]);
      }
    }
    function hasProgress() { load(); return hist.length > 0 && cur() !== -1; }
    function reset() { hist = []; Store.del('progress'); }

    function renderCard(mode) {
      const stage = $('#stage');
      const i = cur();
      if (i === -1) { finish(); return; }
      $$('.qcard', stage).forEach((c) => { if (!c.dataset.locked) c.remove(); });
      if (!$('.ghost-card', stage)) stage.appendChild(h('div', { class: 'ghost-card', 'aria-hidden': 'true' }));
      const card = questionCard(i);
      if (mode === 'back') card.classList.replace('enter', 'back-in');
      stage.appendChild(card);
      attachSwipe(card, (yes) => answer(yes, true));
      // Méta + progression
      const a = answers();
      const done = hist.length, left = Engine.remaining(i, a);
      const pct = Math.round((100 * done) / (done + left));
      const bar = $('#quizProgress');
      bar.firstElementChild.style.width = pct + '%';
      bar.setAttribute('aria-valuenow', String(pct));
      $('#quizCount').textContent = 'Question ' + (done + 1);
      $('#quizLeft').textContent = left > 1 ? 'encore ' + (left - 1) + ' max' : 'dernière !';
      const yes = hist.reduce((s2, e) => s2 + e[1], 0);
      $('#quizPurity').textContent = done ? 'Pureté provisoire ' + fmtPct((100 * (D.n - yes)) / D.n, 0) : '';
      $('#quizBack').disabled = done === 0;
      announce('Question ' + (done + 1) + ', ' + D.cats[D.qs[i].c].label + ' : ' + D.qs[i].q);
    }
    function answer(yes, fromSwipe) {
      if (busy || current !== 'quiz') return;
      const i = cur();
      if (i === -1) return;
      busy = true;
      hist.push([i, yes ? 1 : 0]);
      save();
      buzz(yes ? 18 : 10);
      Sound.play(yes ? 'yes' : 'no');
      const btn = $(yes ? '#yesBtn' : '#noBtn');
      btn.classList.add('pressed'); setTimeout(() => btn.classList.remove('pressed'), 140);
      if (yes && D.qs[i].quip) showQuip(D.qs[i].quip);
      flyOut($('#stage .qcard:not([data-locked])'), yes);
      if (reduceMotion()) { busy = false; renderCard(); return; }
      setTimeout(() => { busy = false; renderCard(); }, fromSwipe ? 120 : 170);
    }
    function back() {
      if (busy || !hist.length) return;
      hist.pop(); save();
      Sound.play('pop');
      renderCard('back');
    }
    function finish() {
      const bits = Engine.finalize(answers());
      Profiles.setMe(bits, Home.name() || 'Anonyme');
      reset();
      Result.fresh = true;
      go('#/resultat');
    }
    function enter() { load(); renderCard(); }
    function init() {
      $('#yesBtn').addEventListener('click', () => answer(true));
      $('#noBtn').addEventListener('click', () => answer(false));
      $('#quizBack').addEventListener('click', back);
      $('#quizQuit').addEventListener('click', () => { toast('Partie sauvegardée, reprends quand tu veux 💾'); go('#/'); });
      if (!window.matchMedia('(hover: hover)').matches) $('#kbdHint').textContent = 'Glisse la carte ← non · oui →';
      else $('#kbdHint').innerHTML = 'Clavier : <kbd>N</kbd>/<kbd>←</kbd> non · <kbd>O</kbd>/<kbd>→</kbd> oui · <kbd>⌫</kbd> retour';
    }
    function key(e) {
      const k = e.key.toLowerCase();
      if (k === 'o' || k === 'arrowright') { e.preventDefault(); answer(true); }
      else if (k === 'n' || k === 'arrowleft') { e.preventDefault(); answer(false); }
      else if (k === 'backspace') { e.preventDefault(); back(); }
    }
    /** Depuis le live : reprendre en solo là où la room s'est arrêtée. */
    function fromAnswers(ans, upTo) {
      hist = [];
      for (let i = 0; i < Math.min(upTo, D.n); i++) if (Engine.eligible(i, answers())) hist.push([i, ans[i] === 1 ? 1 : 0]);
      save();
    }
    return { init, enter, key, reset, hasProgress, savedCount: () => hist.length, fromAnswers, _answer: answer, _back: back, _hist: () => hist.slice() };
  })();

  /* ------------------------------------------------------------------ *
   * Rendu d'un profil (le mien ou celui d'un pote)
   * ------------------------------------------------------------------ */
  function profileBlocks(p, opts) {
    const o = opts || {};
    const tier = Score.tier(p.purity);
    const arch = Score.archetype(p);
    const scoreEl = h('div', { class: 'score' + (p.purity < 50 ? ' impure' : ''), 'aria-hidden': 'true' }, '0');
    const out = [];
    out.push(h('div', { class: 'hero' },
      h('p', { class: 'kicker', style: 'margin:6px 0 0' }, o.kicker || 'Résultat'),
      h('p', { class: 'profile-name', style: 'margin:6px 0 0' }, p.name),
      scoreEl,
      h('div', { class: 'score-label' }, 'de pureté'),
      h('p', { class: 'sr-only' }, p.name + ' : ' + fmtPct(p.purity) + ' de pureté. ' + tier.title),
      h('h2', { class: 'tier-title' }, tier.title),
      h('p', { class: 'tier-text' }, tier.text)));
    const fmtScore = (v) => (Math.round(v * 10) / 10).toFixed(1).replace('.', ',');
    const setScore = (v) => { scoreEl.textContent = ''; scoreEl.append(fmtScore(v), h('small', null, '%')); };
    setScore(0);
    if (reduceMotion()) setScore(p.purity);
    else setTimeout(() => FX.counter({ set textContent(v) { setScore(v); } }, p.purity, 1500, (v) => v), 250);

    out.push(h('div', { class: 'card arch', style: 'margin-top:22px' },
      h('div', { class: 'arch-emoji', 'aria-hidden': 'true' }, arch.emoji || '🎲'),
      h('div', null, h('p', { class: 'kicker', style: 'margin:0' }, 'Archétype'), h('h3', null, arch.name), h('p', null, arch.desc || ''))));

    const series = [{ name: p.name, color: o.me ? '#ff2fb9' : '#22e8ff', values: p.catImp }];
    if (o.compare) series.push({ name: o.compare.name + ' (toi)', color: '#dcff3a', values: o.compare.catImp });
    const radarCard = h('div', { class: 'card' },
      h('div', { class: 'card-title' }, h('h3', null, 'Radar de la débauche'), h('span', { class: 'small muted' }, 'impureté par catégorie')),
      h('div', { class: 'radar-wrap' }, radar(series, { label: 'Radar d\'impureté de ' + p.name })),
      series.length > 1 ? legend(series) : null,
      h('p', { class: 'small muted center', style: 'margin:10px 0 0' }, 'Centre = 0 % (pur·e) · bord = 100 % (tout coché). Plus la forme est grande, moins c\'est pur.'));
    const bars = h('div', { class: 'bars' }, D.cats.map((c, i) => {
      const fill = h('i');
      setTimeout(() => { fill.style.width = p.catImp[i] + '%'; }, 300 + i * 90);
      return h('div', { class: 'bar-row' },
        h('span', { class: 'nm' }, h('span', { 'aria-hidden': 'true' }, c.emoji), c.label),
        h('span', { class: 'bar', role: 'img', 'aria-label': c.label + ' : ' + fmtPct(p.catImp[i], 0) + ' d\'impureté' }, fill),
        h('span', { class: 'pc' }, fmtPct(p.catImp[i], 0)));
    }));
    const barsCard = h('div', { class: 'card' }, h('div', { class: 'card-title' }, h('h3', null, 'Par catégorie'), h('span', { class: 'small muted' }, '% de OUI')), bars);
    out.push(h('div', { class: 'grid2', style: 'margin-top:14px' }, radarCard, barsCard));

    const earned = Score.badges(p);
    out.push(h('div', { class: 'card', style: 'margin-top:14px' },
      h('div', { class: 'card-title' }, h('h3', null, 'Badges'), h('span', { class: 'small muted' }, earned.length + ' / ' + D.badges.length)),
      earned.length
        ? h('div', { class: 'badges' }, earned.map((b, k) => h('div', { class: 'badge', style: 'animation-delay:' + (0.6 + k * 0.09) + 's' }, h('span', { class: 'em', 'aria-hidden': 'true' }, b.emoji), h('div', null, h('b', null, b.name), h('span', null, b.desc || '')))))
        : h('p', { class: 'muted small', style: 'margin:0' }, p.kind === 'score' ? 'Profil discret : seuls les badges de catégorie sont visibles.' : 'Aucun badge… pour l\'instant 😇')));

    if (p.kind === 'full') {
      const yesIdx = [];
      for (let i = 0; i < D.n; i++) if (p.bits[i]) yesIdx.push(i);
      const det = h('details', { class: 'card yeslist', style: 'margin-top:14px' },
        h('summary', null, (o.me ? 'Voir mes réponses' : 'Voir ses réponses') + ' (' + plural(yesIdx.length, 'oui', 'oui') + ')'));
      if (!yesIdx.length) det.appendChild(h('p', { class: 'muted' }, 'Aucun OUI. Respect. 😇'));
      D.cats.forEach((c, ci) => {
        const list = yesIdx.filter((i) => D.qs[i].c === ci);
        if (!list.length) return;
        det.appendChild(h('div', { class: 'yes-cat' }, h('h4', null, c.emoji + ' ' + c.label + ' · ' + list.length), h('ul', null, list.map((i) => h('li', null, D.qs[i].q)))));
      });
      out.push(det);
    }
    return { nodes: out, arch, tier };
  }

  /* ------------------------------------------------------------------ *
   * Écran résultat (le mien)
   * ------------------------------------------------------------------ */
  const Result = {
    fresh: false,
    shareMode: Session.get('shareMode', 'full'),
    render(me) {
      const root = $('#resultRoot');
      root.textContent = '';
      const { nodes } = profileBlocks(me, { me: true, kicker: 'Ton résultat' });
      nodes.forEach((n) => root.appendChild(n));
      root.appendChild(Result.shareCard(me));
      root.appendChild(h('div', { class: 'btn-row', style: 'margin-top:14px' },
        h('button', { class: 'btn', type: 'button', onclick: () => go('#/bande') }, h('span', { class: 'em', 'aria-hidden': 'true' }, '👯'), 'Ma bande'),
        h('button', { class: 'btn', type: 'button', onclick: () => { if (!Quiz.hasProgress() || confirm('Effacer la partie en cours et rejouer ?')) { Quiz.reset(); go('#/quiz'); } } }, h('span', { class: 'em', 'aria-hidden': 'true' }, '🔁'), 'Rejouer')));
      if (Result.fresh) {
        Result.fresh = false;
        setTimeout(() => { FX.flash(); FX.confetti(me.purity < 50 ? 190 : 120); Sound.play('win'); buzz(30); }, 350);
        announce('Résultat : ' + fmtPct(me.purity) + ' de pureté. ' + Score.tier(me.purity).title);
      }
    },
    shareCard(me) {
      const linkBox = h('div', { class: 'linkbox' });
      const qrSlot = h('div');
      const optFull = h('button', { class: 'opt', type: 'button', 'aria-pressed': 'false' }, h('b', null, '🔓 Complet'), h('span', null, 'Score + toutes tes réponses : idéal pour les stats de bande.'));
      const optDisc = h('button', { class: 'opt', type: 'button', 'aria-pressed': 'false' }, h('b', null, '🤫 Discret'), h('span', null, 'Juste les scores, aucune réponse détaillée.'));
      const url = () => (Result.shareMode === 'score' ? scoreLink(me) : fullLink(me));
      const sync = () => {
        optFull.setAttribute('aria-pressed', String(Result.shareMode !== 'score'));
        optDisc.setAttribute('aria-pressed', String(Result.shareMode === 'score'));
        linkBox.textContent = url();
        qrSlot.textContent = '';
      };
      optFull.onclick = () => { Result.shareMode = 'full'; Session.set('shareMode', 'full'); sync(); };
      optDisc.onclick = () => { Result.shareMode = 'score'; Session.set('shareMode', 'score'); sync(); };
      sync();
      const canShare = !!navigator.share;
      return h('div', { class: 'card', style: 'margin-top:14px' },
        h('div', { class: 'card-title' }, h('h3', null, 'Partage ton score'), h('span', { class: 'small muted' }, 'sans serveur')),
        h('div', { class: 'share-opts' }, optFull, optDisc),
        linkBox,
        h('div', { class: 'btn-row' },
          h('button', { class: 'btn btn-primary', type: 'button', onclick: () => shareOrCopy(url(), 'Pur ou Pas', 'Je suis pur·e à ' + fmtPct(me.purity) + ' 😇😈 Et toi ?') }, h('span', { class: 'em', 'aria-hidden': 'true' }, canShare ? '📤' : '🔗'), canShare ? 'Partager' : 'Copier le lien'),
          canShare ? h('button', { class: 'btn', type: 'button', onclick: async () => toast((await copyText(url())) ? 'Lien copié ✨' : 'Copie impossible', 'ok') }, '📋 Copier') : null,
          h('button', { class: 'btn', type: 'button', onclick: () => { modal('QR code de ton profil', h('div', null, qrBlock(url()), h('p', { class: 'small muted center' }, Result.shareMode === 'score' ? 'Lien discret (scores uniquement)' : 'Lien complet (avec réponses)'))); } }, '🔳 QR code')),
        qrSlot);
    }
  };

  /* ------------------------------------------------------------------ *
   * Profil reçu via lien (#r= / #p=)
   * ------------------------------------------------------------------ */
  const ProfileView = {
    render(hash) {
      const root = $('#profileRoot');
      root.textContent = '';
      const r = Codec.decode(hash);
      if (!r.ok) {
        root.appendChild(h('div', { class: 'card center', style: 'margin-top:30px' },
          h('p', { style: 'font-size:48px;margin:0' }, '🧐'), h('h2', null, 'Lien illisible'), h('p', { class: 'muted' }, r.error),
          h('div', { class: 'btn-row', style: 'margin-top:16px' }, h('button', { class: 'btn btn-primary', type: 'button', onclick: () => go('#/') }, 'Faire le test'), h('button', { class: 'btn', type: 'button', onclick: () => go('#/bande') }, 'Ma bande'))));
        return;
      }
      const p = r.profile;
      const me = Profiles.me();
      const isMe = me && (me.code === p.code || scoreCode(me) === p.code);
      const { nodes } = profileBlocks(p, { kicker: isMe ? 'C\'est ton profil' : 'Profil de ' + p.name + (p.kind === 'score' ? ' · discret' : ''), compare: !isMe ? me : null });
      nodes.forEach((n) => root.appendChild(n));
      const addBtn = h('button', { class: 'btn btn-primary', type: 'button' }, h('span', { class: 'em', 'aria-hidden': 'true' }, '➕'), 'Ajouter à ma bande');
      addBtn.onclick = () => {
        const res = Profiles.add(p);
        const msgs = { added: p.name + ' rejoint ta bande 🎉', updated: 'Profil de ' + p.name + ' mis à jour ✨', dup: p.name + ' est déjà dans ta bande', me: 'C\'est toi ça 😏' };
        toast(msgs[res.status], res.status === 'dup' || res.status === 'me' ? '' : 'ok');
        if (res.status === 'added' || res.status === 'updated') { Sound.play('pop'); buzz(15); }
        addBtn.replaceWith(h('button', { class: 'btn btn-primary', type: 'button', onclick: () => go('#/bande') }, h('span', { class: 'em', 'aria-hidden': 'true' }, '👯'), 'Voir ma bande'));
      };
      const cmpBtn = h('button', { class: 'btn btn-cyan', type: 'button', onclick: () => {
        if (!me) { toast('Fais d\'abord le test pour te comparer 😉'); go('#/'); return; }
        Profiles.add(p);
        Store.set('bandSel', [me.code, p.code]);
        go('#/bande');
      } }, h('span', { class: 'em', 'aria-hidden': 'true' }, '⚖️'), 'Comparer avec moi');
      root.appendChild(h('div', { class: 'card stack', style: 'margin-top:14px' },
        isMe ? h('p', { class: 'muted', style: 'margin:0' }, 'Ce lien, c\'est le tien. Envoie-le à ta bande !') : h('div', { class: 'btn-row' }, addBtn, cmpBtn),
        !me ? h('button', { class: 'btn', type: 'button', onclick: () => go('#/') }, h('span', { class: 'em', 'aria-hidden': 'true' }, '🎯'), 'Faire le test moi aussi') : null));
    }
  };

  /* ------------------------------------------------------------------ *
   * Ma bande : classement, radar superposé, stats fun
   * ------------------------------------------------------------------ */
  const Band = (function () {
    const COLORS = ['#ff2fb9', '#22e8ff', '#dcff3a', '#a173ff'];
    /** Similarité 0-100 : Jaccard sur les OUI si les deux profils sont complets, sinon distance des catégories. */
    function similarity(a, b) {
      if (a.kind === 'full' && b.kind === 'full') {
        let inter = 0, uni = 0;
        for (let i = 0; i < D.n; i++) { if (a.bits[i] || b.bits[i]) uni++; if (a.bits[i] && b.bits[i]) inter++; }
        return uni ? (100 * inter) / uni : 100;
      }
      const diff = a.catImp.reduce((s2, v, i) => s2 + Math.abs(v - b.catImp[i]), 0) / a.catImp.length;
      return 100 - diff;
    }
    const who = (p) => (p.me ? 'Toi' : p.name);
    function stats(all) {
      const out = [];
      const full = all.filter((p) => p.kind === 'full');
      const seed = hashStr(all.map((p) => p.code).join('|'));
      const pickOrder = (arr, scoreFn) => arr.map((x, k) => ({ x, s: scoreFn(x) + ((hashStr(seed + ':' + k) % 1000) / 1000) * 0.9 })).sort((a, b) => b.s - a.s).map((o) => o.x);
      if (all.length >= 2) {
        const pairs = [];
        for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) pairs.push({ a: all[i], b: all[j], sim: similarity(all[i], all[j]) });
        pairs.sort((x, y) => y.sim - x.sim);
        const best = pairs[0];
        out.push(h('div', { class: 'stat' }, h('div', { class: 'k' }, '💞 Âme sœur de débauche'), h('div', { class: 'v' }, who(best.a) + ' & ' + who(best.b) + ' — ', h('em', null, fmtPct(best.sim, 0)), ' de compatibilité')));
        if (pairs.length > 1) {
          const worst = pairs[pairs.length - 1];
          out.push(h('div', { class: 'stat', style: 'animation-delay:.08s' }, h('div', { class: 'k' }, '🧲 Les opposés'), h('div', { class: 'v' }, who(worst.a) + ' & ' + who(worst.b) + ' — ', h('em', null, fmtPct(worst.sim, 0)), ' seulement')));
        }
      }
      if (full.length >= 2) {
        // OUI en commun (paires impliquant « moi » si présent, sinon toutes)
        const me = full.find((p) => p.me);
        const prs = [];
        for (let i = 0; i < full.length; i++) for (let j = i + 1; j < full.length; j++) {
          if (me && full[i] !== me && full[j] !== me) continue;
          let c = 0; for (let k = 0; k < D.n; k++) if (full[i].bits[k] && full[j].bits[k]) c++;
          prs.push({ a: full[i], b: full[j], c });
        }
        prs.sort((x, y) => y.c - x.c);
        out.push(h('div', { class: 'stat', style: 'animation-delay:.16s' }, h('div', { class: 'k' }, '🤝 Oui en commun'),
          h('ul', null, prs.slice(0, 5).map((p) => h('li', null, who(p.a) + ' & ' + who(p.b) + ' : ' + plural(p.c, 'oui', 'oui') + ' en commun')))));
        // Le/la seul·e à avoir…
        const solo = [];
        for (let k = 0; k < D.n; k++) {
          const ys = full.filter((p) => p.bits[k]);
          if (ys.length === 1) solo.push({ k, p: ys[0] });
        }
        if (solo.length) {
          const picked = pickOrder(solo, (o) => D.depth[o.k]).slice(0, 4);
          out.push(h('div', { class: 'stat', style: 'animation-delay:.24s' }, h('div', { class: 'k' }, '🦄 Le seul de la bande à avoir…'),
            h('ul', null, picked.map((o) => h('li', null, h('b', { style: 'color:var(--ink)' }, who(o.p)), ' — ' + D.qs[o.k].q)))));
        }
        // Personne n'a osé…
        const none = [];
        for (let k = 0; k < D.n; k++) if (!full.some((p) => p.bits[k])) none.push(k);
        if (none.length) {
          const picked = pickOrder(none, (k) => (full.some((p) => Engine.eligible(k, p.bits)) ? 3 : 0) + D.depth[k]).slice(0, 3);
          out.push(h('div', { class: 'stat', style: 'animation-delay:.32s' }, h('div', { class: 'k' }, '🙈 Personne n\'a osé…'),
            h('ul', null, picked.map((k) => h('li', null, D.qs[k].q)))));
        }
      } else if (all.length >= 2) {
        out.push(h('div', { class: 'stat' }, h('div', { class: 'k' }, '💡 Astuce'), h('div', { class: 'v', style: 'font-size:14px;font-weight:600' }, 'Les stats croustillantes (« le seul à avoir… ») apparaissent avec au moins 2 profils complets (liens #r=).')));
      }
      return out;
    }
    function addForm() {
      const input = h('input', { class: 'input', id: 'bandAdd', placeholder: 'Colle un lien ou un code…', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': 'Lien ou code de profil' });
      const submit = () => {
        const r = Codec.decode(input.value);
        if (!r.ok) { toast(r.error, 'err', 4000); input.focus(); return; }
        const res = Profiles.add(r.profile);
        const msgs = { added: r.profile.name + ' rejoint ta bande 🎉', updated: 'Profil de ' + r.profile.name + ' mis à jour ✨', dup: r.profile.name + ' est déjà dans ta bande', me: 'C\'est ton propre profil 😏' };
        toast(msgs[res.status], res.status === 'added' || res.status === 'updated' ? 'ok' : '');
        if (res.status === 'added' || res.status === 'updated') { Sound.play('pop'); render(); }
      };
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
      return h('div', { class: 'card' },
        h('label', { class: 'label', for: 'bandAdd' }, 'Ajouter un·e pote (lien #r= / #p= ou code)'),
        h('div', { class: 'inline-form' }, input, h('button', { class: 'btn btn-primary btn-sm', type: 'button', onclick: submit, style: 'min-height:56px;padding:0 20px' }, 'Ajouter')),
        h('p', { class: 'small muted', style: 'margin:10px 0 0' }, 'Astuce : ouvrir directement le lien d\'un pote propose aussi « Ajouter à ma bande ».'));
    }
    function render() {
      const root = $('#bandRoot');
      root.textContent = '';
      const all = Profiles.all();
      const head = h('div', { class: 'section-title', style: 'margin-top:8px;justify-content:space-between;flex-wrap:wrap' },
        h('div', null, h('p', { class: 'kicker', style: 'margin:0' }, 'Comparaison sans serveur'), h('h2', null, 'Ma bande ', h('span', { class: 'glow-m' }, '· ' + all.length))),
        h('button', { class: 'btn btn-cyan btn-sm', type: 'button', onclick: () => go('#/live') }, '📡 Partie live'));
      root.appendChild(head);
      if (all.invalid) {
        root.appendChild(h('div', { class: 'alert', style: 'margin-bottom:14px' }, h('b', null, plural(all.invalid, 'profil masqué', 'profils masqués')), 'Ils viennent d\'une ancienne version du test. ',
          h('button', { class: 'link-btn', type: 'button', onclick: () => { Profiles.purgeInvalid(); render(); } }, 'Les supprimer')));
      }
      if (!all.length) {
        root.appendChild(h('div', { class: 'card empty' }, h('span', { class: 'em', 'aria-hidden': 'true' }, '👯'),
          h('p', null, 'Ta bande est vide. Fais le test, puis échange vos liens : tout reste sur vos téléphones.'),
          h('button', { class: 'btn btn-primary', type: 'button', style: 'max-width:320px;margin:10px auto 0', onclick: () => { Quiz.reset(); go('#/quiz'); } }, 'Faire le test')));
        root.appendChild(h('div', { class: 'spacer' }));
        root.appendChild(addForm());
        return;
      }
      const ranked = all.slice().sort((a, b) => b.purity - a.purity || a.name.localeCompare(b.name));
      // Colonne gauche : podium + classement
      const left = h('div', { class: 'card' });
      left.appendChild(h('div', { class: 'card-title' }, h('h3', null, 'Classement de pureté'), h('span', { class: 'small muted' }, 'du plus pur au plus impur')));
      if (ranked.length >= 2) {
        const pod = h('div', { class: 'podium', 'aria-hidden': 'true' });
        [1, 0, 2].forEach((r) => {
          const p = ranked[r];
          if (!p) { pod.appendChild(h('div')); return; }
          const a = Score.archetype(p);
          pod.appendChild(h('div', { class: 'pod p' + (r + 1) },
            h('span', { class: 'arch-mini' }, r === 0 ? '👑' : a.emoji), h('span', { class: 'who' }, who(p)),
            h('div', { class: 'col' }, h('span', { class: 'rk' }, String(r + 1)), h('span', { class: 'pct' }, fmtPct(p.purity)))));
        });
        left.appendChild(pod);
      }
      const list = h('ol', { class: 'ranklist' });
      ranked.forEach((p, k) => {
        const a = Score.archetype(p);
        const del = p.me ? h('span') : h('button', { class: 'del', type: 'button', 'aria-label': 'Retirer ' + p.name + ' de ma bande', onclick: () => {
          if (!confirm('Retirer ' + p.name + ' de ta bande ?')) return;
          Profiles.remove(p.code); toast(p.name + ' a quitté la bande 👋'); render();
        } }, '🗑');
        list.appendChild(h('li', { class: 'rank' + (p.me ? ' me' : ''), style: 'animation-delay:' + k * 0.05 + 's' },
          h('span', { class: 'n' }, k === ranked.length - 1 && ranked.length > 2 ? '😈' : String(k + 1)),
          h('span', { class: 'nm' }, h('b', null, p.name, p.me ? h('span', { class: 'tag me' }, 'moi') : null, p.kind === 'score' ? h('span', { class: 'tag' }, 'discret') : null), h('span', null, (a.emoji || '') + ' ' + a.name)),
          h('span', { class: 'pc', style: 'color:' + (p.purity >= 50 ? 'var(--cyan)' : 'var(--mag)') }, fmtPct(p.purity)),
          del));
      });
      left.appendChild(list);
      if (ranked.length > 2) left.appendChild(h('p', { class: 'small muted', style: 'margin:12px 0 0' }, '👑 ' + who(ranked[0]) + ' est le/la plus pur·e. 😈 ' + who(ranked[ranked.length - 1]) + ' ferme la marche (ou règne sur la nuit).'));

      // Colonne droite : radar superposé + stats
      const right = h('div', { class: 'stack' });
      if (all.length >= 2) {
        let sel = (Store.get('bandSel', []) || []).filter((c) => all.some((p) => p.code === c));
        if (sel.length < 2) sel = all.slice(0, Math.min(3, all.length)).map((p) => p.code);
        const radarSlot = h('div', { class: 'radar-wrap' });
        const legendSlot = h('div');
        const chips = h('div', { class: 'chips', role: 'group', 'aria-label': 'Profils à superposer (2 à 4)' });
        const draw = () => {
          const chosen = sel.map((c) => all.find((p) => p.code === c)).filter(Boolean);
          const series = chosen.map((p, k) => ({ name: who(p), color: COLORS[k], values: p.catImp }));
          radarSlot.textContent = ''; radarSlot.appendChild(radar(series, { delay: 50, label: 'Radars superposés' }));
          legendSlot.textContent = ''; legendSlot.appendChild(legend(series));
          $$('.pick', chips).forEach((b) => {
            const k = sel.indexOf(b.dataset.code);
            b.setAttribute('aria-pressed', String(k >= 0));
            b.style.color = k >= 0 ? COLORS[k] : '';
            b.firstChild.style.background = k >= 0 ? COLORS[k] : '';
          });
          Store.set('bandSel', sel);
        };
        all.forEach((p) => {
          const b = h('button', { class: 'pick', type: 'button', 'aria-pressed': 'false', 'data-code': p.code }, h('i'), who(p));
          b.onclick = () => {
            const k = sel.indexOf(p.code);
            if (k >= 0) { if (sel.length <= 1) return; sel.splice(k, 1); }
            else { sel.push(p.code); if (sel.length > 4) sel.shift(); }
            draw();
          };
          chips.appendChild(b);
        });
        right.appendChild(h('div', { class: 'card' }, h('div', { class: 'card-title' }, h('h3', null, 'Radars superposés'), h('span', { class: 'small muted' }, '2 à 4 profils')), chips, radarSlot, legendSlot,
          h('p', { class: 'small muted center', style: 'margin:8px 0 0' }, 'Impureté par catégorie : centre = pur·e, bord = 100 %.')));
        draw();
        const st = stats(all);
        if (st.length) right.appendChild(h('div', { class: 'card' }, h('div', { class: 'card-title' }, h('h3', null, 'Les stats qui fâchent'), h('span', { class: 'small muted' }, '🌶️')), h('div', { class: 'stats' }, st)));
      } else {
        right.appendChild(h('div', { class: 'card empty' }, h('span', { class: 'em', 'aria-hidden': 'true' }, '🫂'), h('p', { style: 'margin:0' }, 'Ajoute au moins un·e pote pour débloquer le radar superposé, l\'âme sœur de débauche et les stats qui fâchent.')));
      }
      right.appendChild(addForm());
      const me = Profiles.me();
      if (me) right.appendChild(h('div', { class: 'card' }, h('h3', { style: 'margin-bottom:10px' }, 'Ton lien à envoyer'), h('div', { class: 'btn-row' },
        h('button', { class: 'btn btn-sm', type: 'button', onclick: () => shareOrCopy(fullLink(me), 'Pur ou Pas', 'Mon profil Pur ou Pas 😈') }, '🔓 Lien complet'),
        h('button', { class: 'btn btn-sm', type: 'button', onclick: () => shareOrCopy(scoreLink(me), 'Pur ou Pas', 'Mon score Pur ou Pas 🤫') }, '🤫 Lien discret'))));
      root.appendChild(h('div', { class: 'band-grid' }, left, right));
    }
    return { render, similarity };
  })();

  /* ------------------------------------------------------------------ *
   * LIVE — parties synchronisées en pair-à-pair (WebRTC via PeerJS)
   *
   * Transport : une petite interface (host/join/send/onMessage) au-dessus de
   * PeerJS, pour isoler la logique de room. L'hôte fait autorité : il garde
   * les réponses de chacun, calcule les portes, révèle et diffuse les codes.
   *
   * Messages JSON typés :
   *   invité → hôte : hello{pid,name,v} answer{idx,yes,auto} react{emoji} ping pong bye
   *   hôte → invités : welcome{…état} lobby{players,mode} start q{idx,num} status{idx,done}
   *                    reveal{idx,yes,total,skipped,names} react{emoji,name} end results{list} error{code} ping pong
   * Tout message reçu est validé (types, bornes) ; les pseudos ne passent que par textContent.
   * ------------------------------------------------------------------ */
  const Live = (function () {
    const ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    const PREFIX = 'pur-ou-pas-';
    const EMOJIS = ['🔥', '😱', '😂'];
    const MAX_PLAYERS = 24;
    const HB = 4000, STALE = 13000;
    let S = null;      // état de session
    let lastKey = '';  // pour ne reconstruire la vue que si nécessaire
    const isPid = (v) => typeof v === 'string' && /^[a-z0-9]{6,16}$/.test(v);
    const isIdx = (v) => Number.isInteger(v) && v >= 0 && v < D.n;
    const isCode = (v) => typeof v === 'string' && v.length === 5 && [...v].every((ch) => ALPHA.includes(ch));
    const myPid = () => { let p = Session.get('pid', null); if (!isPid(p)) { p = randId(10); Session.set('pid', p); } return p; };

    /* ---------- Validation des messages ---------- */
    function vPlayers(list) {
      if (!Array.isArray(list) || list.length > 40) return null;
      const out = [];
      for (const p of list) {
        if (!p || !isPid(p.pid)) return null;
        out.push({ pid: p.pid, name: cleanName(p.name) || 'Anonyme', on: !!p.on, host: !!p.host, done: !!p.done });
      }
      return out;
    }
    function validate(m, fromHost) {
      if (!m || typeof m !== 'object' || Array.isArray(m) || typeof m.type !== 'string') return null;
      const t = m.type;
      if (t === 'ping' || t === 'pong' || t === 'start' || t === 'end' || t === 'bye') return { type: t };
      if (t === 'react') {
        if (!EMOJIS.includes(m.emoji)) return null;
        return fromHost ? { type: t, emoji: m.emoji, name: cleanName(m.name) || 'Quelqu\'un', pid: isPid(m.pid) ? m.pid : '' } : { type: t, emoji: m.emoji };
      }
      if (!fromHost) {
        if (t === 'hello') return isPid(m.pid) && typeof m.name === 'string' && m.name.length <= 80 && Number.isInteger(m.v) ? { type: t, pid: m.pid, name: cleanName(m.name) || 'Anonyme', v: m.v } : null;
        if (t === 'answer') return isIdx(m.idx) && typeof m.yes === 'boolean' ? { type: t, idx: m.idx, yes: m.yes, auto: !!m.auto } : null;
        return null;
      }
      const mode = m.mode === 'names' ? 'names' : 'anon';
      switch (t) {
        case 'welcome': {
          if (!isPid(m.pid) || !['lobby', 'question', 'reveal', 'end'].includes(m.phase)) return null;
          if (!(m.idx === -1 || isIdx(m.idx)) || !Number.isInteger(m.num) || m.num < 0 || m.num > D.n) return null;
          if (!Array.isArray(m.yes) || m.yes.length > D.n || !m.yes.every(isIdx)) return null;
          return { type: t, pid: m.pid, mode, phase: m.phase, idx: m.idx, num: m.num, yes: m.yes, cur: m.cur === 1 ? 1 : m.cur === 0 ? 0 : -1 };
        }
        case 'lobby': { const pl = vPlayers(m.players); return pl ? { type: t, players: pl, mode } : null; }
        case 'q': return isIdx(m.idx) && Number.isInteger(m.num) && m.num >= 1 && m.num <= D.n ? { type: t, idx: m.idx, num: m.num } : null;
        case 'status': return isIdx(m.idx) && Array.isArray(m.done) && m.done.length <= 40 && m.done.every(isPid) ? { type: t, idx: m.idx, done: m.done } : null;
        case 'reveal': {
          const ints = ['yes', 'total', 'skipped'].every((k) => Number.isInteger(m[k]) && m[k] >= 0 && m[k] <= 40);
          if (!isIdx(m.idx) || !ints || m.yes > m.total) return null;
          let names = null;
          if (Array.isArray(m.names)) { if (m.names.length > 40) return null; names = m.names.map((x) => cleanName(x) || 'Anonyme'); }
          return { type: t, idx: m.idx, yes: m.yes, total: m.total, skipped: m.skipped, names };
        }
        case 'results': {
          if (!Array.isArray(m.list) || m.list.length > 40) return null;
          const list = [];
          for (const r of m.list) {
            if (!r || !isPid(r.pid) || typeof r.code !== 'string' || r.code.length > 200) return null;
            const d = Codec.decode(r.code);
            if (d.ok && d.profile.kind === 'full') list.push({ pid: r.pid, profile: d.profile });
          }
          return { type: t, list };
        }
        case 'error': return { type: t, code: ['version', 'full', 'closed'].includes(m.code) ? m.code : 'closed' };
        default: return null;
      }
    }

    /* ---------- Transport PeerJS ---------- */
    const Transport = {
      async load() { await loadScript(PEER_URLS, () => typeof window.Peer === 'function'); },
      /** Ouvre un pair (id imposé pour l'hôte, aléatoire pour l'invité). */
      open(id) {
        return new Promise((resolve, reject) => {
          let peer;
          try { peer = id ? new window.Peer(id, Object.assign({ debug: 0 }, window.POP_PEER_CONFIG || {})) : new window.Peer(Object.assign({ debug: 0 }, window.POP_PEER_CONFIG || {})); }
          catch (e) { reject({ type: 'browser-incompatible' }); return; }
          const timer = setTimeout(() => { cleanup(); try { peer.destroy(); } catch (e) { /* */ } reject({ type: 'timeout' }); }, 15000);
          const onOpen = () => { cleanup(); resolve(peer); };
          const onErr = (e) => { cleanup(); try { peer.destroy(); } catch (x) { /* */ } reject(e || { type: 'unknown' }); };
          const cleanup = () => { clearTimeout(timer); peer.off('open', onOpen); peer.off('error', onErr); };
          peer.on('open', onOpen); peer.on('error', onErr);
        });
      },
      connect(peer, code) {
        return new Promise((resolve, reject) => {
          const conn = peer.connect(PREFIX + code, { reliable: true, serialization: 'json' });
          const timer = setTimeout(() => { done(); reject({ type: 'timeout' }); }, 12000);
          const onErr = (e) => { if (e && (e.type === 'peer-unavailable' || e.type === 'network' || e.type === 'server-error')) { done(); reject(e); } };
          const done = () => { clearTimeout(timer); peer.off('error', onErr); };
          peer.on('error', onErr);
          conn.on('open', () => { done(); resolve(conn); });
          conn.on('error', () => { done(); reject({ type: 'conn' }); });
        });
      },
      send(conn, msg) { try { if (conn && conn.open) conn.send(msg); } catch (e) { /* ignore */ } }
    };
    function errText(e) {
      const t = e && e.type;
      if (t === 'peer-unavailable') return 'Room introuvable. Vérifie le code (ou l\'hôte a fermé la room).';
      if (t === 'browser-incompatible') return 'Ton navigateur ne supporte pas le mode live (WebRTC).';
      if (t === 'script') return 'Impossible de charger le module live (connexion coupée ou CDN bloqué).';
      if (t === 'timeout') return 'La connexion prend trop de temps. Réseau d\'entreprise ou Wi-Fi capricieux ?';
      return 'Connexion impossible au serveur de mise en relation (réseau filtré, VPN ou hors ligne ?).';
    }

    /* ---------- Hôte ---------- */
    function hostPlayer(pid, name, isHost) { return { pid, name, host: !!isHost, on: true, ans: Engine.blank(), conn: null, lastSeen: Date.now(), lastReact: 0, msgCount: 0, msgWin: 0 }; }
    async function createRoom(name) {
      S = { role: 'host', phase: 'connecting', name, pid: myPid(), mode: 'anon', idx: -1, num: 0, players: new Map(), reveal: null, results: [], myAns: Engine.blank(), peer: null, code: '' };
      S.players.set(S.pid, hostPlayer(S.pid, name, true));
      S.myAns = S.players.get(S.pid).ans; // l'hôte joue : ses réponses = son entrée joueur
      render();
      try {
        await Transport.load().catch(() => { throw { type: 'script' }; });
        let peer = null, code = '';
        for (let k = 0; k < 6 && !peer; k++) {
          code = randId(5, ALPHA);
          try { peer = await Transport.open(PREFIX + code); }
          catch (e) { if (!e || e.type !== 'unavailable-id') throw e; }
        }
        if (!peer) throw { type: 'unavailable-id' };
        if (!S || S.role !== 'host') { peer.destroy(); return; }
        S.peer = peer; S.code = code; S.phase = 'lobby';
        peer.on('connection', (conn) => {
          conn.on('data', (d) => onHostData(conn, d));
          conn.on('close', () => onHostClose(conn));
          conn.on('error', () => onHostClose(conn));
        });
        peer.on('disconnected', () => { setTimeout(() => { try { if (S && S.peer === peer && !peer.destroyed) peer.reconnect(); } catch (e) { /* */ } }, 1500); });
        peer.on('error', (e) => { if (e && e.type !== 'peer-unavailable') console.info('[live] peer', e.type); });
        S.hb = setInterval(hostTick, HB);
        history.replaceState(null, '', '#/live');
        render(); Sound.play('pop');
      } catch (e) {
        fail(e);
      }
    }
    function hostBroadcast(msg, except) { S.players.forEach((p) => { if (p.conn && p.pid !== except) Transport.send(p.conn, msg); }); }
    function lobbyMsg() {
      return { type: 'lobby', mode: S.mode, players: [...S.players.values()].map((p) => ({ pid: p.pid, name: p.name, on: p.on, host: p.host, done: S.phase === 'question' && S.idx >= 0 && p.ans[S.idx] !== -1 })) };
    }
    function onHostData(conn, raw) {
      if (!S || S.role !== 'host') return;
      // anti-flood basique
      const now = Date.now();
      if (now - (conn._win || 0) > 1000) { conn._win = now; conn._cnt = 0; }
      if (++conn._cnt > 30) return;
      const m = validate(raw, false);
      if (!m) return;
      if (m.type === 'hello') {
        if (m.v !== D.version) { Transport.send(conn, { type: 'error', code: 'version' }); setTimeout(() => conn.close(), 300); return; }
        let p = S.players.get(m.pid);
        if (p && p.host) return; // usurpation de l'id hôte
        if (!p) {
          if (S.players.size >= MAX_PLAYERS) { Transport.send(conn, { type: 'error', code: 'full' }); setTimeout(() => conn.close(), 300); return; }
          p = hostPlayer(m.pid, m.name, false);
          S.players.set(m.pid, p);
          toast(m.name + ' a rejoint la room 👋');
        } else if (!p.on) toast(m.name + ' est de retour 🔌');
        if (p.conn && p.conn !== conn) { try { p.conn.close(); } catch (e) { /* */ } }
        p.conn = conn; p.on = true; p.name = m.name; p.lastSeen = now; conn._pid = m.pid;
        const yes = []; p.ans.forEach((v, i) => { if (v === 1) yes.push(i); });
        Transport.send(conn, { type: 'welcome', pid: p.pid, mode: S.mode, phase: S.phase === 'connecting' ? 'lobby' : S.phase, idx: S.idx, num: S.num, yes, cur: S.idx >= 0 ? p.ans[S.idx] : -1 });
        // si on arrive en pleine question et que la porte est fermée pour lui : NON auto
        if (S.phase === 'question' && S.idx >= 0 && p.ans[S.idx] === -1 && !Engine.eligible(S.idx, p.ans)) p.ans[S.idx] = 0;
        if (S.phase === 'reveal' && S.reveal) Transport.send(conn, Object.assign({ type: 'reveal' }, S.reveal));
        if (S.phase === 'end') Transport.send(conn, resultsMsg());
        hostBroadcast(lobbyMsg());
        render(); hostCheckAll();
        return;
      }
      const p = S.players.get(conn._pid);
      if (!p || p.conn !== conn) return;
      p.lastSeen = now;
      if (!p.on) { p.on = true; hostBroadcast(lobbyMsg()); render(); }
      if (m.type === 'ping') Transport.send(conn, { type: 'pong' });
      else if (m.type === 'answer') hostRecord(p, m.idx, m.yes);
      else if (m.type === 'react') {
        if (now - p.lastReact < 350) return;
        p.lastReact = now;
        const out = { type: 'react', emoji: m.emoji, name: p.name, pid: p.pid };
        hostBroadcast(out); floatReact(out.emoji, out.name);
      } else if (m.type === 'bye') { p.on = false; if (S.phase === 'lobby') S.players.delete(p.pid); hostBroadcast(lobbyMsg()); render(); hostCheckAll(); }
    }
    function onHostClose(conn) {
      if (!S || S.role !== 'host') return;
      const p = S.players.get(conn._pid);
      if (p && p.conn === conn) { p.on = false; p.conn = null; hostBroadcast(lobbyMsg()); render(); hostCheckAll(); }
    }
    function hostTick() {
      if (!S || S.role !== 'host') return;
      const now = Date.now();
      let changed = false;
      S.players.forEach((p) => {
        if (p.host) return;
        if (p.on && now - p.lastSeen > STALE) { p.on = false; changed = true; }
      });
      hostBroadcast({ type: 'ping' });
      if (changed) { hostBroadcast(lobbyMsg()); render(); hostCheckAll(); }
    }
    function hostRecord(p, idx, yes, noRender) {
      if (S.phase !== 'question' || idx !== S.idx) return;
      // l'hôte fait autorité sur les portes
      p.ans[idx] = yes && Engine.eligible(idx, p.ans) ? 1 : 0;
      hostBroadcast({ type: 'status', idx, done: [...S.players.values()].filter((x) => x.ans[idx] !== -1).map((x) => x.pid) });
      hostBroadcast(lobbyMsg());
      if (!noRender) render();
      hostCheckAll();
    }
    function hostCheckAll() {
      if (!S || S.role !== 'host' || S.phase !== 'question') return;
      const present = [...S.players.values()].filter((p) => p.on);
      if (present.length && present.every((p) => p.ans[S.idx] !== -1)) {
        clearTimeout(S.revealT);
        S.revealT = setTimeout(() => { if (S && S.phase === 'question') hostReveal(); }, 700);
      }
    }
    function hostStart() {
      if (!S || S.phase !== 'lobby') return;
      hostBroadcast({ type: 'start' });
      hostAdvance();
    }
    /** Question suivante : saute celles où AUCUN joueur présent n'est éligible. */
    function hostAdvance() {
      const list = [...S.players.values()];
      let i = S.idx + 1;
      for (; i < D.n; i++) {
        const present = list.filter((p) => p.on);
        if (present.some((p) => Engine.eligible(i, p.ans))) break;
        list.forEach((p) => { p.ans[i] = 0; }); // tout le monde exclu → NON automatique
      }
      if (i >= D.n) { hostEnd(); return; }
      S.idx = i; S.num++; S.phase = 'question'; S.reveal = null;
      list.forEach((p) => { if (!Engine.eligible(i, p.ans)) p.ans[i] = 0; });
      hostBroadcast({ type: 'q', idx: i, num: S.num });
      hostBroadcast(lobbyMsg());
      onQuestion(i);
      hostCheckAll();
    }
    function hostReveal() {
      if (!S || S.phase !== 'question') return;
      clearTimeout(S.revealT);
      const idx = S.idx;
      const list = [...S.players.values()];
      list.forEach((p) => { if (p.ans[idx] === -1) p.ans[idx] = 0; }); // absents / pas répondu → NON
      const counted = list.filter((p) => p.on || p.ans[idx] === 1);
      const yesP = counted.filter((p) => p.ans[idx] === 1);
      const skipped = counted.filter((p) => !Engine.eligible(idx, p.ans)).length;
      S.reveal = { idx, yes: yesP.length, total: counted.length, skipped, names: S.mode === 'names' ? yesP.map((p) => p.name) : null };
      S.phase = 'reveal';
      hostBroadcast(Object.assign({ type: 'reveal' }, S.reveal));
      onReveal();
    }
    function resultsMsg() {
      return { type: 'results', list: [...S.players.values()].map((p) => ({ pid: p.pid, code: Codec.encodeFull(p.name, Engine.finalize(p.ans)) })) };
    }
    function hostEnd() {
      S.phase = 'end'; S.idx = Math.max(S.idx, 0);
      hostBroadcast({ type: 'end' });
      const rm = resultsMsg();
      hostBroadcast(rm);
      onEnd();
      onResults(validate(rm, true));
    }
    function hostSetMode(mode) { S.mode = mode; hostBroadcast(lobbyMsg()); render(); }
    /** Réponse locale de l'hôte (il joue aussi). */
    function hostAnswerSelf(yes) { hostRecord(S.players.get(S.pid), S.idx, yes, true); setTimeout(() => render(), reduceMotion() ? 0 : 260); }

    /* ---------- Invité ---------- */
    async function joinRoom(code, name, silent) {
      if (S && S.role === 'guest' && S.code === code && S.phase !== 'error' && S.phase !== 'closed') { render(true); return; }
      leave(true);
      const saved = Session.get('guest', null);
      const myAns = Engine.blank();
      if (saved && saved.code === code && typeof saved.ans === 'string' && saved.ans.length === D.n) for (let i = 0; i < D.n; i++) myAns[i] = saved.ans[i] === '1' ? 1 : saved.ans[i] === '0' ? 0 : -1;
      S = { role: 'guest', phase: 'connecting', code, name, pid: myPid(), mode: 'anon', idx: -1, num: 0, players: [], done: [], reveal: null, results: [], myAns, peer: null, conn: null, retries: 0, lastHost: Date.now() };
      saveGuest();
      render();
      try {
        await Transport.load().catch(() => { throw { type: 'script' }; });
        await guestConnect();
        S.hb = setInterval(guestTick, HB);
      } catch (e) {
        fail(e);
      }
    }
    async function guestConnect() {
      if (!S.peer || S.peer.destroyed) S.peer = await Transport.open(null);
      else if (S.peer.disconnected) { try { S.peer.reconnect(); } catch (e) { /* */ } await sleep(800); }
      const conn = await Transport.connect(S.peer, S.code);
      if (!S || S.role !== 'guest') { conn.close(); return; }
      S.conn = conn; S.lastHost = Date.now(); S.retries = 0;
      conn.on('data', (d) => onGuestData(conn, d));
      conn.on('close', () => { if (S && S.conn === conn) guestLost(); });
      Transport.send(conn, { type: 'hello', pid: S.pid, name: S.name, v: D.version });
    }
    function saveGuest() { if (S && S.role === 'guest') Session.set('guest', { code: S.code, name: S.name, ans: Array.from(S.myAns, (v) => (v === 1 ? '1' : v === 0 ? '0' : '-')).join('') }); }
    function guestSend(msg) { Transport.send(S && S.conn, msg); }
    function guestTick() {
      if (!S || S.role !== 'guest') return;
      if (S.conn && S.conn.open) guestSend({ type: 'ping' });
      if (S.phase !== 'reconnecting' && S.phase !== 'closed' && S.phase !== 'error' && Date.now() - S.lastHost > STALE) guestLost();
    }
    async function guestLost() {
      if (!S || S.role !== 'guest' || S.phase === 'reconnecting' || S.phase === 'closed') return;
      S.prevPhase = S.phase === 'reconnecting' ? S.prevPhase : S.phase;
      S.phase = 'reconnecting'; S.conn = null; render();
      while (S && S.role === 'guest' && S.phase === 'reconnecting' && S.retries < 10) {
        S.retries++;
        await sleep(2500);
        if (!S || S.phase !== 'reconnecting') return;
        try { await guestConnect(); return; } catch (e) { /* nouvel essai */ }
      }
      if (S && S.phase === 'reconnecting') { S.phase = 'closed'; render(); }
    }
    function onGuestData(conn, raw) {
      if (!S || S.role !== 'guest' || conn !== S.conn) return;
      const m = validate(raw, true);
      if (!m) return;
      S.lastHost = Date.now();
      switch (m.type) {
        case 'ping': guestSend({ type: 'pong' }); break;
        case 'welcome': {
          S.mode = m.mode; S.num = m.num; S.idx = m.idx;
          m.yes.forEach((i) => { S.myAns[i] = 1; });
          // réponse envoyée pendant une coupure ? on la renvoie
          if (m.phase === 'question' && m.idx >= 0) {
            if (m.cur !== -1) S.myAns[m.idx] = m.cur;
            else if (S.myAns[m.idx] !== -1) guestSend({ type: 'answer', idx: m.idx, yes: S.myAns[m.idx] === 1 });
          }
          saveGuest();
          if (m.phase === 'question') { S.phase = 'question'; onQuestion(m.idx, true); }
          else if (m.phase === 'lobby') { S.phase = 'lobby'; render(); }
          else { S.phase = m.phase === 'end' ? 'end-wait' : 'reveal'; S.reveal = null; render(); }
          break;
        }
        case 'lobby': S.players = m.players; S.mode = m.mode; S.done = m.players.filter((p) => p.done).map((p) => p.pid); render(); break;
        case 'start': break;
        case 'q':
          // les questions sautées par tout le monde comptent NON
          for (let i = Math.max(0, S.idx + 1); i < m.idx; i++) if (S.myAns[i] === -1) S.myAns[i] = 0;
          S.idx = m.idx; S.num = m.num; S.phase = 'question'; S.reveal = null; S.done = [];
          onQuestion(m.idx);
          break;
        case 'status': if (m.idx === S.idx) { S.done = m.done; render(); } break;
        case 'reveal':
          if (m.idx !== S.idx) return;
          if (S.myAns[m.idx] === -1) S.myAns[m.idx] = 0;
          saveGuest();
          S.reveal = m; S.phase = 'reveal'; onReveal();
          break;
        case 'react': floatReact(m.emoji, m.name); break;
        case 'end': S.phase = 'end-wait'; onEnd(); break;
        case 'results': onResults(m); break;
        case 'error':
          S.phase = 'error';
          S.error = m.code === 'version' ? 'L\'hôte n\'a pas la même version du test. Rechargez tous la page.' : m.code === 'full' ? 'La room est pleine.' : 'La room est fermée.';
          render(); break;
      }
    }

    /* ---------- Commun ---------- */
    function fail(e) {
      if (!S) S = { role: 'none' };
      S.phase = 'error'; S.error = errText(e);
      try { if (S.peer) S.peer.destroy(); } catch (x) { /* */ }
      clearInterval(S.hb);
      render();
    }
    function leave(silent) {
      if (!S) return;
      try { if (S.role === 'guest') guestSend({ type: 'bye' }); } catch (e) { /* */ }
      clearInterval(S.hb); clearTimeout(S.revealT);
      const peer = S.peer;
      setTimeout(() => { try { if (peer) peer.destroy(); } catch (e) { /* */ } }, 150);
      if (S.role === 'guest') Session.del('guest');
      S = null; lastKey = '';
      if (!silent) { if (location.hash.indexOf('#room=') === 0) history.replaceState(null, '', '#/live'); render(true); }
    }
    function answerSelf(yes) {
      if (!S || S.phase !== 'question' || S.myAns[S.idx] !== -1) return;
      if (!Engine.eligible(S.idx, S.myAns)) return;
      buzz(yes ? 18 : 10); Sound.play(yes ? 'yes' : 'no');
      if (yes && D.qs[S.idx].quip) showQuip(D.qs[S.idx].quip);
      flyOut($('#liveRoot .qcard:not([data-locked])'), yes);
      if (S.role === 'host') hostAnswerSelf(yes);
      else { S.myAns[S.idx] = yes ? 1 : 0; saveGuest(); guestSend({ type: 'answer', idx: S.idx, yes }); setTimeout(() => render(), reduceMotion() ? 0 : 260); }
    }
    function onQuestion(i, resumed) {
      if (S.role === 'guest' && S.myAns[i] === -1 && !Engine.eligible(i, S.myAns)) {
        S.myAns[i] = 0; S.autoSkip = true; saveGuest();
        guestSend({ type: 'answer', idx: i, yes: false, auto: true });
      } else if (S.role === 'host') {
        S.autoSkip = !Engine.eligible(i, S.myAns);
        if (S.autoSkip) S.myAns[i] = 0;
      } else S.autoSkip = S.myAns[i] === 0 && !Engine.eligible(i, S.myAns);
      if (!resumed) Sound.play('pop');
      render();
      if (current === 'live') announce('Question ' + S.num + ' : ' + D.qs[i].q);
    }
    function onReveal() { Sound.play('reveal'); buzz(20); render(); }
    function onEnd() {
      const bits = Engine.finalize(S.myAns);
      Profiles.setMe(bits, S.name);
      Session.del('guest');
      render();
      if (current === 'live') { FX.flash(); FX.confetti(140); Sound.play('win'); }
    }
    function onResults(m) {
      if (!m) return;
      S.results = m.list;
      if (S.phase === 'end-wait') S.phase = 'end';
      render();
    }
    function floatReact(emoji, name) {
      if (current !== 'live') return;
      const el = h('div', { class: 'floater', style: 'left:' + (10 + Math.random() * 75) + 'vw', 'aria-hidden': 'true' }, h('span', { class: 'e' }, emoji), h('span', { class: 'n' }, name));
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 2700);
    }
    function sendReact(emoji) {
      if (!S) return;
      const now = Date.now();
      if (now - (S.lastReact || 0) < 400) return;
      S.lastReact = now;
      Sound.play('pop');
      if (S.role === 'host') { const out = { type: 'react', emoji, name: S.name, pid: S.pid }; hostBroadcast(out); floatReact(emoji, S.name); }
      else { guestSend({ type: 'react', emoji }); floatReact(emoji, S.name); }
    }

    /* ---------- Vue ---------- */
    function playersView() {
      const arr = S.role === 'host' ? [...S.players.values()].map((p) => ({ pid: p.pid, name: p.name, on: p.on, host: p.host, done: S.idx >= 0 && p.ans[S.idx] !== -1 })) : S.players;
      const done = S.role === 'host' ? null : S.done;
      return h('ul', { class: 'players', 'aria-label': 'Joueurs connectés' }, arr.map((p) => {
        const isDone = (S.phase === 'question') && (done ? done.includes(p.pid) : p.done);
        return h('li', { class: 'player' + (p.on ? '' : ' off') + (isDone ? ' done' : ''), title: p.on ? '' : 'déconnecté·e' },
          h('span', { class: 'av', style: 'background:' + colorFor(p.pid) }, initials(p.name)),
          h('span', null, p.name, p.pid === S.pid ? ' (toi)' : ''), p.host ? h('span', { class: 'host', 'aria-label': 'hôte' }, '👑') : null);
      }));
    }
    function presentCount() {
      if (S.role === 'host') { const a = [...S.players.values()]; return { on: a.filter((p) => p.on).length, done: a.filter((p) => p.on && p.ans[S.idx] !== -1).length }; }
      return { on: S.players.filter((p) => p.on).length || 1, done: S.done.length };
    }
    function reactBar() {
      return h('div', { class: 'reacts', role: 'group', 'aria-label': 'Réactions rapides' }, EMOJIS.map((e) => h('button', { class: 'react-btn', type: 'button', 'aria-label': 'Réagir ' + e, onclick: () => sendReact(e) }, e)));
    }
    function viewKey() {
      if (!S) return 'setup';
      const answered = S.phase === 'question' ? S.myAns[S.idx] : '';
      const solo = S.phase === 'lobby' && S.role === 'host' ? S.players.size > 1 : '';
      return [S.role, S.phase, S.idx, answered, S.code, S.mode, S.results ? S.results.length : 0, S.reveal ? 1 : 0, solo].join('|');
    }
    function render(force) {
      if (force) lastKey = '';
      const root = $('#liveRoot');
      if (!root) return;
      const key = viewKey();
      if (key === lastKey && S) {
        // mise à jour légère : pastilles et compteurs
        const pl = $('#livePlayers'); if (pl) { pl.textContent = ''; pl.appendChild(playersView()); }
        const cnt = $('#liveCount'); if (cnt && S.phase === 'question') { const c = presentCount(); cnt.textContent = c.done + ' / ' + c.on + ' ont répondu'; }
        const pn = $('#livePN'); if (pn && S.role === 'host') pn.textContent = 'Joueurs · ' + S.players.size;
        return;
      }
      lastKey = key;
      root.textContent = '';
      root.appendChild(build());
      const f = $('[data-autofocus]', root); if (f && current === 'live') f.focus({ preventScroll: true });
    }
    function header(title, kicker) {
      return h('div', { class: 'section-title', style: 'margin-top:8px;justify-content:space-between;flex-wrap:wrap' },
        h('div', null, h('p', { class: 'kicker', style: 'margin:0' }, kicker || 'Live'), h('h2', null, title)),
        S && S.code ? h('span', { class: 'status-pill' + (S.phase === 'reconnecting' ? ' bad' : '') }, h('i'), 'Room ' + S.code) : null);
    }
    function build() {
      const frag = document.createDocumentFragment();
      const name = Home.name();
      if (!S || S.role === 'none' && S.phase !== 'error') {
        // ----- Mise en place -----
        frag.appendChild(header('Jouer en live avec la bande', 'Pair-à-pair · sans compte'));
        const nameIn = h('input', { class: 'input', id: 'liveName', maxlength: 16, value: name, placeholder: 'Ton pseudo', autocomplete: 'nickname' });
        nameIn.addEventListener('input', () => Store.set('name', cleanName(nameIn.value)));
        const getName = () => { const v = cleanName(nameIn.value); if (!v) { toast('Choisis un pseudo d\'abord 😉', 'err'); nameIn.focus(); return null; } $('#nameInput').value = v; Store.set('name', v); return v; };
        const codeIn = h('input', { class: 'input code', id: 'joinCode', maxlength: 5, value: pendingCode || '', placeholder: 'ABCDE', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', 'aria-label': 'Code de la room (5 caractères)', inputmode: 'text' });
        codeIn.addEventListener('input', () => { codeIn.value = codeIn.value.toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/[IL1O0]/g, (ch) => ({ I: '', L: '', 1: '', O: '', 0: '' }[ch])).slice(0, 5); });
        const join = () => { const n = getName(); if (!n) return; const c = codeIn.value.toUpperCase(); if (!isCode(c)) { toast('Le code fait 5 caractères (ex. K7XQ2)', 'err'); codeIn.focus(); return; } joinRoom(c, n); };
        codeIn.addEventListener('keydown', (e) => { if (e.key === 'Enter') join(); });
        frag.appendChild(h('div', { class: 'card', style: 'max-width:580px' }, h('div', { class: 'field' }, h('label', { for: 'liveName' }, 'Ton pseudo dans la room'), nameIn)));
        frag.appendChild(h('div', { class: 'grid2', style: 'margin-top:14px' },
          h('div', { class: 'card stack' }, h('h3', null, '👑 Créer une room'), h('p', { class: 'muted small', style: 'margin:6px 0 0' }, 'Tu héberges la partie (et tu joues aussi). Idéal sur un écran projeté. Garde la page ouverte jusqu\'à la fin.'),
            h('button', { class: 'btn btn-primary', type: 'button', onclick: () => { const n = getName(); if (n) createRoom(n); } }, h('span', { class: 'em', 'aria-hidden': 'true' }, '✨'), 'Créer une room')),
          h('div', { class: 'card stack' }, h('h3', null, '🎟️ Rejoindre'), h('label', { class: 'label', for: 'joinCode' }, 'Code donné par l\'hôte'), codeIn,
            h('button', { class: 'btn btn-cyan', type: 'button', onclick: join, 'data-autofocus': pendingCode ? true : null }, h('span', { class: 'em', 'aria-hidden': 'true' }, '🚪'), 'Rejoindre'))));
        frag.appendChild(h('p', { class: 'privacy', style: 'max-width:580px' }, h('span', { class: 'em', 'aria-hidden': 'true' }, '📡'), h('span', null, 'Les téléphones se parlent directement (WebRTC). Un serveur public PeerJS sert uniquement à la mise en relation : aucune réponse n\'y est stockée.')));
        return frag;
      }
      if (S.phase === 'connecting') {
        frag.appendChild(header(S.role === 'host' ? 'Création de la room…' : 'Connexion à ' + S.code + '…'));
        frag.appendChild(h('div', { class: 'card waiting', style: 'min-height:160px' }, h('span', { class: 'dots', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')), 'Mise en relation avec le serveur'));
        frag.appendChild(h('button', { class: 'link-btn', type: 'button', onclick: () => leave() }, 'Annuler'));
        return frag;
      }
      if (S.phase === 'error' || S.phase === 'closed') {
        const closed = S.phase === 'closed';
        frag.appendChild(header(closed ? 'Connexion perdue' : 'Le live ne passe pas', 'Live'));
        const hasAnswers = S.myAns && Array.from(S.myAns).some((v) => v !== -1);
        frag.appendChild(h('div', { class: 'alert' }, h('b', null, closed ? 'L\'hôte a quitté la room (ou le réseau a lâché).' : 'Oups.'), closed ? 'Impossible de se reconnecter après plusieurs essais.' : S.error));
        frag.appendChild(h('div', { class: 'card stack', style: 'margin-top:14px' },
          h('p', { class: 'muted', style: 'margin:0' }, 'Plan B : jouez chacun en solo, puis échangez vos liens dans « Ma bande ». Même fun, zéro réseau.'),
          hasAnswers && S.idx >= 0 ? h('button', { class: 'btn btn-acid', type: 'button', onclick: () => { Quiz.fromAnswers(S.myAns, S.idx + 1); leave(true); go('#/quiz'); } }, '⏩ Finir la partie en solo') : null,
          h('button', { class: 'btn btn-primary', type: 'button', onclick: () => { leave(true); Quiz.reset(); go('#/quiz'); } }, '🎯 Jouer en solo'),
          h('button', { class: 'btn', type: 'button', onclick: () => { leave(true); go('#/bande'); } }, '👯 Ma bande (partage de codes)'),
          h('button', { class: 'btn btn-cyan', type: 'button', onclick: () => { const c = S.code, r = S.role, n = S.name; leave(true); if (r === 'guest' && c) joinRoom(c, n); else render(true); } }, '🔁 Réessayer')));
        return frag;
      }
      if (S.phase === 'reconnecting') {
        frag.appendChild(header('Reconnexion…'));
        frag.appendChild(h('div', { class: 'card waiting', style: 'min-height:160px;flex-direction:column' }, h('span', { class: 'dots', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')), 'Connexion perdue, on réessaie (' + S.retries + '/10)…', h('span', { class: 'small' }, 'Tes réponses sont gardées.')));
        frag.appendChild(h('button', { class: 'link-btn', type: 'button', onclick: () => leave() }, 'Quitter la room'));
        return frag;
      }
      if (S.phase === 'lobby') return lobbyView(frag);
      if (S.phase === 'question') return questionView(frag);
      if (S.phase === 'reveal') {
        if (S.reveal) return revealView(frag);
        frag.appendChild(header('Synchronisation…'));
        frag.appendChild(h('div', { class: 'card waiting', style: 'min-height:160px' }, h('span', { class: 'dots', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')), 'On récupère la partie en cours'));
        return frag;
      }
      return endView(frag);
    }
    function roomLink() { return baseUrl() + '#room=' + S.code; }
    function lobbyView(frag) {
      if (S.role === 'host') {
        frag.appendChild(header('Ta room est ouverte', 'Lobby · hôte'));
        const seg = h('div', { class: 'seg', role: 'group', 'aria-label': 'Mode de révélation' },
          h('button', { type: 'button', 'aria-pressed': String(S.mode === 'anon'), onclick: () => hostSetMode('anon') }, '🤫 Anonyme'),
          h('button', { type: 'button', 'aria-pressed': String(S.mode === 'names'), onclick: () => hostSetMode('names') }, '📣 Balance les noms'));
        const n = S.players.size;
        frag.appendChild(h('div', { class: 'live-grid' },
          h('div', { class: 'card center' }, h('p', { class: 'kicker', style: 'margin:0' }, 'Code de la room'), h('div', { class: 'roomcode', 'aria-label': 'Code ' + S.code.split('').join(' ') }, S.code),
            h('p', { class: 'muted small', style: 'margin:0 0 6px' }, 'Les potes tapent ce code dans « Rejoindre », ou scannent :'), qrBlock(roomLink()),
            h('div', { class: 'btn-row', style: 'margin-top:14px' }, h('button', { class: 'btn btn-sm', type: 'button', onclick: () => shareOrCopy(roomLink(), 'Pur ou Pas — live', 'Rejoins ma room Pur ou Pas : ' + S.code) }, '🔗 Partager le lien'))),
          h('div', { class: 'card stack' },
            h('div', { class: 'card-title', style: 'margin:0' }, h('h3', { id: 'livePN' }, 'Joueurs · ' + n), h('span', { class: 'small muted' }, 'en temps réel')),
            h('div', { id: 'livePlayers' }, playersView()),
            h('hr', { class: 'hr' }),
            h('span', { class: 'label', style: 'margin-bottom:0' }, 'Révélation des votes'), seg,
            h('p', { class: 'small muted', style: 'margin:0' }, S.mode === 'names' ? 'Tout le monde verra QUI a dit oui. Ambiance garantie.' : 'On affiche juste « 4/7 ont dit oui ». Les secrets restent secrets.'),
            h('button', { class: 'btn btn-primary', type: 'button', onclick: hostStart, 'data-autofocus': true }, h('span', { class: 'em', 'aria-hidden': 'true' }, '🚀'), n > 1 ? 'Lancer la partie' : 'Lancer (même seul·e)'),
            h('button', { class: 'link-btn', type: 'button', onclick: () => { if (confirm('Fermer la room ?')) leave(); } }, 'Fermer la room'))));
        return frag;
      }
      frag.appendChild(header('Tu es dans la room', 'Lobby'));
      frag.appendChild(h('div', { class: 'live-grid' },
        h('div', { class: 'card center' }, h('div', { class: 'roomcode' }, S.code), h('div', { class: 'waiting' }, h('span', { class: 'dots', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')), 'En attente du lancement par l\'hôte'),
          h('p', { class: 'small muted', style: 'margin:0' }, S.mode === 'names' ? '📣 Mode « balance les noms » : les autres verront tes OUI.' : '🤫 Mode anonyme : seuls les totaux sont affichés.')),
        h('div', { class: 'card stack' }, h('h3', null, 'Joueurs'), h('div', { id: 'livePlayers' }, playersView()), reactBar(),
          h('button', { class: 'link-btn', type: 'button', onclick: () => leave() }, 'Quitter la room'))));
      return frag;
    }
    function questionView(frag) {
      const i = S.idx;
      const mine = S.myAns[i];
      frag.appendChild(header('Question ' + S.num, 'Live · ' + (S.mode === 'names' ? 'noms balancés' : 'anonyme')));
      const left = h('div', { class: 'live-q' });
      if (mine === -1 && Engine.eligible(i, S.myAns)) {
        const card = questionCard(i);
        const stage = h('div', { class: 'stage', style: 'margin-top:0' }, card);
        attachSwipe(card, (yes) => answerSelf(yes));
        left.appendChild(stage);
        left.appendChild(h('div', { class: 'answers' },
          h('button', { class: 'ans ans-no', type: 'button', onclick: () => answerSelf(false) }, 'NON', h('small', null, '😇')),
          h('button', { class: 'ans ans-yes', type: 'button', onclick: () => answerSelf(true), 'data-autofocus': true }, 'OUI', h('small', null, '😈'))));
      } else {
        const c = presentCount();
        let note;
        if (S.autoSkip || (mine === 0 && !Engine.eligible(i, S.myAns))) {
          const b = Engine.blocker(i, S.myAns);
          note = h('div', { class: 'skipnote' }, '⏭️ Question passée — ' + (b >= 0 ? 'tu as dit non à « ' + D.qs[b].q + ' »' : 'elle ne te concerne pas') + '.');
        } else {
          note = h('div', { class: 'skipnote', style: 'color:' + (mine === 1 ? 'var(--mag)' : 'var(--cyan)') + ';border-color:currentColor' }, 'Tu as répondu ' + (mine === 1 ? 'OUI 😈' : 'NON 😇') + '. Les autres réfléchissent…');
        }
        left.appendChild(h('div', { class: 'stage', style: 'margin-top:0' }, questionCard(i, note)));
        left.appendChild(h('div', { class: 'waiting' }, h('span', { class: 'dots', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')), h('span', { id: 'liveCount' }, c.done + ' / ' + c.on + ' ont répondu')));
      }
      const side = h('div', { class: 'card stack' },
        h('div', { class: 'card-title', style: 'margin:0' }, h('h3', null, 'Qui a répondu'), h('span', { class: 'small muted' }, '✓ = c\'est fait')),
        h('div', { id: 'livePlayers' }, playersView()), reactBar());
      if (S.role === 'host') {
        side.appendChild(h('button', { class: 'btn btn-acid', type: 'button', onclick: hostReveal }, '👀 Révéler maintenant'));
        side.appendChild(h('button', { class: 'link-btn', type: 'button', onclick: () => { if (confirm('Terminer la partie maintenant ? Les questions restantes compteront NON.')) { for (let k = S.idx; k < D.n; k++) S.players.forEach((p) => { if (p.ans[k] === -1) p.ans[k] = 0; }); hostEnd(); } } }, 'Terminer la partie'));
      } else side.appendChild(h('button', { class: 'link-btn', type: 'button', onclick: () => { if (confirm('Quitter la room ?')) leave(); } }, 'Quitter la room'));
      frag.appendChild(h('div', { class: 'live-grid' }, left, side));
      return frag;
    }
    function revealView(frag) {
      const r = S.reveal, i = S.idx;
      frag.appendChild(header('Révélation', 'Question ' + S.num));
      const gauge = h('i');
      setTimeout(() => { gauge.style.width = (r.total ? (100 * r.yes) / r.total : 0) + '%'; }, 80);
      const mine = S.myAns[i];
      const main = h('div', { class: 'card center' },
        h('span', { class: 'chip', style: 'margin:0 auto' }, h('span', { class: 'em', 'aria-hidden': 'true' }, D.cats[D.qs[i].c].emoji), D.cats[D.qs[i].c].label),
        h('p', { class: 'qtext', style: 'font-size:clamp(18px,4.6vw,30px);margin:14px 0 0' }, D.qs[i].q),
        h('div', { role: 'status' }, h('div', { class: 'reveal-big glow-m' }, r.yes + '/' + r.total), h('p', { class: 'reveal-lbl' }, r.yes > 1 ? 'ont dit OUI' : r.yes === 1 ? 'a dit OUI' : 'n\'a dit OUI')),
        h('div', { class: 'gauge', role: 'img', 'aria-label': r.yes + ' oui sur ' + r.total }, gauge),
        r.names && r.names.length ? h('div', { class: 'names' }, r.names.map((n, k) => h('span', { style: 'animation-delay:' + (0.4 + k * 0.08) + 's' }, n))) : null,
        r.names && !r.names.length ? h('p', { class: 'muted' }, 'Personne. Bande de saints 😇') : null,
        r.skipped ? h('p', { class: 'small muted', style: 'margin:10px 0 0' }, plural(r.skipped, 'joueur·se exclu·e', 'joueur·ses exclu·es') + ' par une question-porte (compte NON).') : null,
        h('p', { class: 'small', style: 'margin:12px 0 0;font-weight:800;color:' + (mine === 1 ? 'var(--mag)' : 'var(--cyan)') }, 'Toi : ' + (mine === 1 ? 'OUI 😈' : 'NON 😇')));
      const side = h('div', { class: 'card stack' }, h('h3', null, 'La bande'), h('div', { id: 'livePlayers' }, playersView()), reactBar());
      if (S.role === 'host') {
        side.appendChild(h('button', { class: 'btn btn-primary', type: 'button', onclick: hostAdvance, 'data-autofocus': true }, 'Question suivante →'));
        side.appendChild(h('button', { class: 'link-btn', type: 'button', onclick: () => { if (confirm('Terminer la partie maintenant ? Les questions restantes compteront NON.')) hostEnd(); } }, 'Terminer la partie'));
      } else side.appendChild(h('div', { class: 'waiting' }, h('span', { class: 'dots', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')), 'L\'hôte va passer à la suite'));
      frag.appendChild(h('div', { class: 'live-grid' }, main, side));
      return frag;
    }
    function endView(frag) {
      frag.appendChild(header('Fin de partie !', 'Live · résultats'));
      const me = Profiles.me();
      const ranked = (S.results || []).map((r) => r.profile).sort((a, b) => b.purity - a.purity);
      const list = h('ol', { class: 'ranklist' }, ranked.length ? ranked.map((p, k) => {
        const a = Score.archetype(p);
        return h('li', { class: 'rank' + (me && p.code === me.code ? ' me' : ''), style: 'grid-template-columns:34px 1fr auto;animation-delay:' + k * 0.08 + 's' },
          h('span', { class: 'n' }, k === 0 ? '👑' : k === ranked.length - 1 && ranked.length > 2 ? '😈' : String(k + 1)),
          h('span', { class: 'nm' }, h('b', null, p.name), h('span', null, (a.emoji || '') + ' ' + a.name)),
          h('span', { class: 'pc', style: 'color:' + (p.purity >= 50 ? 'var(--cyan)' : 'var(--mag)') }, fmtPct(p.purity)));
      }) : h('li', { class: 'waiting' }, 'Calcul du classement…'));
      const meCard = me ? h('div', { class: 'card center' },
        h('p', { class: 'kicker', style: 'margin:0' }, 'Ton score'),
        h('div', { class: 'score' + (me.purity < 50 ? ' impure' : ''), style: 'font-size:clamp(64px,18vw,110px)' }, (Math.round(me.purity * 10) / 10).toFixed(1).replace('.', ','), h('small', null, '%')),
        h('p', { class: 'tier-title', style: 'margin-top:8px' }, Score.tier(me.purity).title),
        h('p', { class: 'muted', style: 'margin:0 0 14px' }, (Score.archetype(me).emoji || '') + ' ' + Score.archetype(me).name),
        h('button', { class: 'btn btn-primary', type: 'button', onclick: () => { Result.fresh = false; go('#/resultat'); } }, '📊 Voir mon profil complet')) : null;
      const addAll = h('button', { class: 'btn btn-cyan', type: 'button', disabled: ranked.length < 2 ? true : null }, '👯 Ajouter toute la room à ma bande');
      addAll.onclick = () => {
        let added = 0;
        ranked.forEach((p) => { const r = Profiles.add(p); if (r.status === 'added' || r.status === 'updated') added++; });
        toast(added ? plural(added, 'profil ajouté', 'profils ajoutés') + ' à ta bande 🎉' : 'Tout le monde est déjà dans ta bande', 'ok');
        Sound.play('pop');
      };
      frag.appendChild(h('div', { class: 'live-grid' }, meCard || h('div'),
        h('div', { class: 'card stack' }, h('div', { class: 'card-title', style: 'margin:0' }, h('h3', null, 'Classement live'), h('span', { class: 'small muted' }, 'du plus pur au plus impur')), list, addAll,
          h('button', { class: 'btn', type: 'button', onclick: () => go('#/bande') }, 'Ouvrir ma bande'),
          reactBar(),
          h('button', { class: 'link-btn', type: 'button', onclick: () => leave() }, S.role === 'host' ? 'Fermer la room' : 'Quitter la room'))));
      return frag;
    }

    let pendingCode = '';
    function openFromHash(code) {
      const c = String(code || '').toUpperCase().slice(0, 5);
      if (!isCode(c)) { pendingCode = ''; render(true); toast('Code de room invalide', 'err'); return; }
      pendingCode = c;
      if (S && S.code === c) { render(true); return; }
      const saved = Session.get('guest', null);
      if (saved && saved.code === c && cleanName(saved.name)) { joinRoom(c, cleanName(saved.name), true); return; } // rechargement : on reprend
      if (S && S.role === 'host') { render(true); return; }
      leave(true);
      render(true);
    }
    function key(e) {
      if (!S || S.phase !== 'question' || S.myAns[S.idx] !== -1) return;
      const k = e.key.toLowerCase();
      if (k === 'o' || k === 'arrowright') { e.preventDefault(); answerSelf(true); }
      else if (k === 'n' || k === 'arrowleft') { e.preventDefault(); answerSelf(false); }
    }
    window.addEventListener('beforeunload', (e) => { if (S && S.role === 'host' && (S.phase === 'question' || S.phase === 'reveal')) { e.preventDefault(); e.returnValue = ''; } });
    return {
      render, openFromHash, key,
      active: () => !!(S && S.code && S.phase !== 'error' && S.phase !== 'closed'),
      code: () => (S ? S.code : ''),
      _state: () => S, _validate: validate
    };
  })();

  /* ------------------------------------------------------------------ *
   * Démarrage
   * ------------------------------------------------------------------ */
  function init() {
    if (!D) { route(); return; }
    Home.init();
    Quiz.init();
    $('#homeLink').addEventListener('click', () => go('#/'));
    $('#bandLink').addEventListener('click', () => { if (isAdult()) go('#/bande'); else go('#/'); });
    const sb = $('#soundBtn');
    const syncSound = () => { sb.setAttribute('aria-pressed', String(Sound.on)); sb.setAttribute('aria-label', Sound.on ? 'Couper les sons' : 'Activer les sons'); sb.firstElementChild.textContent = Sound.on ? '🔊' : '🔇'; };
    sb.addEventListener('click', () => { Sound.toggle(); syncSound(); });
    syncSound();
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if ($('.modal')) return;
      if (current === 'quiz') Quiz.key(e);
      else if (current === 'live') Live.key(e);
    });
    window.addEventListener('hashchange', route);
    route();
  }
  // API minimale exposée (tests / console)
  window.PurOuPas = { D, Engine, Score, Codec, Profiles, Quiz, Live, Band };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
