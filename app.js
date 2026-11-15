(() => {
  'use strict';
  const Q = window.PDD || [];
  const EX = window.PDD_EX || {};
  const TOTAL = Q.length;
  const LS_KEY = 'pdd-hardcore-v1';
  const $ = (id) => document.getElementById(id);

  // ---------- хранилище ----------
  const load = () => { try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch { return {}; } };
  const save = () => { try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch {} };
  const S = Object.assign({ best: 0, runs: 0, answered: 0, order: null, pos: 0, auto: true, fails: {} }, load());

  // ---------- утилиты ----------
  function shuffle(n) {
    const a = Array.from({ length: n }, (_, i) => i);
    const r = new Uint32Array(n);
    crypto.getRandomValues(r);
    for (let i = n - 1; i > 0; i--) {
      const j = r[i] % (i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  const pad = (n) => String(n).padStart(3, '0');
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const plural = (n, a, b, c) => { const m = n % 100, k = n % 10; return (m > 10 && m < 20) ? c : k === 1 ? a : (k > 1 && k < 5) ? b : c; };

  function show(id) {
    for (const s of document.querySelectorAll('.screen')) s.hidden = s.id !== id;
    const inGame = id === 'scrQuiz';
    $('hud').hidden = !(inGame || id === 'scrFail');
    $('progress').hidden = !inGame;
    window.scrollTo({ top: 0 });
  }

  function setImg(wrap, img, src) {
    if (src) { img.src = src; wrap.hidden = false; }
    else { img.removeAttribute('src'); wrap.hidden = true; }
  }

  function updateHud() {
    $('hudDone').textContent = S.pos;
    $('hudBest').textContent = S.best;
    $('hudRun').textContent = S.runs;
    $('progressBar').style.width = (S.pos / TOTAL * 100) + '%';
  }

  // ---------- старт ----------
  function renderStart() {
    const hasRun = Array.isArray(S.order) && S.order.length === TOTAL && S.pos > 0 && S.pos < TOTAL;
    $('btnContinue').hidden = !hasRun;
    if (hasRun) $('btnContinue').textContent = `Продолжить (${S.pos} / ${TOTAL})`;
    $('startStats').innerHTML =
      `<span>РЕКОРД <b>${S.best}</b> / ${TOTAL}</span>` +
      `<span>ПОПЫТОК <b>${S.runs}</b></span>` +
      `<span>ВСЕГО ОТВЕТОВ <b>${S.answered}</b></span>`;
    show('scrStart');
  }

  function newRun() {
    S.order = shuffle(TOTAL);
    S.pos = 0;
    $('ghosts').innerHTML = '';
    S.runs += 1;
    save();
    renderQuestion();
  }

  // ---------- вопрос ----------
  let locked = false;
  let autoTimer = null;

  function current() { return Q[S.order[S.pos]]; }

  function renderQuestion() {
    if (S.pos >= TOTAL) return win();
    const q = current();
    locked = false;
    clearTimeout(autoTimer);
    $('qTicket').textContent = `БИЛЕТ ${q.ticket} · ВОПРОС ${q.num}`;
    $('qTopic').textContent = (q.topic[0] || '').toUpperCase();
    $('qTopic').hidden = !q.topic.length;
    $('qIdx').textContent = '#' + pad(S.pos + 1);
    setImg($('qImgWrap'), $('qImg'), q.img);
    $('qText').textContent = q.q;
    $('answers').innerHTML = q.a.map((t, i) =>
      `<button class="ans" data-i="${i}"><span class="ans-n">${i + 1}</span><span class="ans-t">${esc(t)}</span></button>`
    ).join('');
    $('okBar').hidden = true;
    updateHud();
    show('scrQuiz');
    preloadNext();
  }

  // верный ответ: текущая карточка уезжает влево в стопку, новая въезжает справа
  function advance() {
    clearTimeout(autoTimer);
    if (S.pos >= TOTAL) return win();
    const card = $('card');
    const ghost = document.createElement('div');
    ghost.className = 'ghost fresh';
    const clone = card.cloneNode(true);
    clone.removeAttribute('id');
    clone.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
    clone.classList.remove('shake', 'enter');
    clone.querySelector('.ok-bar')?.remove();
    ghost.appendChild(clone);
    const tag = document.createElement('div');
    tag.className = 'ghost-tag'; tag.textContent = '✓ ' + pad(S.pos);
    ghost.appendChild(tag);
    const box = $('ghosts');
    box.prepend(ghost);
    while (box.children.length > 4) box.lastElementChild.remove();
    card.classList.add('enter');
    renderQuestion();
    void card.offsetWidth; void ghost.offsetWidth; // зафиксировать стартовое состояние, затем запустить переходы
    ghost.classList.remove('fresh');
    card.classList.remove('enter');
  }

  function preloadNext() {
    const n = S.order[S.pos + 1];
    if (n != null && Q[n].img) { const im = new Image(); im.src = Q[n].img; }
  }

  function answer(i) {
    if (locked) return;
    const q = current();
    if (i < 0 || i >= q.a.length) return;
    locked = true;
    S.answered += 1;
    const btns = $('answers').querySelectorAll('.ans');
    btns.forEach((b) => (b.disabled = true));
    if (i === q.c) {
      btns[i].classList.add('is-ok');
      S.pos += 1;
      if (S.pos > S.best) S.best = S.pos;
      save();
      updateHud();
      if (S.auto) autoTimer = setTimeout(advance, 500);
      else { $('okBar').hidden = false; $('btnNext').focus(); }
    } else {
      btns[i].classList.add('is-bad');
      btns[q.c].classList.add('is-ok');
      $('card').classList.remove('shake'); void $('card').offsetWidth; $('card').classList.add('shake');
      S.fails[q.key] = (S.fails[q.key] || 0) + 1;
      const reached = S.pos;
      S.order = null; S.pos = 0;
      save();
      setTimeout(() => fail(q, i, reached), 650);
    }
  }

  // ---------- провал ----------
  function fail(q, picked, reached) {
    const ex = EX[q.key];
    $('failMeta').innerHTML =
      `Дошёл до <b>${reached}</b> из ${TOTAL} · рекорд <b>${S.best}</b> · попытка <b>${S.runs}</b>` +
      (S.fails[q.key] > 1 ? ` · на этом вопросе ты ошибаешься уже <b>${S.fails[q.key]}</b> ${plural(S.fails[q.key], 'раз', 'раза', 'раз')}` : '');
    $('fTicket').textContent = `БИЛЕТ ${q.ticket} · ВОПРОС ${q.num}`;
    setImg($('fImgWrap'), $('fImg'), q.img);
    $('fText').textContent = q.q;
    $('fAnswers').innerHTML = q.a.map((t, i) => {
      const cls = i === q.c ? 'is-ok' : i === picked ? 'is-bad' : '';
      const tag = i === q.c ? 'ПРАВИЛЬНО' : i === picked ? 'ТВОЙ ОТВЕТ' : '';
      return `<div class="ans ${cls}"><span class="ans-n">${i + 1}</span><span class="ans-t">${esc(t)}</span>${tag ? `<span class="ans-tag">${tag}</span>` : ''}</div>`;
    }).join('');
    $('exSimple').textContent = ex?.s || q.tip || 'Пояснение к этому вопросу пока не добавлено.';
    const w = ex?.w?.[picked];
    $('exWrongWrap').hidden = !w;
    $('exWrong').textContent = w || '';
    $('exRuleWrap').hidden = !ex?.r;
    $('exRule').textContent = ex?.r || '';
    $('exTwistWrap').hidden = !ex?.t;
    $('exTwist').textContent = ex?.t || '';
    $('exTip').textContent = q.tip || '—';
    show('scrFail');
    $('btnRestart').focus({ preventScroll: true });
  }

  // ---------- победа ----------
  function win() {
    $('winText').textContent = `Все ${TOTAL} вопросов подряд без единой ошибки. Попытка №${S.runs}. Ты готов к экзамену.`;
    S.order = null; S.pos = 0; save();
    show('scrWin');
  }

  // ---------- события ----------
  $('btnStart').onclick = newRun;
  $('btnContinue').onclick = renderQuestion;
  $('btnRestart').onclick = newRun;
  $('btnAgain').onclick = newRun;
  $('btnHome').onclick = renderStart;
  $('btnNext').onclick = advance;
  $('answers').addEventListener('click', (e) => {
    const b = e.target.closest('.ans');
    if (b) answer(+b.dataset.i);
  });
  $('autoNext').checked = S.auto;
  $('autoNext').onchange = (e) => { S.auto = e.target.checked; save(); };

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const vis = (id) => !$(id).hidden;
    if (vis('scrQuiz')) {
      if (/^[1-5]$/.test(e.key)) { e.preventDefault(); answer(+e.key - 1); }
      else if (e.key === 'Enter' && !$('okBar').hidden) { e.preventDefault(); advance(); }
    } else if (vis('scrFail') && e.key === 'Enter' && document.activeElement?.id !== 'btnHome') {
      e.preventDefault(); newRun();
    }
  });

  if (!TOTAL) { $('startStats').textContent = 'Не найден data/questions.js. Запусти: node scripts/build-data.mjs'; }
  renderStart();
})();
