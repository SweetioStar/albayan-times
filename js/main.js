/* ============================================
   THE OPEN ALBAYAN TIMES - MAIN JS
   ============================================
   1. Mobile navigation toggle
   2. Search bar toggle
   3. Special Features dropdown (click support)
   4. Back to top arrow
   ============================================ */

/* ==========================================
   1. MOBILE NAVIGATION TOGGLE
   ========================================== */

const navToggle = document.querySelector('.nav-toggle');
const navDrawer = document.querySelector('.nav-mobile-drawer');

if (navToggle && navDrawer) {
    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navDrawer.classList.toggle('active');
    });
}

/* ==========================================
   2. SEARCH BAR TOGGLE
   ========================================== */

const searchToggle = document.querySelector('.btn-search');
const searchBar = document.querySelector('.search-bar');
const searchClose = document.querySelector('.search-close');

if (searchToggle && searchBar) {
    searchToggle.addEventListener('click', () => {
        searchBar.classList.toggle('active');
    });
}

if (searchClose && searchBar) {
    searchClose.addEventListener('click', () => {
        searchBar.classList.remove('active');
    });
}

/* ==========================================
   3. SPECIAL FEATURES DROPDOWN
   ==========================================
   Hover works via CSS. This adds click support
   for touch devices and users who prefer clicking.
   ========================================== */

const dropdownToggle = document.querySelector('.nav-dropdown-toggle');
const dropdownPanel = document.querySelector('.nav-dropdown-panel');

if (dropdownToggle && dropdownPanel) {
    dropdownToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownPanel.classList.toggle('open');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!dropdownPanel.contains(e.target) && !dropdownToggle.contains(e.target)) {
            dropdownPanel.classList.remove('open');
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            dropdownPanel.classList.remove('open');
        }
    });
}

/* ==========================================
   4. BACK TO TOP ARROW
   ========================================== */

const backToTop = document.querySelector('.back-to-top');

if (backToTop) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });

    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}