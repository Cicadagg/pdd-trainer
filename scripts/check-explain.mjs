// Проверяет пояснения: у каждого вопроса есть s, w той же длины, w[c] пустой, остальные заполнены
import fs from 'node:fs';
const Q = JSON.parse(fs.readFileSync(new URL('../data/questions.json', import.meta.url)));
const dir = new URL('../data/explain/', import.meta.url);
const ex = {};
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
  try { Object.assign(ex, JSON.parse(fs.readFileSync(new URL(f, dir), 'utf8'))); }
  catch (e) { console.log('BAD JSON', f, e.message); }
}
let ok = 0; const errs = [];
for (const q of Q) {
  const e = ex[q.key]; if (!e) continue;
  if (!e.s) errs.push(q.key + ' no s');
  if (!Array.isArray(e.w) || e.w.length !== q.a.length) { errs.push(`${q.key} w len ${e.w?.length} != ${q.a.length}`); continue; }
  e.w.forEach((w, i) => { if (i === q.c && w) errs.push(`${q.key} w[${i}] should be null`); if (i !== q.c && !w) errs.push(`${q.key} w[${i}] empty`); });
  ok++;
}
console.log(`covered ${Object.keys(ex).length}/${Q.length}, valid ${ok}`); errs.forEach(e => console.log(' ', e));
