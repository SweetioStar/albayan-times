/* ============================================
   THE OPEN ALBAYAN TIMES - ARTICLE LOADER
   ============================================
   Reads ?id=xyz from the URL, searches every
   data/*.json file for the matching item,
   and fills the detail page.

   Detail page layout adapts based on item.type:
   - article  → featured image + body text
   - video    → embedded player (local/YouTube/URL)
   - book     → cover + description
   - movie    → cover + description
   - image    → full image + caption
   - interview → Q&A layout
   - advice   → advice layout
   ============================================ */

(function () {
    'use strict';

    /* ==========================================
       PATH PREFIX DETECTION
       ========================================== */

    function detectPrefix() {
        const path = window.location.pathname;
        if (path.includes('/html/')) return '../';
        return '';
    }

    const PREFIX = detectPrefix();

    /* ==========================================
       LIST OF DATA FILES TO SEARCH
       ========================================== */

    const DATA_FILES = [
        'news',
        'young-writers',
        'watch',
        'book-corner',
        'creative-corner',
        'reporters',
        'archive',
        'english-stars',
        'spelling-bee',
        'enrichment',
        'contest',
        'lexis-advice'
    ];

    /* ==========================================
       HELPERS
       ========================================== */

    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
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

    // Convert body text with \n\n to paragraphs
    function buildBodyHtml(body) {
        if (!body) return '';
        return String(body)
            .split('\n\n')
            .map(p => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
            .join('');
    }

    // Detect category badge class
    function getCategoryBadgeClass(category) {
        const map = {
            'school-news': 'badge-school-news',
            'events': 'badge-events',
            'health': 'badge-health',
            'values': 'badge-values',
            'young-writers': 'badge-young-writers',
            'watch': 'badge-watch',
            'book-corner': 'badge-book-corner',
            'creative': 'badge-creative-corner',
            'ai-creations': 'badge-mint',
            'life-experiences': 'badge-teal',
            'interview': 'badge-teal',
            'advice': 'badge-yellow',
            'contest': 'badge-coral'
        };
        return map[category] || 'badge-news';
    }

    function getCategoryLabel(category) {
        const map = {
            'school-news': 'School News',
            'young-writers': 'Young Writers',
            'ai-creations': 'AI Creations',
            'life-experiences': 'Life Experiences',
            'book-corner': 'Book/Movie',
            'creative': 'Creative'
        };
        return map[category] || (category ? category.charAt(0).toUpperCase() + category.slice(1) : '');
    }

    // Parse YouTube URL into embed URL
    function getYouTubeEmbed(url) {
        if (!url) return '';
        // Already an embed URL
        if (url.includes('youtube.com/embed/')) return url;
        // Watch URL
        const watchMatch = url.match(/[?&]v=([^&]+)/);
        if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
        // youtu.be short URL
        const shortMatch = url.match(/youtu\.be\/([^?]+)/);
        if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
        return url;
    }

    /* ==========================================
       FETCH DATA
       ========================================== */

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
                } catch (err) {
                    return { fileName, items: [] };
                }
            })
        );

        // Flatten into one array
        const all = [];
        results.forEach(({ fileName, items }) => {
            items.forEach(item => {
                all.push({ ...item, _source: fileName });
            });
        });
        return all;
    }

    function findItemById(items, id) {
        return items.find(item => item.id === id);
    }

    /* ==========================================
       RENDERERS BY TYPE
       ========================================== */

    function renderArticleLayout(item) {
        const imgUrl = getImageUrl(item, 'content');

        return `
            <article class="detail-article">
                ${imgUrl ? `
                    <div class="detail-hero-image">
                        <img src="${imgUrl}" alt="${escapeHtml(item.title)}">
                    </div>
                ` : ''}

                <div class="detail-body">
                    ${buildBodyHtml(item.body || item.excerpt || 'Full content coming soon.')}
                </div>
            </article>
        `;
    }

    function renderVideoLayout(item) {
        const source = item.source || 'youtube';
        const videoUrl = item.video || '';
        let embedHtml = '';

        if (source === 'youtube') {
            embedHtml = `
                <div class="detail-video-wrapper">
                    <iframe src="${getYouTubeEmbed(videoUrl)}"
                            frameborder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowfullscreen></iframe>
                </div>
            `;
        } else if (source === 'local') {
            embedHtml = `
                <div class="detail-video-wrapper">
                    <video controls>
                        <source src="${PREFIX}assets/videos/${escapeHtml(videoUrl)}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                </div>
            `;
        } else if (source === 'url') {
            embedHtml = `
                <div class="detail-video-wrapper">
                    <iframe src="${escapeHtml(videoUrl)}"
                            frameborder="0"
                            allow="autoplay; encrypted-media"
                            allowfullscreen></iframe>
                </div>
            `;
        }

        return `
            <article class="detail-video">
                ${embedHtml}

                <div class="detail-body">
                    ${buildBodyHtml(item.body || item.excerpt || '')}
                </div>
            </article>
        `;
    }

    function renderBookLayout(item, typeLabel) {
        const folder = item.type === 'movie' ? 'movies' : 'books';
        const imgUrl = getImageUrl(item, folder);

        return `
            <article class="detail-book">
                <div class="detail-book-inner">
                    <div class="detail-book-cover">
                        ${imgUrl ? `<img src="${imgUrl}" alt="${escapeHtml(item.title)}">` : ''}
                    </div>
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
                <div class="detail-body">
                    ${buildBodyHtml(item.body || item.excerpt || 'Review coming soon.')}
                </div>
            </article>
        `;
    }

    function renderImageLayout(item) {
        const imgUrl = getImageUrl(item, 'creative');
        const caption = item.caption || item.excerpt || '';

        return `
            <article class="detail-image">
                ${imgUrl ? `
                    <div class="detail-full-image">
                        <img src="${imgUrl}" alt="${escapeHtml(item.title)}">
                    </div>
                ` : ''}
                ${caption ? `<p class="detail-image-caption">${escapeHtml(caption)}</p>` : ''}
                <div class="detail-body">
                    ${buildBodyHtml(item.body || '')}
                </div>
            </article>
        `;
    }

    function renderInterviewLayout(item) {
        const imgUrl = getImageUrl(item, 'content');

        return `
            <article class="detail-interview">
                ${imgUrl ? `
                    <div class="detail-hero-image">
                        <img src="${imgUrl}" alt="${escapeHtml(item.title)}">
                    </div>
                ` : ''}

                <div class="detail-body">
                    ${buildBodyHtml(item.body || item.excerpt || 'Interview coming soon.')}
                </div>
            </article>
        `;
    }

    function renderAdviceLayout(item) {
        const imgUrl = getImageUrl(item, 'content');

        return `
            <article class="detail-advice">
                ${imgUrl ? `
                    <div class="detail-hero-image">
                        <img src="${imgUrl}" alt="${escapeHtml(item.title)}">
                    </div>
                ` : ''}

                <div class="detail-body">
                    ${buildBodyHtml(item.body || item.excerpt || 'Advice coming soon.')}
                </div>
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
            case 'image':     return renderImageLayout(item);
            case 'interview': return renderInterviewLayout(item);
            case 'advice':    return renderAdviceLayout(item);
            default:          return renderArticleLayout(item);
        }
    }

    /* ==========================================
       FILL THE PAGE
       ========================================== */

    function fillPage(item) {
        // Title
        document.title = `${item.title} | The Open Albayan Times`;

        // Category badge
        const badgeEl = document.getElementById('detail-badge');
        if (badgeEl && item.category) {
            badgeEl.textContent = getCategoryLabel(item.category) || item.category;
            badgeEl.className = 'detail-badge ' + getCategoryBadgeClass(item.category);
        }

        // Main title
        const titleEl = document.getElementById('detail-title');
        if (titleEl) titleEl.textContent = item.title || 'Untitled';

        // Meta row
        const metaEl = document.getElementById('detail-meta');
        if (metaEl) {
            const author = item.author || item.recommendedBy || item.creator || '';
            const date = item.date || '';
            const grade = item.grade ? `Grade ${item.grade}` : '';
            metaEl.innerHTML = [
                author ? `<span class="meta-author">${escapeHtml(author)}</span>` : '',
                date ? `<span>${escapeHtml(date)}</span>` : '',
                grade ? `<span class="meta-category">${escapeHtml(grade)}</span>` : ''
            ].filter(Boolean).join('<span class="meta-divider">|</span>');
        }

        // Body content
        const contentEl = document.getElementById('detail-content');
        if (contentEl) contentEl.innerHTML = renderByType(item);

        // Breadcrumbs
        const crumbEl = document.getElementById('detail-crumb-current');
        if (crumbEl) crumbEl.textContent = item.title || '';

        const crumbSectionEl = document.getElementById('detail-crumb-section');
        if (crumbSectionEl && item._source) {
            const sectionNames = {
                'news': 'News',
                'young-writers': 'Young Writers',
                'watch': 'Watch',
                'book-corner': 'Book/Movie Suggestions',
                'creative-corner': 'Creative Corner',
                'reporters': 'Meet the Reporters',
                'archive': 'Archive',
                'english-stars': 'English Stars',
                'spelling-bee': 'Spelling Bee',
                'enrichment': 'Enrichment',
                'contest': 'Contest',
                'lexis-advice': "Lexi's Advice"
            };
            crumbSectionEl.textContent = sectionNames[item._source] || 'Content';
            // Build a link to the section page
            const sectionUrls = {
                'news': 'news.html',
                'young-writers': 'young-writers.html',
                'watch': 'watch.html',
                'book-corner': 'book-corner.html',
                'creative-corner': 'creative-corner.html',
                'reporters': 'meet-the-reporters.html',
                'archive': 'archive.html',
                'english-stars': 'english-stars.html',
                'spelling-bee': 'spelling-bee.html',
                'enrichment': 'enrichment.html',
                'contest': 'contest.html',
                'lexis-advice': 'lexis-advice.html'
            };
            crumbSectionEl.href = sectionUrls[item._source] || '#';
        }
    }

    function showNotFound() {
        const contentEl = document.getElementById('detail-content');
        if (contentEl) {
            contentEl.innerHTML = `
                <div class="empty-state">
                    <h3>Content not found</h3>
                    <p>The article you're looking for might have been moved or doesn't exist yet.</p>
                    <a href="${PREFIX}index.html" class="btn btn-primary">Back to Home</a>
                </div>
            `;
        }
        const titleEl = document.getElementById('detail-title');
        if (titleEl) titleEl.textContent = 'Not Found';
        const metaEl = document.getElementById('detail-meta');
        if (metaEl) metaEl.innerHTML = '';
        const badgeEl = document.getElementById('detail-badge');
        if (badgeEl) badgeEl.style.display = 'none';
    }

    /* ==========================================
       INIT
       ========================================== */

    async function init() {
        const id = getIdFromUrl();

        if (!id) {
            showNotFound();
            return;
        }

        const allItems = await loadAllData();
        const item = findItemById(allItems, id);

        if (!item) {
            showNotFound();
            return;
        }

        fillPage(item);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();