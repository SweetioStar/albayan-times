/* ============================================
   THE OPEN ALBAYAN TIMES - HOME LOADER
   ============================================
   Reads data/home-data.json and injects:
   - English Stars week label
   - Stars grouped by grade (3, 4, 5, 6)
   - Latest News list
   ============================================ */

(function () {
    'use strict';

    /* ==========================================
       LOAD DATA
       ========================================== */

    async function loadHomeData() {
        try {
            const response = await fetch('data/home-data.json?v=' + Date.now());
            if (!response.ok) throw new Error('Failed to load home data');
            return await response.json();
        } catch (err) {
            console.warn('[Albayan] Could not load home-data.json:', err);
            return null;
        }
    }

    /* ==========================================
       HERO META
       ========================================== */

    function renderHeroMeta(data) {
        if (!data.english_stars) return;

        const count = Array.isArray(data.english_stars.stars)
            ? data.english_stars.stars.length
            : 0;

        const heroCount = document.getElementById('hero-star-count');
        if (heroCount) heroCount.textContent = count + ' Classes';

        const weekLabel = document.getElementById('stars-week-label');
        if (weekLabel) weekLabel.textContent = data.english_stars.week || 'This Week';
    }

    /* ==========================================
       GROUP STARS BY GRADE
       ==========================================
       Class codes like "3A", "4B", "5C", "6D"
       are grouped by their first character.
       ========================================== */

    function groupByGrade(stars) {
        const groups = { '3': [], '4': [], '5': [], '6': [] };

        stars.forEach((star) => {
            const grade = String(star.class || '').charAt(0);
            if (groups[grade]) {
                groups[grade].push(star);
            }
        });

        return groups;
    }

    /* ==========================================
       RENDER STARS STAGE
       ========================================== */

    function renderStarsStage(data) {
        const container = document.getElementById('stars-stage-container');
        if (!container || !data.english_stars) return;

        const stars = data.english_stars.stars || [];
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

        // Build each grade section
        let html = '';
        ['3', '4', '5', '6'].forEach((grade) => {
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
                        ${list.map(star => renderStarCard(star)).join('')}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    function renderStarCard(star) {
        const initial = getInitial(star.name);
        return `
            <div class="star-card">
                <div class="star-avatar">${escapeHtml(initial)}</div>
                <h4 class="star-name">${escapeHtml(star.name)}</h4>
                <span class="star-class">${escapeHtml(star.class)}</span>
            </div>
        `;
    }

    /* ==========================================
       RENDER NEWS LIST
       ========================================== */

    function renderLatestNews(data) {
        const container = document.getElementById('latest-news-list');
        if (!container || !data.latest_news) return;

        const news = data.latest_news.slice(0, 5);

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
       HELPERS
       ========================================== */

    function getInitial(name) {
        if (!name) return '?';
        return String(name).trim().charAt(0).toUpperCase();
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

    /* ==========================================
       INIT
       ========================================== */

    async function init() {
        const data = await loadHomeData();
        if (!data) return;

        renderHeroMeta(data);
        renderStarsStage(data);
        renderLatestNews(data);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();