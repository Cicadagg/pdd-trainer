// Собирает все 40 билетов A,B из _src в data/questions.json и копирует картинки в img/
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const src = path.join(root, '_src/questions/A_B/tickets');
const out = [];
for (let t = 1; t <= 40; t++) {
  const arr = JSON.parse(fs.readFileSync(path.join(src, `Билет ${t}.json`), 'utf8'));
  arr.forEach((q, i) => {
    let img = null;
    if (q.image && !q.image.includes('no_image')) {
      const rel = q.image.replace(/^\.\//, '');
      const from = path.join(root, '_src', rel);
      if (fs.existsSync(from)) {
        img = 'img/' + path.basename(rel);
        fs.mkdirSync(path.join(root, 'img'), { recursive: true });
        fs.copyFileSync(from, path.join(root, img));
      } else console.warn('missing image', rel);
    }
    out.push({
      key: `${t}-${i + 1}`,
      ticket: t, num: i + 1,
      q: q.question.trim(),
      img,
      a: q.answers.map(x => x.answer_text.trim()),
      c: q.answers.findIndex(x => x.is_correct),
      tip: (q.answer_tip || '').trim(),
      topic: q.topic || [],
    });
  });
}
fs.mkdirSync(path.join(root, 'data'), { recursive: true });
fs.writeFileSync(path.join(root, 'data/questions.json'), JSON.stringify(out));
// простые пояснения: data/explain/*.json -> один объект key -> {s, w}
const exDir = path.join(root, 'data/explain');
const ex = {};
if (fs.existsSync(exDir)) for (const f of fs.readdirSync(exDir).filter(f => f.endsWith('.json')).sort())
  Object.assign(ex, JSON.parse(fs.readFileSync(path.join(exDir, f), 'utf8')));
fs.writeFileSync(path.join(root, 'data/questions.js'), 'window.PDD=' + JSON.stringify(out) + ';\nwindow.PDD_EX=' + JSON.stringify(ex) + ';\n');
console.log('explanations', Object.keys(ex).length);
console.log('questions', out.length, 'with img', out.filter(q => q.img).length, 'bad c', out.filter(q => q.c < 0).length);
