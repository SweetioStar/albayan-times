/* ============================================
   ALBAYAN TIMES - DYNAMIC HEADER
   ============================================
   Injects ticker + header + nav + mobile drawer.
   Works in TWO locations:
   - Root:   /index.html        → prefix = ''
   - html/:  /html/news.html    → prefix = '../'
   ============================================ */

(function () {
    'use strict';

    function detectPrefix() {
        const path = window.location.pathname;
        if (path.includes('/html/')) {
            return '../';
        }
        return '';
    }

    const PREFIX = detectPrefix();

    function getCurrentPage() {
        const path = window.location.pathname;
        const file = path.substring(path.lastIndexOf('/') + 1) || 'index.html';
        return file;
    }

    function isActive(pageName) {
        return getCurrentPage() === pageName ? ' active' : '';
    }

    /* ==========================================
       TICKER HTML
       ========================================== */

    const TICKER_HTML = `
        <div class="ministry-ticker">
            <div class="ticker-track">
                <span class="ticker-item ticker-vision">
                    <span class="ticker-label">Vision</span>
                    <span class="ticker-text">A pioneering learner for sustainable development.</span>
                </span>
                <span class="ticker-divider"></span>
                <span class="ticker-item ticker-mission">
                    <span class="ticker-label">Mission</span>
                    <span class="ticker-text">Establishing an inclusive, innovative learning environment that fosters values, ethics, and high-level skills to prepare a generation capable of achieving prosperity.</span>
                </span>
                <span class="ticker-divider"></span>

                <span class="ticker-item ticker-vision">
                    <span class="ticker-label">Vision</span>
                    <span class="ticker-text">A pioneering learner for sustainable development.</span>
                </span>
                <span class="ticker-divider"></span>
                <span class="ticker-item ticker-mission">
                    <span class="ticker-label">Mission</span>
                    <span class="ticker-text">Establishing an inclusive, innovative learning environment that fosters values, ethics, and high-level skills to prepare a generation capable of achieving prosperity.</span>
                </span>
                <span class="ticker-divider"></span>
            </div>
        </div>
    `;

    /* ==========================================
       HEADER HTML
       ========================================== */

    const HEADER_HTML = `
        <header class="site-header">
            <div class="container">
                <a href="${PREFIX}index.html" class="header-brand">
                    <img src="${PREFIX}assets/images/logo/moehe-logo.png" alt="Ministry of Education and Higher Education" class="header-logo">
                    <div class="header-title">
                        <span class="header-title-main">Albayan Times</span>
                        <span class="header-title-sub">Student Newspaper</span>
                    </div>
                </a>
                <div class="header-actions">
                    <button class="nav-toggle" aria-label="Toggle navigation">
                        <span></span><span></span><span></span>
                    </button>
                </div>
            </div>
        </header>
    `;

    /* ==========================================
       DESKTOP NAV HTML
       ========================================== */

    const NAV_HTML = `
        <nav class="main-navigation">
            <div class="nav-links-desktop">
                <a href="${PREFIX}index.html" class="nav-link${isActive('index.html')}">Home</a>
                <a href="${PREFIX}html/news.html" class="nav-link${isActive('news.html')}">News</a>
                <a href="${PREFIX}html/young-writers.html" class="nav-link${isActive('young-writers.html')}">Young Writers</a>
                <a href="${PREFIX}html/watch.html" class="nav-link${isActive('watch.html')}">Watch</a>
                <a href="${PREFIX}html/book-corner.html" class="nav-link${isActive('book-corner.html')}">Book/Movie</a>
                <a href="${PREFIX}html/creative-corner.html" class="nav-link${isActive('creative-corner.html')}">Creative Corner</a>
                <a href="${PREFIX}html/english-stars.html" class="nav-link${isActive('english-stars.html')}">English Stars</a>
                <a href="${PREFIX}html/meet-the-reporters.html" class="nav-link${isActive('meet-the-reporters.html')}">Reporters</a>
                <a href="${PREFIX}html/archive.html" class="nav-link${isActive('archive.html')}">Archive</a>

                <div class="nav-dropdown">
                    <button class="nav-dropdown-toggle" type="button">Special Features</button>
                    <div class="nav-dropdown-panel">
                        <div class="nav-dropdown-grid">
                            <a href="${PREFIX}html/contest.html" class="nav-dropdown-link"><span class="nav-dropdown-dot"></span>Contest</a>
                            <a href="${PREFIX}html/lexis-advice.html" class="nav-dropdown-link"><span class="nav-dropdown-dot"></span>Lexi's Advice</a>
                            <a href="${PREFIX}html/spelling-bee.html" class="nav-dropdown-link"><span class="nav-dropdown-dot"></span>Spelling Bee</a>
                            <a href="${PREFIX}html/enrichment.html" class="nav-dropdown-link"><span class="nav-dropdown-dot"></span>Enrichment</a>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    `;

    /* ==========================================
       MOBILE DRAWER HTML
       ========================================== */

    const MOBILE_HTML = `
        <div class="nav-mobile-drawer">
            <div class="nav-mobile-links">
                <a href="${PREFIX}index.html" class="nav-link${isActive('index.html')}">Home</a>
                <a href="${PREFIX}html/news.html" class="nav-link${isActive('news.html')}">News</a>
                <a href="${PREFIX}html/young-writers.html" class="nav-link${isActive('young-writers.html')}">Young Writers</a>
                <a href="${PREFIX}html/watch.html" class="nav-link${isActive('watch.html')}">Watch</a>
                <a href="${PREFIX}html/book-corner.html" class="nav-link${isActive('book-corner.html')}">Book/Movie</a>
                <a href="${PREFIX}html/creative-corner.html" class="nav-link${isActive('creative-corner.html')}">Creative Corner</a>
                <a href="${PREFIX}html/english-stars.html" class="nav-link${isActive('english-stars.html')}">English Stars</a>
                <a href="${PREFIX}html/meet-the-reporters.html" class="nav-link${isActive('meet-the-reporters.html')}">Reporters</a>
                <a href="${PREFIX}html/archive.html" class="nav-link${isActive('archive.html')}">Archive</a>

                <div class="nav-mobile-heading">Special Features</div>
                <div class="nav-mobile-features-grid">
                    <a href="${PREFIX}html/contest.html" class="nav-mobile-feature-link">Contest<span class="nav-mobile-feature-label">QND & more</span></a>
                    <a href="${PREFIX}html/lexis-advice.html" class="nav-mobile-feature-link">Lexi's Advice<span class="nav-mobile-feature-label">Tips & guidance</span></a>
                    <a href="${PREFIX}html/spelling-bee.html" class="nav-mobile-feature-link">Spelling Bee<span class="nav-mobile-feature-label">Practice & quizzes</span></a>
                    <a href="${PREFIX}html/enrichment.html" class="nav-mobile-feature-link">Enrichment<span class="nav-mobile-feature-label">Extra learning</span></a>
                </div>
            </div>
        </div>
    `;

    function injectHeader() {
        const placeholder = document.getElementById('site-header');
        if (!placeholder) {
            console.warn('[Albayan] No #site-header placeholder on this page.');
            return;
        }
        placeholder.innerHTML = TICKER_HTML + HEADER_HTML + NAV_HTML + MOBILE_HTML;
    }

    function setupMobileToggle() {
        const navToggle = document.querySelector('.nav-toggle');
        const navDrawer = document.querySelector('.nav-mobile-drawer');
        if (!navToggle || !navDrawer) return;

        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navDrawer.classList.toggle('active');
        });
    }

    function setupDropdown() {
        const toggle = document.querySelector('.nav-dropdown-toggle');
        const panel = document.querySelector('.nav-dropdown-panel');
        if (!toggle || !panel) return;

        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            panel.classList.toggle('open');
        });

        document.addEventListener('click', (e) => {
            if (!panel.contains(e.target) && !toggle.contains(e.target)) {
                panel.classList.remove('open');
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                panel.classList.remove('open');
            }
        });
    }

    function init() {
        injectHeader();
        setupMobileToggle();
        setupDropdown();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();