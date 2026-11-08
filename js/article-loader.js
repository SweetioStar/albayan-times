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
        'creative-corner', 'reporters',
        'contest', 'competitions', 'lexis-advice'
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

    /* FETCH
       All data files are requested at the same time, and the page is shown
       as soon as the file that holds this id arrives (no waiting for the rest).
       "no-cache" lets the browser reuse files it already has when they haven't changed. */
    function loadFile(fileName) {
        return fetch(`${PREFIX}data/${fileName}.json`, { cache: 'no-cache' })
            .then(r => (r.ok ? r.json() : { items: [] }))
            .then(data => (Array.isArray(data) ? data : (data.items || [])).map(item => ({ ...item, _source: fileName })))
            .catch(() => []);
    }

    function findItem(id) {
        return new Promise(resolve => {
            let pending = DATA_FILES.length;
            DATA_FILES.forEach(fileName => {
                loadFile(fileName).then(items => {
                    const found = items.find(item => item.id === id);
                    if (found) resolve(found);
                    if (--pending === 0) resolve(null);
                });
            });
        });
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

    function fullImage(url, alt) {
        return `
            <figure class="detail-figure">
                <a href="${url}" target="_blank" rel="noopener" title="Open full size">
                    <img src="${url}" alt="${escapeHtml(alt)}" onerror="this.closest('figure').style.display='none'">
                </a>
            </figure>
        `;
    }

    /* Picture slider: one picture, or several with arrows, counter and thumbnails */
    function pictureSlider(pictures, showThumbs = true) {
        if (!pictures.length) return '';
        const many = pictures.length > 1;
        return `
            <div class="detail-slider" data-index="0">
                <div class="detail-slider-stage">
                    ${pictures.map((pic, i) => `
                        <figure class="detail-slide${i === 0 ? ' is-active' : ''}">
                            <a href="${pic.url}" target="_blank" rel="noopener" title="Open full size">
                                <img src="${pic.url}" alt="${escapeHtml(pic.caption || '')}" ${i > 0 ? 'loading="lazy"' : ''}>
                            </a>
                            ${pic.caption ? `<figcaption>${escapeHtml(pic.caption)}</figcaption>` : ''}
                        </figure>
                    `).join('')}
                    ${many ? `
                        <button type="button" class="detail-slider-arrow prev" aria-label="Previous picture">&#8249;</button>
                        <button type="button" class="detail-slider-arrow next" aria-label="Next picture">&#8250;</button>
                        <span class="detail-slider-count">1 / ${pictures.length}</span>
                    ` : ''}
                </div>
                ${many && showThumbs ? `
                    <div class="detail-slider-thumbs">
                        ${pictures.map((pic, i) => `<button type="button" class="detail-slider-thumb${i === 0 ? ' is-active' : ''}" data-go="${i}" aria-label="Picture ${i + 1}"><img src="${pic.url}" alt="" loading="lazy"></button>`).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    function itemPictures(item, folder) {
        const pics = [];
        const main = getImageUrl(item, folder);
        if (main && item.image !== item.authorPhoto) pics.push({ url: main, caption: '' });
        (item.images || []).forEach(img => {
            const url = contentImg(img.image);
            const dup = pics.find(p => p.url === url);
            if (dup) { dup.caption = img.caption || dup.caption; return; }
            pics.push({ url, caption: img.caption || '' });
        });
        return pics;
    }

    function picturePicker(pictures, label) {
        return `
            <div class="detail-picker">
                <h3 class="detail-picker-title">${escapeHtml(label)} <span>${pictures.length}</span></h3>
                <div class="detail-picker-grid">
                    ${pictures.map((pic, i) => `
                        <button type="button" class="detail-picker-item${i === 0 ? ' is-active' : ''}" data-go="${i}">
                            <img src="${pic.url}" alt="${escapeHtml(pic.caption || '')}" loading="lazy">
                            ${pic.caption ? `<span>${escapeHtml(pic.caption)}</span>` : ''}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /* "More from …": fills the space under a short description with other pieces from the same section */
    const SECTION_LABELS = {
        'news': 'News', 'young-writers': 'Young Writers', 'watch': 'Watch', 'book-corner': 'Book Corner',
        'creative-corner': 'Creative Corner', 'reporters': 'Reporters', 'contest': 'Contests',
        'competitions': 'Competitions', 'lexis-advice': "Lexi's Advice"
    };

    async function addMoreFrom(item, root) {
        const main = root.querySelector('.detail-layout .detail-main');
        if (!main || main.querySelector('.detail-picker')) return;
        const text = String(item.body || '').length;
        if (text > 600) return;

        const items = (await loadFile(item._source)).filter(x => x.id !== item.id && x.type !== 'reporter' && x.image);
        if (!items.length) return;
        // same category first, then the rest; start after the current item so each page shows different ones
        const all = (await loadFile(item._source));
        const start = all.findIndex(x => x.id === item.id);
        const ordered = items.slice().sort((a, b) => {
            const sameA = a.category && a.category === item.category ? 0 : 1;
            const sameB = b.category && b.category === item.category ? 0 : 1;
            if (sameA !== sameB) return sameA - sameB;
            const ia = (all.indexOf(all.find(x => x.id === a.id)) - start + all.length) % all.length;
            const ib = (all.indexOf(all.find(x => x.id === b.id)) - start + all.length) % all.length;
            return ia - ib;
        }).slice(0, 3);

        const folderFor = x => x.imageFolder || (x.type === 'book' ? 'books' : x.type === 'movie' ? 'movies' : 'content');
        const label = SECTION_LABELS[item._source] || 'Albayan Times';
        main.querySelector('.detail-body').classList.add('detail-body-short');
        main.insertAdjacentHTML('beforeend', `
            <div class="detail-more">
                <h3 class="detail-picker-title">More from ${escapeHtml(label)}</h3>
                <div class="detail-more-list">
                    ${ordered.map(x => `
                        <a class="detail-more-item" href="article.html?id=${encodeURIComponent(x.id)}">
                            <span class="detail-more-thumb"><img src="${getImageUrl(x, folderFor(x))}" alt="" loading="lazy"></span>
                            <span class="detail-more-text">
                                <strong>${escapeHtml(x.title)}</strong>
                                <small>${escapeHtml(x.recommendedBy ? 'Recommended by ' + x.recommendedBy : (x.author || x.date || ''))}</small>
                            </span>
                            <span class="detail-more-arrow">&rarr;</span>
                        </a>
                    `).join('')}
                </div>
            </div>
        `);
        fitColumns(root);
    }

    /* Keep both columns the same height: show only as many "More from" items as fit beside the picture */
    function fitColumns(root) {
        const layout = root.querySelector('.detail-layout');
        const side = layout && layout.querySelector('.detail-side');
        const main = layout && layout.querySelector('.detail-main');
        if (!side || !main) return;

        const fit = () => {
            const more = main.querySelector('.detail-more');
            const items = [...main.querySelectorAll('.detail-more-item')];
            layout.classList.remove('is-even');
            if (more) more.hidden = false;
            items.forEach(i => { i.hidden = false; });
            if (window.innerWidth <= 960) { layout.classList.add('is-even'); return; }
            const sideH = side.getBoundingClientRect().height;
            for (let k = items.length - 1; k >= 0 && main.getBoundingClientRect().height > sideH + 24; k--) {
                items[k].hidden = true;
                if (k === 0 && more) more.hidden = true;
            }
            layout.classList.add('is-even');
        };

        const imgs = [...side.querySelectorAll('img, video')];
        imgs.forEach(m => {
            if (m.tagName === 'IMG' && !m.complete) m.addEventListener('load', fit, { once: true });
            if (m.tagName === 'VIDEO') m.addEventListener('loadedmetadata', fit, { once: true });
        });
        fit();
        let t;
        window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(fit, 150); });
    }

    function bindSliders(root) {
        root.querySelectorAll('.detail-slider').forEach(slider => {
            const slides = slider.querySelectorAll('.detail-slide');
            const thumbs = [...slider.querySelectorAll('.detail-slider-thumb'), ...root.querySelectorAll('.detail-picker-item')];
            const count = slider.querySelector('.detail-slider-count');
            if (slides.length < 2) return;
            let index = 0;
            const go = i => {
                index = (i + slides.length) % slides.length;
                slides.forEach((s, k) => s.classList.toggle('is-active', k === index));
                thumbs.forEach(t => t.classList.toggle('is-active', Number(t.dataset.go) === index));
                if (count) count.textContent = `${index + 1} / ${slides.length}`;
            };
            slider.querySelector('.prev').addEventListener('click', () => go(index - 1));
            slider.querySelector('.next').addEventListener('click', () => go(index + 1));
            thumbs.forEach(t => t.addEventListener('click', () => go(Number(t.dataset.go))));
            slider.tabIndex = 0;
            slider.addEventListener('keydown', e => {
                if (e.key === 'ArrowLeft') go(index - 1);
                if (e.key === 'ArrowRight') go(index + 1);
            });
        });
    }

    /* Two columns on wide screens: picture + author on the left, text on the right */
    function twoColumns(sideHtml, mainHtml) {
        if (!sideHtml.trim()) {
            return `<div class="detail-layout detail-layout-single"><div class="detail-main">${mainHtml}</div></div>`;
        }
        return `
            <div class="detail-layout">
                <aside class="detail-side">${sideHtml}</aside>
                <div class="detail-main">${mainHtml}</div>
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
        const pictures = item.videos ? [] : itemPictures(item, 'content');
        // Several pictures + a short description: show all pictures as a grid on the right
        const shortText = String(item.body || '').length < 600;
        const usePicker = pictures.length >= 3 && shortText;
        const label = item.pickerLabel || (item.category === 'life-experiences' ? 'All posters' : 'All pictures');
        const main = `
            ${renderAuthorCard(item)}
            <div class="detail-body${usePicker ? ' detail-body-short' : ''}">${buildBodyHtml(item.body || item.excerpt || 'Full content coming soon.')}</div>
            ${usePicker ? picturePicker(pictures, label) : ''}
        `;
        return `
            <article class="detail-article">
                ${twoColumns(pictureSlider(pictures, !usePicker), main)}
                ${renderVideoList(item)}
            </article>
        `;
    }

    function renderVideoLayout(item) {
        const source = item.source || 'youtube';
        const videoUrl = item.video || '';
        let embedHtml = '';

        if (!videoUrl || PLACEHOLDER_VIDEO.test(videoUrl)) {
            const poster = item.image ? getImageUrl(item, 'content') : '';
            embedHtml = `<div class="detail-video-soon" ${poster ? `style="background-image:linear-gradient(rgba(26,44,66,.72),rgba(26,44,66,.72)),url('${poster}')"` : ''}><strong>Video coming soon</strong><span>We're still uploading this one. Check back later!</span></div>`;
        } else if (source === 'youtube') {
            embedHtml = `<div class="detail-video-wrapper"><iframe src="${getYouTubeEmbed(videoUrl)}" frameborder="0" allowfullscreen></iframe></div>`;
        } else if (source === 'local') {
            embedHtml = `<div class="detail-video-wrapper"><video controls preload="metadata" playsinline ${item.image ? `poster="${getImageUrl(item, 'content')}"` : ''}><source src="${PREFIX}assets/videos/${escapeHtml(videoUrl)}" type="video/mp4"></video></div>`;
        } else if (source === 'url') {
            embedHtml = `<div class="detail-video-wrapper"><iframe src="${escapeHtml(videoUrl)}" frameborder="0" allowfullscreen></iframe></div>`;
        }

        return `
            <article class="detail-video">
                <div class="detail-layout detail-layout-video">
                    <div class="detail-side">${embedHtml}</div>
                    <div class="detail-main"><div class="detail-body">${buildBodyHtml(item.body || item.excerpt || '')}</div></div>
                </div>
                ${renderImageGallery(item)}
            </article>`;
    }

    function renderBookLayout(item, typeLabel) {
        const folder = item.type === 'movie' ? 'movies' : 'books';
        const imgUrl = getImageUrl(item, folder);
        const person = `
            <div class="detail-recommender-card">
                <span class="detail-type-badge">${escapeHtml(typeLabel)}</span>
                ${item.creator ? `<p class="detail-book-creator">${escapeHtml(item.creator)}</p>` : ''}
                <span class="detail-author-label">Recommended by</span>
                <span class="detail-author-name">${escapeHtml(item.recommendedBy || 'Albayan Student')}</span>
                ${item.grade ? `<span class="detail-recommender-grade">Grade ${escapeHtml(item.grade)}</span>` : ''}
            </div>
        `;
        return `
            <article class="detail-book">
                ${twoColumns(pictureSlider(imgUrl ? [{ url: imgUrl, caption: '' }] : []), person + `<div class="detail-body">${buildBodyHtml(item.body || item.excerpt || 'Review coming soon.')}</div>`)}
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
                <div class="detail-layout detail-layout-video">
                    <div class="detail-side">${media}</div>
                    <div class="detail-main"><div class="detail-body">${buildBodyHtml(item.body || item.excerpt || '')}</div></div>
                </div>
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
        if (contentEl) { contentEl.innerHTML = renderByType(item); bindSliders(contentEl); addMoreFrom(item, contentEl); }

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
        const item = await findItem(id);
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