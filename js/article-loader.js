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
        'spelling-bee', 'contest', 'competitions', 'lexis-advice'
    ];

    // Placeholder links that were never replaced with a real video
    const PLACEHOLDER_VIDEO = /dQw4w9WgXcQ/;

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
        const blocks = String(body).split('\n\n').map(b => b.trim()).filter(Boolean);
        const isNumbered = l => /^\d+[.)]\s/.test(l);
        const isBullet = l => /^[-•]\s/.test(l);

        return blocks.map((block, index) => {
            const lines = block.split('\n').map(l => l.trim()).filter(Boolean);

            // Q&A: "1. Question?" followed by its answer
            if (lines.length >= 2 && isNumbered(lines[0]) && lines[0].includes('?') && !lines.slice(1).some(isNumbered)) {
                return `<div class="body-qa"><p class="body-q">${escapeHtml(lines[0])}</p><p class="body-a">${escapeHtml(lines.slice(1).join(' '))}</p></div>`;
            }

            // Heading line followed by a list ("Why is bullying bad?" + "- ...")
            let heading = '';
            let listLines = lines;
            if (lines.length > 1 && !isNumbered(lines[0]) && !isBullet(lines[0]) &&
                lines.slice(1).every(l => isNumbered(l) || isBullet(l))) {
                heading = lines[0];
                listLines = lines.slice(1);
            }
            if (listLines.length > 1 && listLines.every(isNumbered)) {
                return `${heading ? `<h3 class="body-subhead">${escapeHtml(heading)}</h3>` : ''}<ol class="body-list">${listLines.map(l => `<li>${escapeHtml(l.replace(/^\d+[.)]\s*/, ''))}</li>`).join('')}</ol>`;
            }
            if (listLines.length >= 1 && listLines.every(isBullet) && (heading || listLines.length > 1)) {
                return `${heading ? `<h3 class="body-subhead">${escapeHtml(heading)}</h3>` : ''}<ul class="body-list">${listLines.map(l => `<li>${escapeHtml(l.replace(/^[-•]\s*/, ''))}</li>`).join('')}</ul>`;
            }

            const cls = index === 0 && blocks.length > 1 ? ' class="body-lead"' : '';
            return `<p${cls}>${lines.map(escapeHtml).join('<br>')}</p>`;
        }).join('');
    }

    function getCategoryBadgeClass(category) {
        const map = { 'school-news': 'badge-school-news', 'events': 'badge-events', 'health': 'badge-health', 'values': 'badge-values', 'young-writers': 'badge-young-writers', 'watch': 'badge-watch', 'book-corner': 'badge-book-corner', 'creative': 'badge-creative-corner', 'ai-creations': 'badge-coral', 'life-experiences': 'badge-teal', 'interview': 'badge-teal', 'advice': 'badge-yellow', 'contest': 'badge-coral' };
        return map[category] || 'badge-news';
    }

    function getCategoryLabel(category) {
        const map = { 'school-news': 'School News', 'young-writers': 'Young Writers', 'ai-creations': 'AI Creations', 'life-experiences': 'Life Experiences', 'creative-studio': 'Creative Studio', 'book-corner': 'Book/Movie', 'creative': 'Creative', 'contest': 'Contest' };
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
    function contentImg(file) {
        return `${PREFIX}assets/images/content/${escapeHtml(file)}`;
    }

    function renderAuthorCard(item) {
        if (!item.authorPhoto) return '';
        return `
            <div class="detail-author-card">
                <img src="${contentImg(item.authorPhoto)}" alt="${escapeHtml(item.author || '')}" onerror="this.style.display='none'">
                <div>
                    <span class="detail-author-label">Written by</span>
                    <span class="detail-author-name">${escapeHtml(item.author || '')}</span>
                </div>
            </div>
        `;
    }

    function renderImageGallery(item) {
        if (!Array.isArray(item.images) || item.images.length === 0) return '';
        return `
            <div class="detail-gallery">
                ${item.images.map(img => `
                    <figure class="detail-gallery-item">
                        <a href="${contentImg(img.image)}" target="_blank" rel="noopener">
                            <img src="${contentImg(img.image)}" alt="${escapeHtml(img.caption || item.title)}" loading="lazy" onerror="this.closest('figure').style.display='none'">
                        </a>
                        ${img.caption ? `<figcaption>${escapeHtml(img.caption)}</figcaption>` : ''}
                    </figure>
                `).join('')}
            </div>
        `;
    }

    function renderVideoList(item) {
        if (!Array.isArray(item.videos) || item.videos.length === 0) return '';
        return `
            <div class="detail-video-list">
                ${item.videos.map(v => `
                    <figure class="detail-video-list-item">
                        <video controls preload="metadata" playsinline ${v.poster ? `poster="${contentImg(v.poster)}"` : ''}>
                            <source src="${PREFIX}assets/videos/${escapeHtml(v.file)}" type="video/mp4">
                        </video>
                        ${v.label ? `<figcaption>${escapeHtml(v.label)}</figcaption>` : ''}
                    </figure>
                `).join('')}
            </div>
        `;
    }

    function renderArticleLayout(item) {
        const imgUrl = getImageUrl(item, 'content');
        // When the main image is just the author's portrait, show it in the author card instead
        const showHero = imgUrl && !item.videos && !(item.images && item.images.length) && item.image !== item.authorPhoto;
        return `
            <article class="detail-article">
                ${showHero ? `<div class="detail-hero-image"><img src="${imgUrl}" alt="${escapeHtml(item.title)}" onerror="this.style.display='none'"></div>` : ''}
                ${renderAuthorCard(item)}
                <div class="detail-body">${buildBodyHtml(item.body || item.excerpt || 'Full content coming soon.')}</div>
                ${renderVideoList(item)}
                ${renderImageGallery(item)}
            </article>
        `;
    }

    function renderVideoLayout(item) {
        const source = item.source || 'youtube';
        const videoUrl = item.video || '';
        let embedHtml = '';

        if (!videoUrl || PLACEHOLDER_VIDEO.test(videoUrl)) {
            embedHtml = `<div class="detail-video-soon"><strong>Video coming soon</strong><span>We're still uploading this one. Check back later!</span></div>`;
        } else if (source === 'youtube') {
            embedHtml = `<div class="detail-video-wrapper"><iframe src="${getYouTubeEmbed(videoUrl)}" frameborder="0" allowfullscreen></iframe></div>`;
        } else if (source === 'local') {
            embedHtml = `<div class="detail-video-wrapper"><video controls preload="metadata" playsinline ${item.image ? `poster="${getImageUrl(item, 'content')}"` : ''}><source src="${PREFIX}assets/videos/${escapeHtml(videoUrl)}" type="video/mp4"></video></div>`;
        } else if (source === 'url') {
            embedHtml = `<div class="detail-video-wrapper"><iframe src="${escapeHtml(videoUrl)}" frameborder="0" allowfullscreen></iframe></div>`;
        }

        return `<article class="detail-video">${embedHtml}<div class="detail-body">${buildBodyHtml(item.body || item.excerpt || '')}</div>${renderImageGallery(item)}</article>`;
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

    function renderCompetitionLayout(item) {
        const poster = item.image ? contentImg(item.image) : '';
        const media = item.video
            ? `<div class="detail-video-wrapper"><video controls preload="metadata" playsinline ${poster ? `poster="${poster}"` : ''}><source src="${PREFIX}assets/videos/${escapeHtml(item.video)}" type="video/mp4"></video></div>`
            : (poster ? `<div class="detail-hero-image"><img src="${poster}" alt="${escapeHtml(item.title)}"></div>` : '');

        const groups = {};
        const order = [];
        (item.winners || []).forEach(w => {
            const g = String(w.grade || String(w.class || '').charAt(0) || '');
            if (!groups[g]) { groups[g] = []; order.push(g); }
            groups[g].push(w);
        });

        const winnersHtml = order.length ? `
            <div class="competition-winners">
                <h3>${escapeHtml(item.winnersTitle || 'Winners')}</h3>
                <div class="competition-grade-list">
                    ${order.map(g => `
                        <div class="competition-grade">
                            <span class="competition-grade-badge">Grade ${escapeHtml(g)}</span>
                            <ul>
                                ${groups[g].map(w => `<li><span class="competition-winner-name">${escapeHtml(w.name)}</span>${w.class ? `<span class="competition-winner-class">${escapeHtml(w.class)}</span>` : ''}</li>`).join('')}
                            </ul>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : '';

        return `
            <article class="detail-competition">
                ${media}
                <div class="detail-body">${buildBodyHtml(item.body || item.excerpt || '')}</div>
                ${winnersHtml}
                ${renderImageGallery(item)}
                ${item.organizers ? `<p class="competition-organizers">Organized by ${escapeHtml(item.organizers)}</p>` : ''}
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
            case 'competition': return renderCompetitionLayout(item);
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
            } else if (item.type === 'competition') {
                badgeEl.textContent = 'School Competition';
                badgeEl.className = 'detail-badge badge-coral';
            } else if (item.category) {
                badgeEl.textContent = getCategoryLabel(item.category) || item.category;
                badgeEl.className = 'detail-badge ' + getCategoryBadgeClass(item.category);
            } else {
                const typeLabels = { book: 'Book', movie: 'Movie', video: 'Video', interview: 'Interview', advice: "Lexi's Advice" };
                const sourceLabels = { 'book-corner': 'Book/Movie', 'reporters': 'Reporters', 'lexis-advice': "Lexi's Advice", 'watch': 'Watch' };
                badgeEl.textContent = typeLabels[item.type] || sourceLabels[item._source] || 'Albayan Times';
                badgeEl.className = 'detail-badge ' + getCategoryBadgeClass(item._source === 'book-corner' ? 'book-corner' : item.type);
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
            const sectionNames = { 'news': 'News', 'young-writers': 'Young Writers', 'watch': 'Watch', 'book-corner': 'Book/Movie Suggestions', 'creative-corner': 'Creative Corner', 'reporters': 'Meet the Reporters', 'archive': 'Archive', 'english-stars': 'English Stars', 'spelling-bee': 'Spelling Bee', 'enrichment': 'Enrichment', 'contest': 'Contests', 'competitions': 'Competitions', 'lexis-advice': "Lexi's Advice" };
            crumbSectionEl.textContent = sectionNames[item._source] || 'Content';
            
            const sectionUrls = { 'news': 'news.html', 'young-writers': 'young-writers.html', 'watch': 'watch.html', 'book-corner': 'book-corner.html', 'creative-corner': 'creative-corner.html', 'reporters': 'meet-the-reporters.html', 'archive': 'archive.html', 'english-stars': 'english-stars.html', 'spelling-bee': 'spelling-bee.html', 'enrichment': 'enrichment.html', 'contest': 'contest.html#contests', 'competitions': 'contest.html#competitions', 'lexis-advice': 'lexis-advice.html' };
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

        if (window.AlbayanComments) {
            window.AlbayanComments.mount({
                container: document.getElementById('site-comments'),
                pageId: `${item._source}/${item.id}`,
                pageTitle: item.title || document.title
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();