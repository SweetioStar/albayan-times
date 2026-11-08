/* ============================================
   THE OPEN ALBAYAN TIMES - CONTENT LOADER
   ============================================
   Universal loader that reads a JSON data file
   and renders cards into a container.

   HTML usage:
   <div id="content-grid"
        data-json="news"
        data-card="article"
        data-filter-type="interview"   ← optional
        data-filter-category="events"  ← optional
        data-limit="3">                ← optional
   </div>

   Supported card types:
   - article    → .article-card
   - video      → .video-card
   - book/movie → .suggestion-card
   - creative   → .creative-card
   - image      → .gallery-item
   - interview  → .interview-card
   - advice     → .advice-card
   - reporter   → (skipped by loader — handled inline)
   ============================================ */

(function () {
    'use strict';

    function detectPrefix() {
        const path = window.location.pathname;
        if (path.includes('/html/')) return '../';
        return '';
    }

    const PREFIX = detectPrefix();

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

    function getInitial(name) {
        if (!name) return '?';
        return String(name).trim().charAt(0).toUpperCase();
    }

    function getImageUrl(item, fallbackFolder) {
        if (!item.image) return '';
        const folder = item.imageFolder || fallbackFolder || 'content';
        return `${PREFIX}assets/images/${folder}/${item.image}`;
    }

    function getDetailUrl(item) {
        if (!item.id) return '#';
        return `article.html?id=${encodeURIComponent(item.id)}`;
    }

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
            'ai-creations': 'badge-coral',
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

    /* ==========================================
       CARD RENDERERS
       ========================================== */

    function renderArticleCard(item) {
        const imgUrl = getImageUrl(item, 'content');
        const badgeClass = getCategoryBadgeClass(item.category);
        const badgeLabel = getCategoryLabel(item.category) || 'Article';
        const href = getDetailUrl(item);

        return `
            <a href="${href}" class="article-card" data-category="${escapeHtml(item.category || '')}" data-grade="${escapeHtml(item.grade || '')}">
                <div class="card-image">
                    <span class="badge ${badgeClass}">${escapeHtml(badgeLabel)}</span>
                    ${imgUrl ? `<img src="${imgUrl}" alt="${escapeHtml(item.title)}">` : ''}
                </div>
                <div class="card-body">
                    <h3 class="card-title">${escapeHtml(item.title)}</h3>
                    <p class="card-excerpt">${escapeHtml(item.excerpt || '')}</p>
                    <div class="card-meta">
                        <span class="meta-author">${escapeHtml(item.author || 'Albayan Reporters')}</span>
                        <span class="meta-divider">|</span>
                        <span>${escapeHtml(item.date || '')}</span>
                    </div>
                </div>
            </a>
        `;
    }

    function renderVideoCard(item) {
        const imgUrl = getImageUrl(item, 'content');
        const href = getDetailUrl(item);

        return `
            <a href="${href}" class="video-card" data-category="${escapeHtml(item.category || '')}" data-grade="${escapeHtml(item.grade || '')}">
                <div class="video-thumbnail">
                    ${item.duration ? `<span class="video-duration">${escapeHtml(item.duration)}</span>` : ''}
                    ${imgUrl ? `<img src="${imgUrl}" alt="${escapeHtml(item.title)}">` : ''}
                    <span class="mini-play"></span>
                </div>
                <div class="video-body">
                    <h3 class="video-title">${escapeHtml(item.title)}</h3>
                    <div class="video-meta">
                        <span class="meta-author">${escapeHtml(item.author || 'Albayan Reporters')}</span>
                        <span class="meta-divider">|</span>
                        <span>${escapeHtml(item.date || '')}</span>
                    </div>
                </div>
            </a>
        `;
    }

    function renderBookCard(item) {
        const folder = item.type === 'movie' ? 'movies' : 'books';
        const imgUrl = getImageUrl(item, folder);
        const typeClass = item.type === 'movie' ? 'type-movie' : 'type-book';
        const typeLabel = item.type === 'movie' ? 'Movie' : 'Book';
        const href = getDetailUrl(item);

        return `
            <a href="${href}" class="suggestion-card" data-type="${escapeHtml(item.type)}" data-grade="${escapeHtml(item.grade || '')}">
                <span class="suggestion-type ${typeClass}">${typeLabel}</span>
                <div class="suggestion-cover">
                    ${imgUrl ? `<img src="${imgUrl}" alt="${escapeHtml(item.title)}">` : ''}
                </div>
                <div class="suggestion-body">
                    <h3 class="suggestion-title">${escapeHtml(item.title)}</h3>
                    <p class="suggestion-creator">${escapeHtml(item.creator || '')}</p>
                    <p class="suggestion-blurb">${escapeHtml(item.excerpt || '')}</p>
                    <div class="suggestion-meta">
                        <span class="meta-student">${escapeHtml(item.recommendedBy || 'Albayan Student')}</span>
                        <span class="meta-divider">|</span>
                        <span class="meta-grade">Grade ${escapeHtml(item.grade || '')}</span>
                    </div>
                </div>
            </a>
        `;
    }

    function renderCreativeCard(item) {
        const imgUrl = getImageUrl(item, 'content');
        const isLife = item.category === 'life-experiences';
        const categoryClass = isLife ? 'category-life-experiences' : 'category-ai-creations';
        const tagLabel = isLife ? 'Life Experiences' : 'AI Creations';
        const href = getDetailUrl(item);

        return `
            <a href="${href}" class="creative-card ${categoryClass}" data-category="${escapeHtml(item.category || '')}" data-grade="${escapeHtml(item.grade || '')}">
                <div class="creative-card-image">
                    <span class="creative-card-tag">${escapeHtml(tagLabel)}</span>
                    ${imgUrl ? `<img src="${imgUrl}" alt="${escapeHtml(item.title)}">` : ''}
                </div>
                <div class="creative-card-body">
                    <h3 class="creative-card-title">${escapeHtml(item.title)}</h3>
                    <p class="creative-card-excerpt">${escapeHtml(item.excerpt || '')}</p>
                    <div class="creative-card-meta">
                        <span class="meta-author">${escapeHtml(item.author || 'Albayan Student')}</span>
                        <span class="meta-divider">|</span>
                        <span>${escapeHtml(item.date || '')}</span>
                    </div>
                </div>
            </a>
        `;
    }

    function renderImageCard(item) {
        const imgUrl = getImageUrl(item, 'creative');
        const href = getDetailUrl(item);

        return `
            <a href="${href}" class="gallery-item" data-category="${escapeHtml(item.category || '')}" data-grade="${escapeHtml(item.grade || '')}">
                <div class="gallery-image">
                    <span class="gallery-tag tag-${escapeHtml(item.category || 'drawing')}">${escapeHtml(getCategoryLabel(item.category) || 'Art')}</span>
                    ${imgUrl ? `<img src="${imgUrl}" alt="${escapeHtml(item.title)}">` : ''}
                </div>
                <div class="gallery-body">
                    <h3 class="gallery-title">${escapeHtml(item.title)}</h3>
                    <div class="gallery-meta">
                        <span class="meta-author">${escapeHtml(item.author || 'Albayan Student')}</span>
                        <span class="meta-divider">|</span>
                        <span>${escapeHtml(item.date || '')}</span>
                    </div>
                </div>
            </a>
        `;
    }

    function renderInterviewCard(item) {
        const href = getDetailUrl(item);

        return `
            <a href="${href}" class="interview-card" data-category="interview" data-grade="${escapeHtml(item.grade || '')}">
                <div class="interview-avatar">${escapeHtml(getInitial(item.interviewee || item.title))}</div>
                <div class="interview-body">
                    <span class="interview-label">${escapeHtml(item.label || 'Student Interview')}</span>
                    <h3 class="interview-title">${escapeHtml(item.title)}</h3>
                    <p class="interview-preview">${escapeHtml(item.excerpt || '')}</p>
                    <div class="interview-meta">
                        <strong>${escapeHtml(item.author || 'Albayan Reporters')}</strong> | ${escapeHtml(item.date || '')}
                    </div>
                </div>
            </a>
        `;
    }

    function renderAdviceCard(item) {
        const href = getDetailUrl(item);

        return `
            <a href="${href}" class="advice-card" data-category="advice" data-grade="${escapeHtml(item.grade || '')}">
                <span class="advice-topic">${escapeHtml(item.topic || 'Advice')}</span>
                <h3 class="advice-title">${escapeHtml(item.title)}</h3>
                <p class="advice-excerpt">${escapeHtml(item.excerpt || '')}</p>
                <div class="advice-meta">
                    <span class="meta-author">${escapeHtml(item.author || 'Lexi')}</span>
                    <span>|</span>
                    <span>${escapeHtml(item.date || '')}</span>
                </div>
            </a>
        `;
    }

    /* ==========================================
       MAIN RENDERER
       ========================================== */

    function renderCard(item, defaultType) {
        const type = item.type || defaultType || 'article';

        if (defaultType === 'creative') {
            return renderCreativeCard(item);
        }

        switch (type) {
            case 'article':   return renderArticleCard(item);
            case 'video':     return renderVideoCard(item);
            case 'book':
            case 'movie':     return renderBookCard(item);
            case 'image':     return renderImageCard(item);
            case 'interview': return renderInterviewCard(item);
            case 'advice':    return renderAdviceCard(item);
            case 'reporter':  return ''; // handled by inline script on the page
            default:          return renderArticleCard(item);
        }
    }

    /* ==========================================
       LOADER
       ========================================== */

    async function loadContent(container) {
        const jsonName = container.getAttribute('data-json');
        const cardType = container.getAttribute('data-card') || 'article';
        const filterType = container.getAttribute('data-filter-type');
        const filterCategory = container.getAttribute('data-filter-category');
        const limit = container.getAttribute('data-limit');

        if (!jsonName) {
            console.warn('[Albayan] No data-json attribute on #' + container.id);
            return;
        }

        let items = [];

        try {
            const url = `${PREFIX}data/${jsonName}.json?v=` + Date.now();
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to load ' + jsonName);
            const data = await response.json();
            items = Array.isArray(data) ? data : (data.items || []);
        } catch (err) {
            console.warn('[Albayan] Could not load ' + jsonName + '.json:', err);
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No content yet</h3>
                    <p>Content will appear here once added to the data file.</p>
                </div>
            `;
            return;
        }

        // Filter by type (e.g. only interviews)
        if (filterType) {
            items = items.filter(item => item.type === filterType);
        }

        // Filter by category
        if (filterCategory) {
            items = items.filter(item => item.category === filterCategory);
        }

        // Exclude types the loader doesn't render
        items = items.filter(item => item.type !== 'reporter');

        if (limit) {
            items = items.slice(0, parseInt(limit, 10));
        }

        if (items.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>Coming soon</h3>
                    <p>Content will appear here soon.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = items
            .map(item => renderCard(item, cardType))
            .join('');

        document.dispatchEvent(new CustomEvent('albayan:contentLoaded', {
            detail: { containerId: container.id, itemCount: items.length }
        }));
    }

    /* ==========================================
       INIT
       ========================================== */

    function init() {
        const containers = document.querySelectorAll('[data-json]');
        if (containers.length === 0) return;

        containers.forEach(container => {
            loadContent(container);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();