/* ============================================
   THE OPEN ALBAYAN TIMES - FILTERS
   ============================================
   Universal filter script that handles:
   - Filter pills (news, watch, young-writers, book-corner, creative-corner)
   - Filter dropdowns (archive)
   - Multi-group filtering with AND logic
   ============================================ */

(function () {
    'use strict';

    /* ==========================================
       DETECT PAGE TYPE
       ========================================== */

    // Find the first filter-bar on the page
    const filterBar = document.querySelector('.filter-bar');
    if (!filterBar) return;

    /* ==========================================
       HELPERS
       ========================================== */

    // Get all cards depending on page
    function getCards() {
        return document.querySelectorAll(
            '.article-card, .video-card, .writing-card, .book-card, .gallery-item, .archive-entry'
        );
    }

    // Check whether a card matches a given group's filter
    function cardMatchesGroup(card, groupName, filterValue) {
        // Attribute name in HTML uses data-<groupName>
        const attr = 'data-' + groupName;
        const cardValue = card.getAttribute(attr);

        // If filter is "all", always match
        if (filterValue === 'all') return true;

        // Card doesn't have the attribute — don't match
        if (!cardValue) return false;

        // Direct match
        return cardValue === filterValue;
    }

    // Apply all active filters
    function applyFilters() {
        const cards = getCards();
        const filterBar = document.querySelector('.filter-bar');

        // If there are filter-bar pill groups, gather each group's active value
        const pillGroups = filterBar.querySelectorAll('.filter-group');

        const activePills = {};
        pillGroups.forEach((group, index) => {
            const groupName = group.getAttribute('data-filter-group');
            const activePill = group.querySelector('.filter-pill.active');
            if (groupName && activePill) {
                activePills[groupName] = activePill.getAttribute('data-filter-value');
            }
        });

        // Also check for select dropdowns (archive page)
        const selects = filterBar.querySelectorAll('.filter-select');
        selects.forEach((select) => {
            const groupName = select.getAttribute('data-filter-group');
            if (groupName) {
                activePills[groupName] = select.value;
            }
        });

        // Apply to each card
        let visibleCount = 0;
        cards.forEach((card) => {
            let isVisible = true;

            // Check every group — AND logic
            Object.keys(activePills).forEach((groupName) => {
                const filterValue = activePills[groupName];
                if (!cardMatchesGroup(card, groupName, filterValue)) {
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

        // Show / hide empty state message
        updateEmptyState(visibleCount);
    }

    // Show a friendly message if 0 results
    function updateEmptyState(visibleCount) {
        let emptyState = document.getElementById('filter-empty-state');

        if (visibleCount === 0) {
            if (!emptyState) {
                const grid =
                    document.querySelector('.articles-grid') ||
                    document.querySelector('.videos-grid') ||
                    document.querySelector('.writings-grid') ||
                    document.querySelector('.books-grid') ||
                    document.querySelector('.gallery-grid') ||
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
       ==========================================
       Each .filter-group should have:
         - data-filter-group="grade"  (or "category", "genre")
       Each .filter-pill should have:
         - data-filter-value="all"  (or "5", "essay", etc.)
       ========================================== */

    const pillGroups = filterBar.querySelectorAll('.filter-group');
    pillGroups.forEach((group) => {
        const pills = group.querySelectorAll('.filter-pill');

        pills.forEach((pill) => {
            pill.addEventListener('click', () => {
                // Remove active from all pills in this group
                pills.forEach((p) => p.classList.remove('active'));
                // Add active to clicked pill
                pill.classList.add('active');
                // Re-apply filters
                applyFilters();
            });
        });
    });

    /* ==========================================
       SET UP SELECT DROPDOWNS (archive)
       ========================================== */

    const selects = filterBar.querySelectorAll('.filter-select');
    selects.forEach((select) => {
        select.addEventListener('change', () => {
            applyFilters();
        });
    });

    /* ==========================================
       INITIAL RUN
       ==========================================
       In case any filter is pre-active when the page loads.
       ========================================== */

    applyFilters();

})();