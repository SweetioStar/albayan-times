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
            const url = `data/${fileName}.json?v=` + Date.now();
            const response = await fetch(url);
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

    function buildAnnouncementSlide(data) {
        const a = data.announcement;
        let videoHtml = '';

        if (a.videoUrl) {
            if (a.videoType === 'youtube') {
                videoHtml = `<iframe src="${getYouTubeEmbed(a.videoUrl)}" frameborder="0" allowfullscreen></iframe>`;
            } else if (a.videoType === 'local') {
                videoHtml = `<video controls><source src="${escapeHtml(a.videoUrl)}" type="video/mp4"></video>`;
            } else if (a.videoType === 'url') {
                videoHtml = `<iframe src="${escapeHtml(a.videoUrl)}" frameborder="0" allowfullscreen></iframe>`;
            }
        } else if (a.image) {
            videoHtml = `<img src="${escapeHtml(a.image)}" alt="${escapeHtml(a.title)}">`;
        }

        return `
            <div class="swiper-slide">
                <div class="featured-hero announcement-hero">
                    <div class="container">
                        <div class="featured-hero-inner featured-hero-inner-announcement">
                            <div class="featured-hero-content">
                                <span class="featured-hero-badge featured-hero-badge-red">Announcement</span>
                                <h1 class="featured-hero-title">${escapeHtml(a.title)}</h1>
                                ${a.subtitle ? `<p class="featured-hero-subtitle-large">${escapeHtml(a.subtitle)}</p>` : ''}
                                ${a.description ? `<p class="featured-hero-excerpt">${escapeHtml(a.description)}</p>` : ''}
                                ${a.ctaText && a.ctaLink ? `<a href="${escapeHtml(a.ctaLink)}" class="featured-hero-cta">${escapeHtml(a.ctaText)}</a>` : ''}
                            </div>
                            <div class="announcement-media">
                                <div class="announcement-video-wrapper">
                                    ${videoHtml}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
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
        const featuredData = await fetchJSON('featured');
        const starsData = await fetchJSON('english-stars');
        const homeData = await fetchJSON('home-data');

        const wrapper = document.getElementById('hero-swiper-wrapper');
        if (wrapper) {
            let slidesHtml = '';

            // 1. If announcement is active, add it first
            if (featuredData && featuredData.type === 'announcement') {
                slidesHtml += buildAnnouncementSlide(featuredData);
            }

            // 2. Always add English Stars
            slidesHtml += buildEnglishStarsSlide(starsData);

            wrapper.innerHTML = slidesHtml;

            // Initialize Swiper
            new Swiper('.featuredSwiper', {
                loop: false, // We only want to loop if there are multiple slides
                pagination: {
                    el: '.swiper-pagination',
                    clickable: true,
                },
                navigation: {
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev',
                },
                effect: 'slide',
                speed: 600,
            });
        }

        renderStarsStage(starsData);
        renderLatestNews(homeData);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();