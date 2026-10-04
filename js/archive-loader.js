/* ============================================
   THE OPEN ALBAYAN TIMES - ARCHIVE LOADER
   ============================================
   Auto-aggregates content from ALL content
   JSON files into one chronological archive.

   - Fetches: news, young-writers, watch,
              book-corner, creative-corner, reporters
   - Combines all items
   - Sorts newest first (by year + month)
   - Groups by year
   - Populates filter dropdowns from real data
   - Renders the archive list
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
       FILES TO AGGREGATE
       ==========================================
       All content JSON files. Reporters.json
       includes interviews (we keep) + reporter
       cards (we skip).
       ========================================== */

    const SOURCE_FILES = [
        { file: 'news', sourceName: 'News' },
        { file: 'young-writers', sourceName: 'Young Writers' },
        { file: 'watch', sourceName: 'Watch' },
        { file: 'book-corner', sourceName: 'Book/Movie' },
        { file: 'creative-corner', sourceName: 'Creative Corner' },
        { file: 'reporters', sourceName: 'Meet the Reporters' }
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

    // Parse a date like "May 2026" or "April - May 2025"
    function parseDate(dateStr) {
        if (!dateStr) return { year: 0, month: 0 };
        const months = {
            january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
            july: 7, august: 8, september: 9, october: 10, november: 11, december: 12
        };

        // Try to extract year (4 digits)
        const yearMatch = dateStr.match(/\d{4}/);
        const year = yearMatch ? parseInt(yearMatch[0], 10) : 0;

        // Try to extract month name
        const lower = dateStr.toLowerCase();
        let month = 0;
        for (const [name, num] of Object.entries(months)) {
            if (lower.includes(name)) {
                month = num;
                break;
            }
        }

        return { year, month };
    }

    function getMonthName(monthNum) {
        const names = ['', 'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        return names[monthNum] || '';
    }

    function getSourceCategory(sourceName) {
        const map = {
            'News': 'news',
            'Young Writers': 'young-writers',
            'Watch': 'watch',
            'Book/Movie': 'book-corner',
            'Creative Corner': 'creative',
            'Meet the Reporters': 'interview'
        };
        return map[sourceName] || 'other';
    }

    function getCategoryLabel(cat) {
        const map = {
            'news': 'News',
            'young-writers': 'Young Writers',
            'watch': 'Watch',
            'book-corner': 'Book/Movie',
            'creative': 'Creative Corner',
            'interview': 'Interview'
        };
        return map[cat] || cat;
    }

    /* ==========================================
       FETCH + COMBINE
       ========================================== */

    async function fetchAll() {
        const results = await Promise.all(
            SOURCE_FILES.map(async ({ file, sourceName }) => {
                try {
                    const url = `${PREFIX}data/${file}.json?v=` + Date.now();
                    const res = await fetch(url);
                    if (!res.ok) return [];
                    const data = await res.json();
                    const items = Array.isArray(data) ? data : (data.items || []);

                    // Skip "reporter" type items
                    return items
                        .filter(item => item.type !== 'reporter')
                        .map(item => {
                            const parsed = parseDate(item.date);
                            return {
                                ...item,
                                _source: sourceName,
                                _category: item.category || getSourceCategory(sourceName),
                                _year: parsed.year,
                                _month: parsed.month
                            };
                        });
                } catch (err) {
                    console.warn('[Albayan] Could not load ' + file + ':', err);
                    return [];
                }
            })
        );

        // Flatten
        const all = results.flat();

        // Sort newest first
        all.sort((a, b) => {
            if (b._year !== a._year) return b._year - a._year;
            return b._month - a._month;
        });

        return all;
    }

    /* ==========================================
       RENDER
       ========================================== */

    function renderArchive(items) {
        const container = document.getElementById('archive-list');
        if (!container) return;

        if (items.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No content yet</h3>
                    <p>Archive will appear once content is added.</p>
                </div>
            `;
            return;
        }

        // Group by year
        const byYear = {};
        items.forEach(item => {
            const year = item._year || 'Unknown';
            if (!byYear[year]) byYear[year] = [];
            byYear[year].push(item);
        });

        // Sort years descending
        const years = Object.keys(byYear).sort((a, b) => parseInt(b, 10) - parseInt(a, 10));

        // Build HTML
        const html = years.map(year => {
            const yearItems = byYear[year];

            const entries = yearItems.map(item => {
                const detailUrl = item.id ? `article.html?id=${encodeURIComponent(item.id)}` : '#';
                const categoryLabel = getCategoryLabel(item._category);
                const categoryClass = 'cat-' + (item._category === 'book-corner' ? 'book' :
                    item._category === 'creative' ? 'creative' :
                    item._category === 'young-writers' ? 'young-writers' :
                    item._category === 'interview' ? 'interview' :
                    item._category);

                return `
                    <a href="${detailUrl}" class="archive-entry"
                       data-year="${escapeHtml(item._year)}"
                       data-month="${escapeHtml(item._month)}"
                       data-category="${escapeHtml(item._category)}"
                       data-author="${escapeHtml((item.author || item.recommendedBy || '').toLowerCase().replace(/\\s+/g, '-'))}">
                        <div class="archive-month">
                            ${escapeHtml(getMonthName(item._month) || item.date || '')}
                            <span>${escapeHtml(item._year)}</span>
                        </div>
                        <div class="archive-content">
                            <h3 class="archive-title">${escapeHtml(item.title)}</h3>
                            <div class="archive-meta">
                                <span class="archive-category ${categoryClass}">${escapeHtml(categoryLabel)}</span>
                                <span class="meta-author">${escapeHtml(item.author || item.recommendedBy || 'Albayan Reporters')}</span>
                            </div>
                        </div>
                    </a>
                `;
            }).join('');

            return `
                <div class="year-group">
                    <div class="year-heading">
                        <h2>${escapeHtml(year)}</h2>
                        <span class="year-count">${yearItems.length} ${yearItems.length === 1 ? 'story' : 'stories'}</span>
                    </div>
                    ${entries}
                </div>
            `;
        }).join('');

        container.innerHTML = html;

        // Notify filters
        document.dispatchEvent(new CustomEvent('albayan:contentLoaded', {
            detail: { containerId: 'archive-list', itemCount: items.length }
        }));
    }

    /* ==========================================
       POPULATE FILTER DROPDOWNS FROM DATA
       ========================================== */

    function populateDropdowns(items) {
        // Years
        const years = new Set();
        const months = new Set();
        const categories = new Set();
        const authors = new Set();

        items.forEach(item => {
            if (item._year) years.add(String(item._year));
            if (item._month) months.add(String(item._month));
            if (item._category) categories.add(item._category);
            if (item.author) authors.add(item.author);
            if (item.recommendedBy) authors.add(item.recommendedBy);
        });

        // Year dropdown
        const yearSelect = document.getElementById('filter-year');
        if (yearSelect) {
            const sortedYears = Array.from(years).sort((a, b) => parseInt(b, 10) - parseInt(a, 10));
            yearSelect.innerHTML = '<option value="all">All Years</option>' +
                sortedYears.map(y => `<option value="${y}">${y}</option>`).join('');
        }

        // Month dropdown
        const monthSelect = document.getElementById('filter-month');
        if (monthSelect) {
            const sortedMonths = Array.from(months).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
            monthSelect.innerHTML = '<option value="all">All Months</option>' +
                sortedMonths.map(m => `<option value="${m}">${getMonthName(parseInt(m, 10))}</option>`).join('');
        }

        // Category dropdown
        const catSelect = document.getElementById('filter-category');
        if (catSelect) {
            const sortedCats = Array.from(categories).sort();
            catSelect.innerHTML = '<option value="all">All Categories</option>' +
                sortedCats.map(c => `<option value="${c}">${getCategoryLabel(c)}</option>`).join('');
        }

        // Author dropdown
        const authorSelect = document.getElementById('filter-author');
        if (authorSelect) {
            const sortedAuthors = Array.from(authors).sort();
            authorSelect.innerHTML = '<option value="all">All Authors</option>' +
                sortedAuthors.map(a => {
                    const slug = a.toLowerCase().replace(/\s+/g, '-');
                    return `<option value="${escapeHtml(slug)}">${escapeHtml(a)}</option>`;
                }).join('');
        }
    }

    /* ==========================================
       STATS
       ========================================== */

    function updateStats(items) {
        const statYears = document.getElementById('stat-years');
        const statStories = document.getElementById('stat-stories');
        const statMonths = document.getElementById('stat-months');

        if (statYears) {
            const years = new Set(items.map(i => i._year).filter(Boolean));
            statYears.textContent = years.size;
        }
        if (statStories) {
            statStories.textContent = items.length;
        }
        if (statMonths) {
            const months = new Set(items.map(i => `${i._year}-${i._month}`).filter(Boolean));
            statMonths.textContent = months.size;
        }
    }

    /* ==========================================
       INIT
       ========================================== */

    async function init() {
        const items = await fetchAll();

        populateDropdowns(items);
        renderArchive(items);
        updateStats(items);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();