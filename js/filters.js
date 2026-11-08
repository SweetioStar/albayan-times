/* ============================================
   THE OPEN ALBAYAN TIMES - FILTERS
   ============================================
   Universal filter script handling:
   - Filter pills (News, Young Writers, Watch,
     Book/Movie, Creative Corner)
   - Filter dropdowns (Archive)
   - Multi-group filtering with AND logic
   - Empty groups (shows placeholder message)
   - Content loaded dynamically from JSON
     (re-scans after albayan:contentLoaded event)

   HTML contract:
   - Each group: <div class="filter-group" data-filter-group="grade">
   - Each pill:  <button class="filter-pill active" data-filter-value="all">
   - Each card:  <a data-grade="5" data-category="events">
   - Empty group: <span class="filter-empty">Coming soon</span>
   ============================================ */

(function () {
    'use strict';

    /* ==========================================
       STATE
       ========================================== */

    const filterBar = document.querySelector('.filter-bar');
    if (!filterBar) return;

    /* ==========================================
       HELPERS
       ==========================================
       Include every card class used on the site:
       - .article-card     (News, Young Writers)
       - .video-card       (Watch, News)
       - .writing-card     (reserved)
       - .suggestion-card  (Book/Movie)
       - .creative-card    (Creative Corner) ★ NEW
       - .gallery-item     (reserved)
       - .archive-entry    (Archive)
       - .interview-card   (Reporters)
       - .advice-card      (Lexi's Advice)
       - .resource-card    (Spelling Bee) ★ NEW
       - .enrichment-resource-card (Enrichment) ★ NEW
       ========================================== */

    function getCards() {
        return document.querySelectorAll(
            '.article-card, .video-card, .writing-card, .suggestion-card, ' +
            '.creative-card, .gallery-item, .archive-entry, ' +
            '.interview-card, .advice-card, ' +
            '.resource-card, .enrichment-resource-card'
        );
    }

    function cardMatchesGroup(card, groupName, filterValue) {
        if (filterValue === 'all') return true;
        const attr = 'data-' + groupName;
        const cardValue = card.getAttribute(attr);
        if (!cardValue) return false;
        return cardValue === filterValue;
    }

    function getActiveFilters() {
        const activeFilters = {};

        // Pills
        const pillGroups = filterBar.querySelectorAll('.filter-group');
        pillGroups.forEach((group) => {
            const groupName = group.getAttribute('data-filter-group');
            if (!groupName) return;
            const activePill = group.querySelector('.filter-pill.active');
            if (activePill) {
                activeFilters[groupName] = activePill.getAttribute('data-filter-value');
            }
        });

        // Dropdowns (Archive)
        const selects = filterBar.querySelectorAll('.filter-select');
        selects.forEach((select) => {
            const groupName = select.getAttribute('data-filter-group');
            if (groupName) {
                activeFilters[groupName] = select.value;
            }
        });

        return activeFilters;
    }

    /* ==========================================
       APPLY FILTERS
       ========================================== */

    function applyFilters() {
        const cards = getCards();
        const activeFilters = getActiveFilters();

        let visibleCount = 0;

        cards.forEach((card) => {
            let isVisible = true;

            Object.keys(activeFilters).forEach((groupName) => {
                const value = activeFilters[groupName];
                if (!cardMatchesGroup(card, groupName, value)) {
                    isVisible = false;
                }
            });

            if (isVisible) {
                card.style.display = '';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        updateEmptyState(visibleCount);
    }

    /* ==========================================
       EMPTY STATE
       ========================================== */

    function updateEmptyState(visibleCount) {
        let emptyState = document.getElementById('filter-empty-state');

        if (visibleCount === 0 && getCards().length > 0) {
            if (!emptyState) {
                const grid =
                    document.querySelector('.articles-grid') ||
                    document.querySelector('.videos-grid') ||
                    document.querySelector('.writings-grid') ||
                    document.querySelector('.suggestions-grid') ||
                    document.querySelector('.creative-grid') ||
                    document.querySelector('.gallery-grid') ||
                    document.querySelector('.reporters-grid') ||
                    document.querySelector('.archive-section .container');

                if (grid) {
                    emptyState = document.createElement('div');
                    emptyState.id = 'filter-empty-state';
                    emptyState.className = 'empty-state';
                    emptyState.innerHTML =
                        '<h3>No results found</h3>' +
                        '<p>Try a different filter or clear your selection to see all items.</p>';
                    grid.parentNode.insertBefore(emptyState, grid.nextSibling);
                }
            }
            if (emptyState) emptyState.style.display = 'block';
        } else {
            if (emptyState) emptyState.style.display = 'none';
        }
    }

    /* ==========================================
       SET UP PILL GROUPS
       ========================================== */

    function setupPillGroups() {
        const pillGroups = filterBar.querySelectorAll('.filter-group');
        pillGroups.forEach((group) => {
            const pills = group.querySelectorAll('.filter-pill');
            if (pills.length === 0) return; // Empty group

            pills.forEach((pill) => {
                // Avoid binding twice
                if (pill.dataset.bound === 'true') return;
                pill.dataset.bound = 'true';

                pill.addEventListener('click', () => {
                    pills.forEach((p) => p.classList.remove('active'));
                    pill.classList.add('active');
                    applyFilters();
                });
            });
        });
    }

    /* ==========================================
       SET UP SELECT DROPDOWNS (Archive)
       ========================================== */

    function setupSelects() {
        const selects = filterBar.querySelectorAll('.filter-select');
        selects.forEach((select) => {
            if (select.dataset.bound === 'true') return;
            select.dataset.bound = 'true';

            select.addEventListener('change', () => {
                applyFilters();
            });
        });
    }

    /* ==========================================
       LISTEN FOR DYNAMIC CONTENT
       ==========================================
       content-loader.js fires this event after
       it injects cards. We re-scan and re-apply
       filters.
       ========================================== */

    function watchForContent() {
        document.addEventListener('albayan:contentLoaded', () => {
            // Small delay to let DOM settle
            setTimeout(() => {
                applyFilters();
            }, 50);
        });
    }

    /* ==========================================
       INIT
       ========================================== */

    function init() {
        setupPillGroups();
        setupSelects();
        watchForContent();

        // If content already exists on page load, filter it now
        applyFilters();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();