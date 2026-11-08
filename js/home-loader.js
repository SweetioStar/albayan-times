/* ============================================
   ALBAYAN TIMES - HOME LOADER
   ============================================ */

(function () {
    'use strict';

    function getWeekLabel() {
        const today = new Date();
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const day = today.getDay();
        const sunday = new Date(today);
        sunday.setDate(today.getDate() - day);
        return `${dayNames[sunday.getDay()]}, ${monthNames[sunday.getMonth()]} ${sunday.getDate()}, ${sunday.getFullYear()}`;
    }

    async function fetchJSON(fileName) {
        try {
            const url = `data/${fileName}.json`;
            const response = await fetch(url, { cache: 'no-cache' });
            if (!response.ok) return null;
            return await response.json();
        } catch (err) {
            return null;
        }
    }

    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function getYouTubeEmbed(url) {
        if (!url) return '';
        if (url.includes('youtube.com/embed/')) return url;
        const watchMatch = url.match(/[?&]v=([^&]+)/);
        if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
        const shortMatch = url.match(/youtu\.be\/([^?]+)/);
        if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
        return url;
    }

    /* ==========================================
       BUILD SLIDES
       ========================================== */

    function buildEnglishStarsSlide(starsData) {
        const weekLabel = getWeekLabel();
        const count = starsData ? (starsData.items || []).length : 17;

        return `
            <div class="swiper-slide">
                <div class="featured-hero">
                    <span class="hero-sparkle s1"></span>
                    <span class="hero-sparkle s2"></span>
                    <span class="hero-sparkle s3"></span>
                    <span class="hero-sparkle s4"></span>
                    <div class="container">
                        <div class="featured-hero-inner">
                            <div class="featured-hero-content">
                                <span class="featured-hero-badge">Featured This Week</span>
                                <h1 class="featured-hero-title">English <span class="title-accent">Stars</span></h1>
                                <p class="featured-hero-excerpt">Celebrating our brightest English learners — one shining star from every class section, every week.</p>
                                <div class="featured-hero-meta">
                                    <span class="hero-meta-chip"><span class="chip-icon"></span><span>${weekLabel}</span></span>
                                    <span class="hero-meta-chip"><span class="chip-icon"></span><span>${count} Classes</span></span>
                                    <span class="hero-meta-chip"><span class="chip-icon"></span>English Department</span>
                                </div>
                                <a href="html/english-stars.html" class="featured-hero-cta">Meet the Stars</a>
                            </div>
                            <div class="hero-lexi">
                                <img src="assets/images/lexi/english-stars-hero.png" alt="English Stars" class="hero-lexi-img" onerror="this.src='assets/images/lexi/lexi-hero.png'">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /* ==========================================
       ANNOUNCEMENT
       While active it takes English Stars' place (banner + section below);
       English Stars becomes a thin line at the top.
       ========================================== */

    function parseDay(str, endOfDay) {
        if (!str) return null;
        const parts = String(str).split('-').map(Number);
        if (parts.length !== 3 || parts.some(isNaN)) return null;
        return endOfDay
            ? new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59)
            : new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0);
    }

    function getAnnouncement(featuredData, competitionsData) {
        const s = featuredData && (featuredData.announcement || featuredData.spotlight);
        if (!s || !competitionsData) return null;
        const now = new Date();
        const from = parseDay(s.showFrom, false);
        const until = parseDay(s.showUntil || s.pinToTopUntil, true);
        if (from && now < from) return null;
        if (until && now > until) return null;
        const comp = (competitionsData.items || []).find(c => c.id === s.competitionId);
        return comp ? { settings: s, competition: comp } : null;
    }

    function competitionUrl(c) {
        return `html/article.html?id=${encodeURIComponent(c.id)}`;
    }

    function buildAnnouncementSlide(ann) {
        const s = ann.settings;
        const c = ann.competition;
        const poster = c.image ? `assets/images/content/${escapeHtml(c.image)}` : '';
        const media = c.video
            ? `<video controls preload="metadata" playsinline ${poster ? `poster="${poster}"` : ''}><source src="assets/videos/${escapeHtml(c.video)}" type="video/mp4"></video>`
            : (poster ? `<img src="${poster}" alt="${escapeHtml(c.title)}">` : '');
        return `
            <div class="swiper-slide">
                <div class="featured-hero announcement-hero">
                    <div class="container">
                        <div class="featured-hero-inner featured-hero-inner-announcement">
                            <div class="featured-hero-content">
                                <span class="featured-hero-badge featured-hero-badge-red">${escapeHtml(s.badge || 'Announcement')}</span>
                                <h1 class="featured-hero-title">${escapeHtml(s.title || c.title)}</h1>
                                ${s.subtitle ? `<p class="featured-hero-subtitle-large">${escapeHtml(s.subtitle)}</p>` : ''}
                                <p class="featured-hero-excerpt">${escapeHtml(c.excerpt || '')}</p>
                                <a href="${competitionUrl(c)}" class="featured-hero-cta">${escapeHtml(s.ctaText || 'See All Winners')}</a>
                            </div>
                            <div class="announcement-media">
                                <div class="announcement-video-wrapper">${media}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /* The section under the banner shows the announcement's winners in the English Stars card style */
    function renderAnnouncementSection(ann) {
        const c = ann.competition;
        const container = document.getElementById('stars-stage-container');
        if (!container) return;
        const label = document.getElementById('stars-week-label');
        const title = document.getElementById('stars-stage-title');
        const subtitle = document.getElementById('stars-stage-subtitle');
        if (label) label.textContent = c.title;
        if (title) title.textContent = `Meet Our ${c.title} Winners`;
        if (subtitle) subtitle.textContent = c.winnersTitle ? `${c.winnersTitle} from every grade. Congratulations!` : 'Congratulations to our winners!';

        const cards = (c.winners || []).map(w => renderStarCard({
            name: w.name,
            class: w.class,
            photo: w.photo,
            badge: `Grade ${w.grade || String(w.class || '').charAt(0)}`
        })).join('');
        container.innerHTML = `
            <div class="stars-row">${cards}</div>
            <div class="spotlight-more"><a href="${competitionUrl(c)}" class="featured-hero-cta">Watch the video &amp; leave a comment</a></div>
        `;
    }

    /* English Stars as a thin line while an announcement is on */
    function renderStarsLine(starsData) {
        const el = document.getElementById('spotlight-top');
        if (!el) return;
        const count = starsData ? (starsData.items || []).length : 0;
        el.innerHTML = `
            <a class="stars-line" href="html/english-stars.html">
                <div class="container stars-line-inner">
                    <span class="stars-line-icon">⭐</span>
                    <span class="stars-line-text"><strong>English Stars</strong> ${escapeHtml(getWeekLabel())}${count ? ` · ${count} classes` : ''}</span>
                    <span class="stars-line-cta">See this week's stars &rarr;</span>
                </div>
            </a>
        `;
        el.classList.add('is-visible');
    }

    /* ==========================================
       STARS STAGE (Below Hero)
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
        const initial = star.name ? String(star.name).trim().charAt(0).toUpperCase() : '?';
        const photoUrl = star.photo ? `assets/images/stars/${escapeHtml(star.photo)}` : '';

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
        const gradeLabels = { '3': 'Grade 3', '4': 'Grade 4', '5': 'Grade 5', '6': 'Grade 6' };
        const gradeSubtitles = { '3': 'Our youngest stars shine bright', '4': 'Growing confidence in English', '5': 'Reading, writing, and discovering', '6': 'Leading by example every day' };

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
                    <div class="${rowClass}">${list.map(renderStarCard).join('')}</div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

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
        const newsPromise = fetchJSON('home-data');
        // Decide first (announcement or English Stars), then draw once, so nothing switches on screen
        const [featuredData, competitionsData, starsData] = await Promise.all([
            fetchJSON('featured'), fetchJSON('competitions'), fetchJSON('english-stars')
        ]);
        const ann = getAnnouncement(featuredData, competitionsData);

        const wrapper = document.getElementById('hero-swiper-wrapper');
        if (wrapper) {
            wrapper.innerHTML = ann ? buildAnnouncementSlide(ann) : buildEnglishStarsSlide(starsData);
            const section = document.querySelector('.featured-hero-section');
            if (section) section.classList.add('single-slide');
            if (typeof Swiper !== 'undefined') {
                new Swiper('.featuredSwiper', { loop: false, allowTouchMove: false, speed: 600 });
            }
        }

        if (ann) {
            renderStarsLine(starsData);
            renderAnnouncementSection(ann);
        } else {
            renderStarsStage(starsData);
        }
        document.body.classList.add('home-ready');

        renderLatestNews(await newsPromise);
    }

    // Never leave the page hidden, even if something fails to load
    function safeInit() {
        setTimeout(() => document.body.classList.add('home-ready'), 3000);
        init().catch(err => { console.warn('[Albayan] home:', err); document.body.classList.add('home-ready'); });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', safeInit);
    } else {
        safeInit();
    }

})();