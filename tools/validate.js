const fs = require('fs'), vm = require('vm'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'questions.js'), 'utf8');
const ctx = { window: {} }; vm.createContext(ctx); vm.runInContext(src, ctx);
const D = ctx.window.POP_DATA; const errs = []; const ok = (c, m) => { if (!c) errs.push(m); };
const CATS = ['alcool','drogue','sexe','moralite','hygiene','adulte'];
ok(D && D.version === 1, 'version');
ok(D.categories.length === 6 && CATS.every(c => D.categories.some(x => x.id === c)), 'categories');
const Q = D.questions, pos = {}, byId = {};
ok(Q.length >= 95 && Q.length <= 115, 'total ' + Q.length);
Q.forEach((q, i) => {
  ok(!(q.id in pos), 'dup id ' + q.id); pos[q.id] = i; byId[q.id] = q;
  ok(CATS.includes(q.cat), 'bad cat ' + q.id);
  ok(typeof q.q === 'string' && q.q.trim().endsWith('?'), 'q text ' + q.id);
  ok(q.gate === null || typeof q.gate === 'string', 'gate type ' + q.id);
  if (q.gate !== null) ok(q.gate in pos && pos[q.gate] < i, 'gate not before ' + q.id);
  if (q.quip !== undefined) ok(q.quip.length <= 75, 'quip long ' + q.id + ' (' + q.quip.length + ')');
});
const depth = id => { let d = 0, q = byId[id]; while (q && q.gate) { d++; q = byId[q.gate]; if (d > 5) break; } return d; };
Q.forEach(q => ok(depth(q.id) <= 2, 'depth ' + q.id));
const ungated = Q.filter(q => q.gate === null).length; ok(ungated >= 62, 'ungated ' + ungated);
const per = {}; CATS.forEach(c => per[c] = Q.filter(q => q.cat === c).length);
CATS.forEach(c => ok(per[c] >= 10 && per[c] <= 25, 'cat count ' + c + ' ' + per[c]));
const quips = Q.filter(q => q.quip).length; ok(quips / Q.length >= 0.6, 'quips ' + quips);
// longest same-category run
let run = 1, maxRun = 1; for (let i = 1; i < Q.length; i++) { run = Q[i].cat === Q[i-1].cat ? run + 1 : 1; maxRun = Math.max(maxRun, run); }
ok(maxRun <= 6, 'run ' + maxRun);
// tiers
const T = D.tiers; ok(T.length === 6, 'tiers count');
for (let i = 1; i < T.length; i++) ok(T[i].min < T[i-1].min, 'tiers order');
ok(T[T.length-1].min === 0, 'last tier min 0'); T.forEach(t => ok(t.title && t.text, 'tier text'));
// archetypes
const A = D.archetypes; ok(A.length >= 8 && A.length <= 12, 'arch count ' + A.length);
const aids = new Set(); A.forEach(a => { ok(!aids.has(a.id), 'dup arch'); aids.add(a.id); ok(a.name && a.emoji && a.desc, 'arch fields ' + a.id);
  const r = a.rule; ok(['pure','all','dominant','duo'].includes(r.type), 'arch rule ' + a.id);
  if (r.type === 'dominant') ok(CATS.includes(r.cat), 'arch cat ' + a.id);
  if (r.type === 'duo') ok(r.cats.length === 2 && r.cats.every(c => CATS.includes(c)) && r.cats[0] !== r.cats[1], 'duo ' + a.id); });
ok(A.filter(a => a.rule.type === 'pure').length >= 1, 'pure'); ok(A.filter(a => a.rule.type === 'all').length >= 1, 'all');
CATS.forEach(c => ok(A.some(a => a.rule.type === 'dominant' && a.rule.cat === c), 'dominant ' + c));
const duos = A.filter(a => a.rule.type === 'duo').length; ok(duos >= 1 && duos <= 4, 'duos ' + duos);
// badges
const B = D.badges; ok(B.length >= 8 && B.length <= 14, 'badges count ' + B.length);
const bids = new Set(); B.forEach(b => { ok(!bids.has(b.id), 'dup badge'); bids.add(b.id); ok(b.emoji && b.name && b.desc, 'badge fields ' + b.id);
  const r = b.rule;
  if (r.type === 'yes') ok(Array.isArray(r.ids) && r.ids.length && r.ids.every(id => id in byId), 'badge ids ' + b.id);
  else if (r.type === 'catMin') ok(CATS.includes(r.cat) && typeof r.min === 'number', 'badge catMin ' + b.id);
  else if (r.type === 'catMax') ok(CATS.includes(r.cat) && typeof r.max === 'number', 'badge catMax ' + b.id);
  else errs.push('badge type ' + b.id); });
// JSON-compat of object body
const body = src.slice(src.indexOf('{'), src.lastIndexOf('}') + 1); try { JSON.parse(body); } catch (e) { errs.push('JSON: ' + e.message); }
console.log({ total: Q.length, ungated, gated: Q.length - ungated, per, quips, quipPct: Math.round(100*quips/Q.length), maxRun, archetypes: A.length, badges: B.length });
if (errs.length) { console.log('ERRORS:\n' + errs.join('\n')); process.exit(1); } else console.log('ALL CHECKS PASSED');
