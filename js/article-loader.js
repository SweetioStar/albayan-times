/* ============================================
   ALBAYAN TIMES - ARTICLE LOADER
   ============================================ */

(function () {
    'use strict';

    function detectPrefix() {
        const path = window.location.pathname;
        if (path.includes('/html/')) return '../';
        return '';
    }

    const PREFIX = detectPrefix();

    const DATA_FILES = [
        'news', 'young-writers', 'watch', 'book-corner',
        'creative-corner', 'reporters', 'archive', 'english-stars',
        'spelling-bee', 'enrichment', 'contest', 'lexis-advice'
    ];

    /* HELPERS */
    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function getIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    }

    function getImageUrl(item, defaultFolder) {
        if (!item.image) return '';
        const folder = item.imageFolder || defaultFolder || 'content';
        return `${PREFIX}assets/images/${folder}/${item.image}`;
    }

    function buildBodyHtml(body) {
        if (!body) return '';
        return String(body).split('\n\n').map(p => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`).join('');
    }

    function getCategoryBadgeClass(category) {
        const map = { 'school-news': 'badge-school-news', 'events': 'badge-events', 'health': 'badge-health', 'values': 'badge-values', 'young-writers': 'badge-young-writers', 'watch': 'badge-watch', 'book-corner': 'badge-book-corner', 'creative': 'badge-creative-corner', 'ai-creations': 'badge-coral', 'life-experiences': 'badge-teal', 'interview': 'badge-teal', 'advice': 'badge-yellow', 'contest': 'badge-coral' };
        return map[category] || 'badge-news';
    }

    function getCategoryLabel(category) {
        const map = { 'school-news': 'School News', 'young-writers': 'Young Writers', 'ai-creations': 'AI Creations', 'life-experiences': 'Life Experiences', 'book-corner': 'Book/Movie', 'creative': 'Creative', 'contest': 'Contest' };
        return map[category] || (category ? category.charAt(0).toUpperCase() + category.slice(1) : '');
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

    /* FETCH */
    async function loadAllData() {
        const results = await Promise.all(
            DATA_FILES.map(async (fileName) => {
                try {
                    const url = `${PREFIX}data/${fileName}.json?v=` + Date.now();
                    const response = await fetch(url);
                    if (!response.ok) return { fileName, items: [] };
                    const data = await response.json();
                    const items = Array.isArray(data) ? data : (data.items || []);
                    return { fileName, items };
                } catch (err) { return { fileName, items: [] }; }
            })
        );
        const all = [];
        results.forEach(({ fileName, items }) => {
            items.forEach(item => { all.push({ ...item, _source: fileName }); });
        });
        return all;
    }

    function findItemById(items, id) {
        return items.find(item => item.id === id);
    }

    /* LAYOUTS */
    function renderArticleLayout(item) {
        const imgUrl = getImageUrl(item, 'content');
        return `
            <article class="detail-article">
                ${imgUrl ? `<div class="detail-hero-image"><img src="${imgUrl}" alt="${escapeHtml(item.title)}" onerror="this.style.display='none'"></div>` : ''}
                <div class="detail-body">${buildBodyHtml(item.body || item.excerpt || 'Full content coming soon.')}</div>
            </article>
        `;
    }

    function renderVideoLayout(item) {
        const source = item.source || 'youtube';
        const videoUrl = item.video || '';
        let embedHtml = '';

        if (source === 'youtube') {
            embedHtml = `<div class="detail-video-wrapper"><iframe src="${getYouTubeEmbed(videoUrl)}" frameborder="0" allowfullscreen></iframe></div>`;
        } else if (source === 'local') {
            embedHtml = `<div class="detail-video-wrapper"><video controls><source src="${PREFIX}assets/videos/${escapeHtml(videoUrl)}" type="video/mp4"></video></div>`;
        } else if (source === 'url') {
            embedHtml = `<div class="detail-video-wrapper"><iframe src="${escapeHtml(videoUrl)}" frameborder="0" allowfullscreen></iframe></div>`;
        }

        return `<article class="detail-video">${embedHtml}<div class="detail-body">${buildBodyHtml(item.body || item.excerpt || '')}</div></article>`;
    }

    function renderBookLayout(item, typeLabel) {
        const folder = item.type === 'movie' ? 'movies' : 'books';
        const imgUrl = getImageUrl(item, folder);
        return `
            <article class="detail-book">
                <div class="detail-book-inner">
                    <div class="detail-book-cover">${imgUrl ? `<img src="${imgUrl}" alt="${escapeHtml(item.title)}" onerror="this.style.display='none'">` : ''}</div>
                    <div class="detail-book-info">
                        <span class="detail-type-badge">${escapeHtml(typeLabel)}</span>
                        <h2 class="detail-book-title">${escapeHtml(item.title)}</h2>
                        <p class="detail-book-creator">${escapeHtml(item.creator || '')}</p>
                        <div class="detail-recommender">
                            <span class="detail-recommender-label">Recommended by</span>
                            <span class="detail-recommender-name">${escapeHtml(item.recommendedBy || 'Albayan Student')}</span>
                            ${item.grade ? `<span class="detail-recommender-grade">Grade ${escapeHtml(item.grade)}</span>` : ''}
                        </div>
                    </div>
                </div>
                <div class="detail-body">${buildBodyHtml(item.body || item.excerpt || 'Review coming soon.')}</div>
            </article>
        `;
    }

    function renderContestLayout(item) {
        const heroImage = getImageUrl(item, 'content');
        const hasWinners = Array.isArray(item.winners) && item.winners.length > 0;
        const hasGallery = Array.isArray(item.gallery) && item.gallery.length > 0;

        const introHtml = `
            <div class="contest-intro">
                <div class="contest-intro-image">
                    ${heroImage ? `<img src="${heroImage}" alt="${escapeHtml(item.title)}" onerror="this.style.display='none'">` : ''}
                </div>
                <div class="contest-intro-content">
                    <span class="contest-intro-label">Contest</span>
                    <h2 class="contest-intro-title">${escapeHtml(item.title)}</h2>
                    <div class="contest-intro-meta">
                        <span>${escapeHtml(item.date || '')}</span>
                        ${item.theme ? `<span class="meta-divider">|</span><span>Theme: ${escapeHtml(item.theme)}</span>` : ''}
                    </div>
                    <p class="contest-intro-excerpt">${escapeHtml(item.body || item.excerpt || '')}</p>
                </div>
            </div>
        `;

        let winnersHtml = '';
        if (hasWinners) {
            winnersHtml = `
                <div class="contest-winners">
                    <div class="winners-header">
                        <h3>Winners</h3>
                        <p>Chosen for creativity, composition, and storytelling</p>
                    </div>
                    <div class="winners-grid">
                        ${item.winners.map(winner => {
                            const placeClass = winner.place === 1 ? 'first-place' : winner.place === 2 ? 'second-place' : 'third-place';
                            return `
                                <div class="winner-card ${placeClass}">
                                    <div class="winner-image">
                                        <span class="winner-rank">${winner.place}</span>
                                        <img src="${getImageUrl(winner, 'content')}" alt="${escapeHtml(winner.name)}" onerror="this.style.display='none'">
                                    </div>
                                    <div class="winner-body">
                                        <h4 class="winner-name">${escapeHtml(winner.name)}</h4>
                                        <span class="winner-grade">Grade ${escapeHtml(winner.grade)}</span>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }

        let galleryHtml = '';
        if (hasGallery) {
            const galleryTitle = item.category === 'albayan-author' ? 'All Stories' : 'All Submissions';
            galleryHtml = `
                <div class="contest-gallery">
                    <div class="gallery-header">
                        <h3>${galleryTitle}</h3>
                    </div>
                    <div class="contest-gallery-grid">
                        ${item.gallery.map(entry => `
                            <div class="contest-photo">
                                <div class="contest-photo-image">
                                    <img src="${getImageUrl(entry, 'content')}" alt="${escapeHtml(entry.name)}" onerror="this.style.display='none'">
                                </div>
                                <div class="contest-photo-body">
                                    <h4 class="contest-photo-title">${escapeHtml(entry.name)}</h4>
                                    <span class="contest-photo-author">${escapeHtml(entry.author)}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        return `
            <article class="detail-contest">
                ${introHtml}
                ${winnersHtml}
                ${galleryHtml}
            </article>
        `;
    }

    function renderByType(item) {
        const type = item.type || 'article';
        switch (type) {
            case 'article':   return renderArticleLayout(item);
            case 'video':     return renderVideoLayout(item);
            case 'book':      return renderBookLayout(item, 'Book');
            case 'movie':     return renderBookLayout(item, 'Movie');
            case 'contest':   return renderContestLayout(item);
            case 'interview': return renderArticleLayout(item); // Fallback for simple text
            case 'advice':    return renderArticleLayout(item); // Fallback
            default:          return renderArticleLayout(item);
        }
    }

    /* FILL PAGE */
    function fillPage(item) {
        document.title = `${item.title} | Albayan Times`;
        
        // Hide category badge for contests since they have their own label
        const badgeEl = document.getElementById('detail-badge');
        if (badgeEl) {
            if (item.type === 'contest') {
                badgeEl.style.display = 'none';
            } else if (item.category) {
                badgeEl.textContent = getCategoryLabel(item.category) || item.category;
                badgeEl.className = 'detail-badge ' + getCategoryBadgeClass(item.category);
            }
        }

        const titleEl = document.getElementById('detail-title');
        if (titleEl) titleEl.textContent = item.title || 'Untitled';

        // Hide the meta row for contests since the layout handles it
        const metaEl = document.getElementById('detail-meta');
        if (metaEl) {
            if (item.type === 'contest') {
                metaEl.style.display = 'none';
            } else {
                const author = item.author || item.recommendedBy || item.creator || '';
                const date = item.date || '';
                const grade = item.grade ? `Grade ${item.grade}` : '';
                metaEl.innerHTML = [
                    author ? `<span class="meta-author">${escapeHtml(author)}</span>` : '',
                    date ? `<span>${escapeHtml(date)}</span>` : '',
                    grade ? `<span class="meta-category">${escapeHtml(grade)}</span>` : ''
                ].filter(Boolean).join('<span class="meta-divider">|</span>');
            }
        }

        const contentEl = document.getElementById('detail-content');
        if (contentEl) contentEl.innerHTML = renderByType(item);

        const crumbEl = document.getElementById('detail-crumb-current');
        if (crumbEl) crumbEl.textContent = item.title || '';

        const crumbSectionEl = document.getElementById('detail-crumb-section');
        if (crumbSectionEl && item._source) {
            const sectionNames = { 'news': 'News', 'young-writers': 'Young Writers', 'watch': 'Watch', 'book-corner': 'Book/Movie Suggestions', 'creative-corner': 'Creative Corner', 'reporters': 'Meet the Reporters', 'archive': 'Archive', 'english-stars': 'English Stars', 'spelling-bee': 'Spelling Bee', 'enrichment': 'Enrichment', 'contest': 'Contest', 'lexis-advice': "Lexi's Advice" };
            crumbSectionEl.textContent = sectionNames[item._source] || 'Content';
            
            const sectionUrls = { 'news': 'news.html', 'young-writers': 'young-writers.html', 'watch': 'watch.html', 'book-corner': 'book-corner.html', 'creative-corner': 'creative-corner.html', 'reporters': 'meet-the-reporters.html', 'archive': 'archive.html', 'english-stars': 'english-stars.html', 'spelling-bee': 'spelling-bee.html', 'enrichment': 'enrichment.html', 'contest': 'contest.html', 'lexis-advice': 'lexis-advice.html' };
            crumbSectionEl.href = sectionUrls[item._source] || '#';
        }
    }

    function showNotFound() {
        const contentEl = document.getElementById('detail-content');
        if (contentEl) contentEl.innerHTML = `<div class="empty-state"><h3>Content not found</h3><p>The article you're looking for might have been moved or doesn't exist yet.</p><a href="${PREFIX}index.html" class="btn btn-primary">Back to Home</a></div>`;
        const titleEl = document.getElementById('detail-title');
        if (titleEl) titleEl.textContent = 'Not Found';
        const metaEl = document.getElementById('detail-meta');
        if (metaEl) metaEl.innerHTML = '';
        const badgeEl = document.getElementById('detail-badge');
        if (badgeEl) badgeEl.style.display = 'none';
    }

    /* INIT */
    async function init() {
        const id = getIdFromUrl();
        if (!id) { showNotFound(); return; }
        const allItems = await loadAllData();
        const item = findItemById(allItems, id);
        if (!item) { showNotFound(); return; }
        fillPage(item);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();