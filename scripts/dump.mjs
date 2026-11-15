// Компактный вывод вопросов билетов [from..to] для написания пояснений
import fs from 'node:fs';
const [from, to] = process.argv.slice(2).map(Number);
const Q = JSON.parse(fs.readFileSync(new URL('../data/questions.json', import.meta.url)));
for (const q of Q.filter(q => q.ticket >= from && q.ticket <= to))
  console.log(`[${q.key}]${q.img ? '(img)' : ''} ${q.q}\n${q.a.map((a, i) => `${i + 1}${i === q.c ? '*' : ''}) ${a}`).join(' | ')}\nTIP: ${q.tip.replace(/\s+/g, ' ')}\n`);
