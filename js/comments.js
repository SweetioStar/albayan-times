/* ============================================
   ALBAYAN TIMES - COMMENTS (Cusdis)
   ============================================
   Visitors can comment without an account.
   Every comment waits for a teacher to approve
   it in the Cusdis dashboard before it shows.

   SETUP (one time):
   1. Sign up free at https://cusdis.com
   2. Click "New website", name it "Albayan Times"
   3. Open "Embed Code" and copy the data-app-id
      value (it looks like 1a2b3c4d-....)
   4. Paste it between the quotes below, then
      git add . / git commit / git push
   ============================================ */

(function () {
    'use strict';

    const CUSDIS_APP_ID = '';               // <-- paste your Cusdis App ID here
    const CUSDIS_HOST = 'https://cusdis.com';

    const NOTE = 'Comments are checked by a teacher before they appear. ' +
                 'Please write your first name and class only — never your email, phone or address.';

    function showComingSoon(container) {
        container.className = 'comments-placeholder';
        container.innerHTML = `
            <h3 class="comments-placeholder-title">Comments Coming Soon</h3>
            <p class="comments-placeholder-text">We're setting up a space for students and visitors to leave comments. Stay tuned!</p>
        `;
    }

    function loadScript() {
        if (document.querySelector('script[data-cusdis-loader]')) {
            if (window.renderCusdis) {
                const el = document.getElementById('cusdis_thread');
                if (el) window.renderCusdis(el);
            }
            return;
        }
        const script = document.createElement('script');
        script.src = `${CUSDIS_HOST}/js/cusdis.es.js`;
        script.async = true;
        script.defer = true;
        script.setAttribute('data-cusdis-loader', '');
        document.body.appendChild(script);
    }

    /**
     * Mount a comment thread.
     * options.container - element to fill (defaults to #site-comments)
     * options.pageId    - stable id for this page's thread (e.g. "news/tea-day-2026")
     * options.pageTitle - title shown in the moderation dashboard
     */
    function mount(options) {
        const opts = options || {};
        const container = opts.container || document.getElementById('site-comments');
        if (!container) return;

        if (!CUSDIS_APP_ID) {
            showComingSoon(container);
            return;
        }

        const pageId = opts.pageId || window.location.pathname;
        const pageUrl = window.location.href;

        container.className = 'comments-live';
        container.innerHTML = `
            <p class="comments-note">${NOTE}</p>
            <div id="cusdis_thread"
                data-host="${CUSDIS_HOST}"
                data-app-id="${CUSDIS_APP_ID}"
                data-page-id="${String(pageId).replace(/"/g, '')}"
                data-page-url="${pageUrl.replace(/"/g, '')}"
                data-page-title="${String(opts.pageTitle || document.title).replace(/"/g, '&quot;')}"
                data-theme="light"></div>
        `;
        loadScript();
    }

    window.AlbayanComments = { mount };
})();
