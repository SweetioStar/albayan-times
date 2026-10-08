/* ============================================
   ALBAYAN TIMES - DYNAMIC FOOTER
   ============================================ */

(function () {
    'use strict';

    function detectPrefix() {
        const path = window.location.pathname;
        if (path.includes('/html/')) return '../';
        return '';
    }

    const PREFIX = detectPrefix();

    const FOOTER_HTML = `
        <footer class="site-footer">
            <div class="container">

                <div class="footer-main">

                    <div class="footer-brand">
                        <div class="footer-logo-text">
                            Albayan Times
                            <span>Student Newspaper</span>
                        </div>
                        <p class="footer-tagline">
                            A student-powered digital newspaper celebrating creativity, journalism, and young voices from the Albayan community.
                        </p>
                        <div class="footer-social">
                            <a href="#" aria-label="Facebook">Fb</a>
                            <a href="#" aria-label="Instagram">Ig</a>
                            <a href="#" aria-label="Twitter">Tw</a>
                            <a href="#" aria-label="YouTube">Yt</a>
                        </div>
                    </div>

                    <div class="footer-links-area">

                        <div class="footer-link-group">
                            <h4 class="footer-heading">Main Pages</h4>
                            <div class="footer-links-row">
                                <a href="${PREFIX}index.html">Home</a>
                                <a href="${PREFIX}html/news.html">News</a>
                                <a href="${PREFIX}html/young-writers.html">Young Writers</a>
                                <a href="${PREFIX}html/watch.html">Watch</a>
                                <a href="${PREFIX}html/book-corner.html">Book/Movie</a>
                                <a href="${PREFIX}html/creative-corner.html">Creative Corner</a>
                                <a href="${PREFIX}html/english-stars.html">English Stars</a>
                                <a href="${PREFIX}html/meet-the-reporters.html">Reporters</a>
                                <a href="${PREFIX}html/archive.html">Archive</a>
                            </div>
                        </div>

                        <div class="footer-link-group">
                            <h4 class="footer-heading">Special Features</h4>
                            <div class="footer-links-row">
                                <a href="${PREFIX}html/contest.html">Contest</a>
                                <a href="${PREFIX}html/lexis-advice.html">Lexi's Advice</a>
                                <a href="${PREFIX}html/spelling-bee.html">Spelling Bee</a>
                                <a href="${PREFIX}html/enrichment.html">Enrichment</a>
                            </div>
                        </div>

                    </div>

                </div>

                <div class="footer-bottom">
                    <p>2026 Albayan Times. Created by Durrah Babiker. All rights reserved.</p>
                    <div class="footer-bottom-links">
                        <a href="#">Privacy Policy</a>
                        <a href="#">Terms of Use</a>
                        <a href="#">Help / FAQ</a>
                    </div>
                </div>

            </div>
        </footer>
    `;

    const BACK_TO_TOP_HTML = `
        <button class="back-to-top" aria-label="Back to top"></button>
    `;

    function injectFooter() {
        const placeholder = document.getElementById('site-footer');
        if (!placeholder) {
            console.warn('[Albayan] No #site-footer placeholder on this page.');
            return;
        }
        placeholder.innerHTML = FOOTER_HTML + BACK_TO_TOP_HTML;
    }

    function setupBackToTop() {
        const backToTop = document.querySelector('.back-to-top');
        if (!backToTop) return;

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

    function init() {
        injectFooter();
        setupBackToTop();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();