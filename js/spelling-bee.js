/* ============================================
   ALBAYAN TIMES - SPELLING BEE PAGE
   Videos, word lists and two quizzes:
   1. Pick the correct spelling
   2. Listen & Spell (the browser reads the word aloud)
   All content comes from data/spelling-bee.json
   ============================================ */

(function () {
    'use strict';

    const PREFIX = '../';
    const QUIZ_LENGTH = 10;

    function esc(str) {
        if (str === null || str === undefined) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function shuffle(list) {
        const a = list.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    /* Make believable wrong spellings for the "Pick the correct spelling" quiz */
    const VOWELS = 'aeiou';
    function misspellings(word) {
        const w = word;
        const lower = w.toLowerCase();
        const out = new Set();
        const add = v => { if (v && v.toLowerCase() !== lower && /^[A-Za-z'\-]+$/.test(v)) out.add(v); };
        // ie <-> ei
        if (lower.includes('ie')) add(w.replace(/ie/i, 'ei'));
        if (lower.includes('ei')) add(w.replace(/ei/i, 'ie'));
        // double letters: undouble, or double a single consonant
        const dbl = w.match(/([b-df-hj-np-tv-z])\1/i);
        if (dbl) add(w.replace(dbl[0], dbl[1]));
        for (let i = 1; i < w.length - 1; i++) {
            const c = w[i].toLowerCase();
            if (!VOWELS.includes(c) && /[a-z]/.test(c) && VOWELS.includes(w[i - 1].toLowerCase()) && w[i + 1] !== w[i]) {
                add(w.slice(0, i + 1) + w[i] + w.slice(i + 1));
                break;
            }
        }
        // common sound swaps
        [['ph', 'f'], ['ck', 'k'], ['c', 'k'], ['k', 'c'], ['tion', 'shun'], ['ous', 'us'], ['ture', 'cher'],
         ['ough', 'uff'], ['ght', 't'], ['wh', 'w'], ['kn', 'n'], ['mb', 'm'], ['y', 'ey'], ['er', 'ar'],
         ['our', 'or'], ['ea', 'ee'], ['ee', 'ea'], ['ai', 'ay'], ['s', 'z'], ['able', 'ible'], ['ence', 'ance'], ['ance', 'ence']]
            .forEach(([a, b]) => { const i = lower.indexOf(a, 1); if (i > 0) add(w.slice(0, i) + b + w.slice(i + a.length)); });
        // silent e at the end
        if (lower.endsWith('e') && w.length > 4) add(w.slice(0, -1));
        else if (!lower.endsWith('e') && /[^aeiouy]$/.test(lower)) add(w + 'e');
        // change one vowel
        const swaps = { a: 'e', e: 'i', i: 'e', o: 'u', u: 'o' };
        for (let i = 1; i < w.length; i++) {
            const c = w[i].toLowerCase();
            if (swaps[c]) { add(w.slice(0, i) + swaps[c] + w.slice(i + 1)); if (out.size > 6) break; }
        }
        // swap two neighbouring letters in the middle
        if (w.length > 4) { const i = Math.floor(w.length / 2); add(w.slice(0, i - 1) + w[i] + w[i - 1] + w.slice(i + 1)); }
        if (out.size < 2) { add(w.replace(/y$/i, 'ie')); add(w.replace(/y$/i, 'i')); add(w + w.slice(-1)); }
        return shuffle([...out]);
    }

    function parseWord(entry) {
        const parts = String(entry).split('|').map(s => s.trim()).filter(Boolean);
        return { word: parts[0], wrong: parts.length > 1 ? parts.slice(1) : misspellings(parts[0]) };
    }

    let DATA = null;

    /* ---------------- VIDEOS ---------------- */
    function renderVideos(videos) {
        if (!videos || !videos.length) return '';
        return `
            <section class="bee-block" id="bee-videos">
                <div class="bee-block-head">
                    <span class="bee-block-icon">▶</span>
                    <div><h2>Watch &amp; Practice</h2><p>Real spelling bee practice videos. Press play and spell along!</p></div>
                </div>
                <div class="bee-video-grid">
                    ${videos.map(v => `
                        <article class="bee-video">
                            <button type="button" class="bee-video-thumb" data-youtube="${esc(v.youtube)}" aria-label="Play ${esc(v.title)}">
                                <img src="https://i.ytimg.com/vi/${esc(v.youtube)}/hqdefault.jpg" alt="" loading="lazy">
                                <span class="bee-video-play"></span>
                            </button>
                            <div class="bee-video-body">
                                <span class="bee-level">${esc(v.level)}</span>
                                <h3>${esc(v.title)}</h3>
                                <p>${esc(v.description)}</p>
                                <a href="https://www.youtube.com/watch?v=${esc(v.youtube)}" target="_blank" rel="noopener">Open on YouTube ↗</a>
                            </div>
                        </article>
                    `).join('')}
                </div>
            </section>
        `;
    }

    function bindVideos(root) {
        root.querySelectorAll('.bee-video-thumb').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.youtube;
                const frame = document.createElement('iframe');
                frame.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0`;
                frame.title = 'Spelling bee video';
                frame.allow = 'autoplay; encrypted-media; picture-in-picture';
                frame.allowFullscreen = true;
                frame.className = 'bee-video-frame';
                btn.replaceWith(frame);
            });
        });
    }

    /* ---------------- GRADE PICKER ---------------- */
    function gradeButtons(group, active) {
        return DATA.grades.map(g =>
            `<button type="button" class="bee-grade-btn${g.key === active ? ' active' : ''}" data-group="${group}" data-grade="${esc(g.key)}">${esc(g.label)}</button>`
        ).join('');
    }

    function getGrade(key) {
        return DATA.grades.find(g => g.key === key) || DATA.grades[0];
    }

    /* ---------------- WORD LISTS ---------------- */
    function renderWordList(key) {
        const g = getGrade(key);
        const countEl = document.getElementById('bee-word-count');
        if (countEl) countEl.textContent = `${g.words.length} words`;
        return g.words.map((w, i) => `<li><span class="bee-word-num">${i + 1}</span>${esc(parseWord(w).word)}</li>`).join('');
    }

    function renderWordListsBlock() {
        const first = DATA.grades[0].key;
        return `
            <section class="bee-block" id="bee-words">
                <div class="bee-block-head">
                    <span class="bee-block-icon">Aa</span>
                    <div><h2>Word Lists</h2><p>Learn the words for your grade. Say each word, spell it out loud, then write it.</p></div>
                </div>
                <div class="bee-grade-row">${gradeButtons('words', first)}</div>
                <p class="bee-word-count" id="bee-word-count">${getGrade(first).words.length} words</p>
                <ol class="bee-word-list" id="bee-word-list">${renderWordList(first)}</ol>
                <p class="bee-tip">Tip: Press <strong>Listen</strong> in the quiz below to hear any word read out loud.</p>
            </section>
        `;
    }

    /* ---------------- QUIZ 1: PICK THE CORRECT SPELLING ---------------- */
    const choiceState = { grade: null, items: [], index: 0, score: 0, answered: false };

    function startChoiceQuiz(key) {
        const g = getGrade(key);
        choiceState.grade = g.key;
        choiceState.items = shuffle(g.words.map(parseWord).filter(w => w.wrong.length)).slice(0, QUIZ_LENGTH)
            .map(w => ({ word: w.word, options: shuffle([w.word].concat(w.wrong.slice(0, 2))) }));
        choiceState.index = 0;
        choiceState.score = 0;
        choiceState.answered = false;
        drawChoice();
    }

    function drawChoice() {
        const box = document.getElementById('bee-choice-quiz');
        if (!box) return;
        const s = choiceState;
        if (s.index >= s.items.length) {
            box.innerHTML = finishHtml(s.score, s.items.length, 'choice');
            return;
        }
        const item = s.items[s.index];
        box.innerHTML = `
            <div class="bee-quiz-progress"><span>Question ${s.index + 1} of ${s.items.length}</span><span>Score: ${s.score}</span></div>
            <div class="bee-progress-bar"><span style="width:${(s.index / s.items.length) * 100}%"></span></div>
            <p class="bee-quiz-question">Which word is spelled correctly?</p>
            <div class="bee-options">
                ${item.options.map(o => `<button type="button" class="bee-option" data-value="${esc(o)}">${esc(o)}</button>`).join('')}
            </div>
            <p class="bee-feedback" id="bee-choice-feedback" aria-live="polite"></p>
            <button type="button" class="bee-next" id="bee-choice-next" hidden>Next word →</button>
        `;
        box.querySelectorAll('.bee-option').forEach(btn => btn.addEventListener('click', () => answerChoice(btn)));
        box.querySelector('#bee-choice-next').addEventListener('click', () => { s.index++; s.answered = false; drawChoice(); });
    }

    function answerChoice(btn) {
        const s = choiceState;
        if (s.answered) return;
        s.answered = true;
        const item = s.items[s.index];
        const correct = btn.dataset.value === item.word;
        if (correct) s.score++;
        document.querySelectorAll('#bee-choice-quiz .bee-option').forEach(b => {
            b.disabled = true;
            if (b.dataset.value === item.word) b.classList.add('correct');
            else if (b === btn) b.classList.add('wrong');
        });
        const fb = document.getElementById('bee-choice-feedback');
        fb.textContent = correct ? 'Correct! Great job! 🐝' : `Not quite. The correct spelling is “${item.word}”.`;
        fb.className = 'bee-feedback ' + (correct ? 'is-correct' : 'is-wrong');
        const next = document.getElementById('bee-choice-next');
        next.hidden = false;
        if (s.index === s.items.length - 1) next.textContent = 'See my score →';
        next.focus();
    }

    /* ---------------- QUIZ 2: LISTEN & SPELL ---------------- */
    const listenState = { grade: null, items: [], index: 0, score: 0, answered: false };
    const canSpeak = typeof window.speechSynthesis !== 'undefined' && typeof window.SpeechSynthesisUtterance !== 'undefined';

    function speak(word) {
        if (!canSpeak) return;
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(word);
        u.lang = 'en-US';
        u.rate = 0.8;
        const voices = window.speechSynthesis.getVoices();
        const en = voices.find(v => /^en(-|_)/i.test(v.lang));
        if (en) u.voice = en;
        window.speechSynthesis.speak(u);
    }

    function startListenQuiz(key) {
        const g = getGrade(key);
        listenState.grade = g.key;
        listenState.items = shuffle(g.words.map(w => parseWord(w).word)).slice(0, QUIZ_LENGTH);
        listenState.index = 0;
        listenState.score = 0;
        listenState.answered = false;
        drawListen();
    }

    function drawListen() {
        const box = document.getElementById('bee-listen-quiz');
        if (!box) return;
        const s = listenState;
        if (!canSpeak) {
            box.innerHTML = `<p class="bee-feedback is-wrong">Your browser can't read words out loud. Please try Chrome, Safari or Edge, or use the "Pick the correct spelling" quiz.</p>`;
            return;
        }
        if (s.index >= s.items.length) {
            box.innerHTML = finishHtml(s.score, s.items.length, 'listen');
            return;
        }
        box.innerHTML = `
            <div class="bee-quiz-progress"><span>Word ${s.index + 1} of ${s.items.length}</span><span>Score: ${s.score}</span></div>
            <div class="bee-progress-bar"><span style="width:${(s.index / s.items.length) * 100}%"></span></div>
            <button type="button" class="bee-listen-btn" id="bee-listen-play">🔊 Listen to the word</button>
            <form class="bee-spell-form" id="bee-spell-form" autocomplete="off">
                <label for="bee-spell-input" class="bee-quiz-question">Type the word you hear:</label>
                <div class="bee-spell-row">
                    <input id="bee-spell-input" type="text" spellcheck="false" autocapitalize="off" autocorrect="off" placeholder="Type here…">
                    <button type="submit" class="bee-check">Check</button>
                </div>
            </form>
            <p class="bee-feedback" id="bee-listen-feedback" aria-live="polite"></p>
            <button type="button" class="bee-next" id="bee-listen-next" hidden>Next word →</button>
        `;
        const word = s.items[s.index];
        box.querySelector('#bee-listen-play').addEventListener('click', () => speak(word));
        box.querySelector('#bee-spell-form').addEventListener('submit', e => { e.preventDefault(); checkListen(); });
        box.querySelector('#bee-listen-next').addEventListener('click', () => { s.index++; s.answered = false; drawListen(); });
    }

    function checkListen() {
        const s = listenState;
        if (s.answered) return;
        const input = document.getElementById('bee-spell-input');
        const typed = input.value.trim();
        if (!typed) { input.focus(); return; }
        s.answered = true;
        const word = s.items[s.index];
        const correct = typed.toLowerCase() === word.toLowerCase();
        if (correct) s.score++;
        input.disabled = true;
        input.classList.add(correct ? 'correct' : 'wrong');
        const fb = document.getElementById('bee-listen-feedback');
        fb.textContent = correct ? 'Correct! You spelled it perfectly! 🐝' : `Good try! It's spelled “${word}”.`;
        fb.className = 'bee-feedback ' + (correct ? 'is-correct' : 'is-wrong');
        const next = document.getElementById('bee-listen-next');
        next.hidden = false;
        if (s.index === s.items.length - 1) next.textContent = 'See my score →';
        next.focus();
    }

    /* ---------------- SHARED ---------------- */
    function finishHtml(score, total, kind) {
        const pct = total ? score / total : 0;
        const msg = pct === 1 ? 'Perfect score! You are a spelling champion! 🏆'
            : pct >= 0.7 ? 'Great work! Keep practicing and you will be unstoppable!'
            : 'Good effort! Study the word list and try again.';
        return `
            <div class="bee-finish">
                <span class="bee-finish-score">${score} / ${total}</span>
                <p>${msg}</p>
                <button type="button" class="bee-next" data-restart="${kind}">Try again</button>
            </div>
        `;
    }

    function renderQuizBlock() {
        const first = DATA.grades[0].key;
        return `
            <section class="bee-block" id="bee-quizzes">
                <div class="bee-block-head">
                    <span class="bee-block-icon">?</span>
                    <div><h2>Quizzes</h2><p>Choose your grade and test yourself. Every quiz picks ${QUIZ_LENGTH} random words, so it's different each time!</p></div>
                </div>
                <div class="bee-quiz-grid">
                    <div class="bee-quiz-card">
                        <h3>Pick the Correct Spelling</h3>
                        <div class="bee-grade-row">${gradeButtons('choice', first)}</div>
                        <div class="bee-quiz-box" id="bee-choice-quiz"></div>
                    </div>
                    <div class="bee-quiz-card">
                        <h3>Listen &amp; Spell</h3>
                        <div class="bee-grade-row">${gradeButtons('listen', first)}</div>
                        <div class="bee-quiz-box" id="bee-listen-quiz"></div>
                    </div>
                </div>
            </section>
        `;
    }

    function renderLinks(links) {
        if (!links || !links.length) return '';
        return `
            <section class="bee-block" id="bee-links">
                <div class="bee-block-head">
                    <span class="bee-block-icon">↗</span>
                    <div><h2>More Practice</h2><p>Trusted websites with more spelling bee words and tips.</p></div>
                </div>
                <div class="bee-link-grid">
                    ${links.map(l => `
                        <a class="bee-link" href="${esc(l.url)}" target="_blank" rel="noopener">
                            <strong>${esc(l.title)}</strong>
                            <span>${esc(l.description)}</span>
                        </a>
                    `).join('')}
                </div>
            </section>
        `;
    }

    function bindGradeButtons(root) {
        root.addEventListener('click', e => {
            const btn = e.target.closest('.bee-grade-btn');
            if (btn) {
                const group = btn.dataset.group;
                root.querySelectorAll(`.bee-grade-btn[data-group="${group}"]`).forEach(b => b.classList.toggle('active', b === btn));
                if (group === 'words') document.getElementById('bee-word-list').innerHTML = renderWordList(btn.dataset.grade);
                if (group === 'choice') startChoiceQuiz(btn.dataset.grade);
                if (group === 'listen') startListenQuiz(btn.dataset.grade);
                return;
            }
            const restart = e.target.closest('[data-restart]');
            if (restart) {
                if (restart.dataset.restart === 'choice') startChoiceQuiz(choiceState.grade);
                else startListenQuiz(listenState.grade);
            }
        });
    }

    async function init() {
        const container = document.getElementById('bee-content');
        if (!container) return;
        try {
            const res = await fetch(`${PREFIX}data/spelling-bee.json`, { cache: 'no-cache' });
            if (!res.ok) throw new Error('load failed');
            DATA = await res.json();
        } catch (err) {
            container.innerHTML = '<div class="empty-state"><h3>Could not load the Spelling Bee page</h3><p>Please refresh and try again.</p></div>';
            return;
        }

        if (DATA.intro) {
            const t = document.getElementById('bee-hero-title');
            const st = document.getElementById('bee-hero-subtitle');
            const d = document.getElementById('bee-hero-description');
            if (t) t.textContent = DATA.intro.title;
            if (st) st.textContent = DATA.intro.subtitle;
            if (d) d.textContent = DATA.intro.description;
        }

        const nav = document.getElementById('bee-filter-bar');
        if (nav) {
            nav.innerHTML = [
                ['#bee-videos', 'Videos'], ['#bee-words', 'Word Lists'], ['#bee-quizzes', 'Quizzes'], ['#bee-links', 'More Practice']
            ].map(([href, label]) => `<a class="bee-jump" href="${href}">${label}</a>`).join('');
        }

        container.innerHTML = renderVideos(DATA.videos) + renderWordListsBlock() + renderQuizBlock() + renderLinks(DATA.links);
        bindVideos(container);
        bindGradeButtons(container);
        const first = DATA.grades[0].key;
        startChoiceQuiz(first);
        startListenQuiz(first);
        if (canSpeak) window.speechSynthesis.getVoices();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
