/* ============================================
   THE OPEN ALBAYAN TIMES - MAIN JS
   ============================================
   Global interactions that apply to every page.
   
   Note: The header and footer handle their own
   toggles (mobile menu, dropdown, back-to-top)
   inside js/header.js and js/footer.js.
   
   This file is for extra behaviors that might
   be added over time.
   ============================================ */

(function () {
    'use strict';

    /* ==========================================
       1. SMOOTH SCROLL FOR ANCHOR LINKS
       ==========================================
       Any <a href="#challenge"> click scrolls
       smoothly instead of jumping.
       ========================================== */

    function setupSmoothScroll() {
        const anchorLinks = document.querySelectorAll('a[href^="#"]:not([href="#"])');

        anchorLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const targetId = link.getAttribute('href').substring(1);
                const targetEl = document.getElementById(targetId);
                if (!targetEl) return;

                e.preventDefault();

                const headerOffset = 20;
                const elementPosition = targetEl.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            });
        });
    }

    /* ==========================================
       2. EXTERNAL LINK SAFETY
       ==========================================
       Any link pointing to another domain opens
       in a new tab with proper security attrs.
       ========================================== */

    function setupExternalLinks() {
        const links = document.querySelectorAll('a[href^="http"]');
        links.forEach(link => {
            if (link.hostname !== window.location.hostname) {
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');
            }
        });
    }

    /* ==========================================
       3. LOGO / TITLE LINKS TO HOME
       ==========================================
       If any page has a broken link on the
       logo, make sure it goes home.
       ========================================== */

    function fixBrandLink() {
        const brand = document.querySelector('.header-brand');
        if (brand && brand.getAttribute('href') === '#') {
            const isSubfolder = window.location.pathname.includes('/html/');
            brand.setAttribute('href', isSubfolder ? '../index.html' : 'index.html');
        }
    }

    /* ==========================================
       INIT
       ========================================== */

    function init() {
        setupSmoothScroll();
        setupExternalLinks();
        fixBrandLink();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();