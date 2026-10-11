/* ============================================
   ALBAYAN TIMES - HOME LOADER
   ============================================
   Reads data/home-data.json AND
   data/english-stars.json to fill:
   - Hero week (auto-computed from today)
   - Lexi hero image
   - Stars stage (grouped by grade)
   - Latest News list
   ============================================ */

(function () {
    'use strict';

    /* ==========================================
       AUTO WEEK LABEL
       ========================================== */

    function getWeekLabel() {
        const today = new Date();
        const monthNames = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];

        // Get Monday of the current week
        const day = today.getDay();
        const diff = (day === 0 ? -6 : 1) - day; // If Sunday (0), go back 6 days
        const monday = new Date(today);
        monday.setDate(today.getDate() + diff);

        const month = monthNames[monday.getMonth()];
        const date = monday.getDate();
        const year = monday.getFullYear();

        return `Week of ${month} ${date}, ${year}`;
    }

    /* ==========================================
       HELPERS
       ========================================== */

    async function fetchJSON(fileName) {
        try {
            const url = `data/${fileName}.json?v=` + Date.now();
            const response = await fetch(url);
            if (!response.ok) return null;
            return await response.json();
        } catch (err) {
            console.warn('[Albayan] Could not load ' + fileName + '.json:', err);
            return null;
        }
    }

    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function getInitial(name) {
        if (!name) return '?';
        return String(name).trim().charAt(0).toUpperCase();
    }

    /* ==========================================
       HERO META
       ========================================== */

    function renderHeroMeta(starsData) {
        if (!starsData) return;

        const stars = starsData.items || [];
        const count = stars.length;
        const weekLabel = getWeekLabel();

        const heroCount = document.getElementById('hero-star-count');
        if (heroCount) heroCount.textContent = count + ' Classes';

        const heroWeekLabel = document.getElementById('hero-week-label');
        if (heroWeekLabel) heroWeekLabel.textContent = weekLabel;

        const starsWeekLabel = document.getElementById('stars-week-label');
        if (starsWeekLabel) starsWeekLabel.textContent = weekLabel;

        const themeEl = document.getElementById('hero-theme');
        if (themeEl && starsData.theme) themeEl.textContent = starsData.theme;
    }

    /* ==========================================
       STARS STAGE
       ========================================== */

    function groupByGrade(stars) {
        const groups = { '3': [], '4': [], '5': [], '6': [] };
        stars.forEach(star => {
            const grade = String(star.grade || star.class || '').charAt(0);
            if (groups[grade]) groups[grade].push(star);
        });
        return groups;
    }

    function renderStarCard(star) {
        const initial = getInitial(star.name);
        const photoUrl = star.photo
            ? `assets/images/stars/${escapeHtml(star.photo)}`
            : '';

        return `
            <div class="star-card">
                <div class="star-photo">
                    <span class="photo-fallback">${escapeHtml(initial)}</span>
                    ${photoUrl ? `<img src="${photoUrl}" alt="${escapeHtml(star.name)}" onerror="this.style.display='none'">` : ''}
                </div>
                <h3 class="star-name">${escapeHtml(star.name)}</h3>
                <span class="star-class-tag">${escapeHtml(star.class)}</span>
                ${star.badge ? `<span class="star-achievement">${escapeHtml(star.badge)}</span>` : ''}
            </div>
        `;
    }

    function renderStarsStage(starsData) {
        const container = document.getElementById('stars-stage-container');
        if (!container || !starsData || !starsData.items) return;

        const stars = starsData.items;
        if (stars.length === 0) return;

        const groups = groupByGrade(stars);

        const gradeLabels = {
            '3': 'Grade 3',
            '4': 'Grade 4',
            '5': 'Grade 5',
            '6': 'Grade 6'
        };

        const gradeSubtitles = {
            '3': 'Our youngest stars shine bright',
            '4': 'Growing confidence in English',
            '5': 'Reading, writing, and discovering',
            '6': 'Leading by example every day'
        };

        let html = '';
        ['3', '4', '5', '6'].forEach(grade => {
            const list = groups[grade];
            if (!list || list.length === 0) return;

            const rowClass = list.length === 4 ? 'stars-row stars-row-4' : 'stars-row';

            html += `
                <div class="grade-group">
                    <div class="grade-group-header">
                        <div class="grade-badge">${grade}</div>
                        <div>
                            <h3 class="grade-group-title">${gradeLabels[grade]}</h3>
                            <p class="grade-group-subtitle">${gradeSubtitles[grade]}</p>
                        </div>
                    </div>
                    <div class="${rowClass}">
                        ${list.map(renderStarCard).join('')}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    /* ==========================================
       LATEST NEWS
       ========================================== */

    function renderLatestNews(homeData) {
        const container = document.getElementById('latest-news-list');
        if (!container || !homeData || !homeData.latest_news) return;

        const news = homeData.latest_news.slice(0, 5);

        container.innerHTML = news.map((item, index) => `
            <a href="${item.url}" class="home-news-item">
                <span class="home-news-number">${index + 1}</span>
                <div class="home-news-content">
                    <h4 class="home-news-title">${escapeHtml(item.title)}</h4>
                    <span class="home-news-meta">${escapeHtml(item.date)}</span>
                </div>
                <span class="home-news-category">${escapeHtml(item.category)}</span>
            </a>
        `).join('');
    }

    /* ==========================================
       INIT
       ========================================== */

    async function init() {
        const homeData = await fetchJSON('home-data');
        const starsData = await fetchJSON('english-stars');

        renderHeroMeta(starsData);
        renderStarsStage(starsData);
        renderLatestNews(homeData);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();