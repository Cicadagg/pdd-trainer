# ПДД: Без права на ошибку

Тренажёр экзамена ПДД РФ (категории A, B, M): все 800 вопросов в случайном порядке.
Одна ошибка показывает разбор простым языком и откатывает в самое начало.

- Сайт статический: `index.html`, `style.css`, `app.js`, `data/questions.js`, `img/`.
- Вопросы и картинки: [etspring/pdd_russia](https://github.com/etspring/pdd_russia).
- Простые пояснения: `data/explain/*.json` (`ключ "билет-вопрос"` -> `{ s: пояснение, w: [почему неверен каждый вариант] }`).

Пересобрать данные:

```bash
git clone --depth 1 https://github.com/etspring/pdd_russia.git _src
node scripts/build-data.mjs
```
