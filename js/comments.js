/* ============================================
   ALBAYAN TIMES - COMMENTS (Google Form + Google Sheet)
   ============================================
   No accounts needed. Comments are sent to a Google
   Form, saved in its Google Sheet, and shown on the
   page from that sheet.

   To HIDE a comment: in the sheet, type  no  in the
   "Show" column of that row (or delete the row).
   It disappears from the site within a few minutes.

   SETUP: paste your two links below, then push.
   ============================================ */

(function () {
    'use strict';

    // 1. The pre-filled link from your Google Form
    //    (answers typed as PAGE and COMMENT)
    const FORM_PREFILLED_LINK = 'https://docs.google.com/forms/d/e/1FAIpQLScqICp7ioR1pYtF0KIwMn4KfvttbwJ4nEjJD0bqbgE5avupvg/viewform?usp=pp_url&entry.499708900=PAGE&entry.659214529=COMMENT';

    // 2. The "Publish to web" CSV link of the responses sheet
    const SHEET_CSV_LINK = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQgiCyBE_uwM9LmUrE6pcYZ90RUgrab7COat1rkkivhwQAdqT9wSv5O8eDdABCaaBnoZmkMeuq1dGaP/pub?gid=331871529&single=true&output=csv';

    // 'show'    = comments appear right away; type "no" in Show to hide one
    // 'approve' = comments appear only after you type "yes" in Show
    const MODE = 'show';

    const MAX_LENGTH = 500;
    const NAME_SEPARATOR = ' — ';

    /* ---------------- helpers ---------------- */
    function esc(str) {
        if (str === null || str === undefined) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    // Read the form address and the entry.### id of each question from the pre-filled link
    function parseForm(link) {
        try {
            const url = new URL(link);
            const action = url.origin + url.pathname.replace(/\/viewform.*$/, '/formResponse');
            const ids = {};
            url.searchParams.forEach((value, key) => {
                if (!key.startsWith('entry.')) return;
                const v = value.trim().toUpperCase();
                if (['PAGE', 'NAME', 'COMMENT'].includes(v)) ids[v] = key;
            });
            if (!ids.PAGE || !ids.COMMENT) return null;
            return { action, ids };
        } catch (e) {
            return null;
        }
    }

    // Small CSV parser that understands quotes, commas and new lines inside cells
    function parseCSV(text) {
        const rows = [];
        let row = [], cell = '', inQuotes = false;
        for (let i = 0; i < text.length; i++) {
            const c = text[i];
            if (inQuotes) {
                if (c === '"') {
                    if (text[i + 1] === '"') { cell += '"'; i++; }
                    else inQuotes = false;
                } else cell += c;
            } else if (c === '"') inQuotes = true;
            else if (c === ',') { row.push(cell); cell = ''; }
            else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
            else if (c !== '\r') cell += c;
        }
        if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
        return rows;
    }

    function findColumn(header, names) {
        return header.findIndex(h => names.some(n => h.trim().toLowerCase() === n));
    }

    async function loadComments(pageId) {
        const res = await fetch(SHEET_CSV_LINK + (SHEET_CSV_LINK.includes('?') ? '&' : '?') + 't=' + Date.now());
        if (!res.ok) throw new Error('sheet');
        const rows = parseCSV(await res.text());
        if (rows.length < 2) return [];
        const header = rows[0];
        const col = {
            time: findColumn(header, ['timestamp']),
            page: findColumn(header, ['page']),
            name: findColumn(header, ['name', 'your name', 'first name']),
            cls: findColumn(header, ['class', 'your class']),
            text: findColumn(header, ['comment', 'your comment']),
            show: findColumn(header, ['show'])
        };
        if (col.page < 0 || col.text < 0) return [];

        return rows.slice(1).filter(r => {
            if ((r[col.page] || '').trim() !== pageId) return false;
            if (!(r[col.text] || '').trim()) return false;
            const show = col.show >= 0 ? (r[col.show] || '').trim().toLowerCase() : '';
            if (MODE === 'approve') return show === 'yes';
            return show !== 'no';
        }).map(r => {
            let text = (r[col.text] || '').trim();
            let name = col.name >= 0 ? (r[col.name] || '').trim() : '';
            // When the form has no Name question, the name is saved as "Name — comment"
            if (!name) {
                const cut = text.indexOf(NAME_SEPARATOR);
                if (cut > 0 && cut <= 40) { name = text.slice(0, cut).trim(); text = text.slice(cut + NAME_SEPARATOR.length).trim(); }
            }
            return {
            name,
            text,
            time: col.time >= 0 ? (r[col.time] || '').trim() : ''
            };
        });
    }

    function formatDate(raw) {
        if (!raw) return '';
        // Google Sheets timestamps look like 11/08/2026 12:30:00 or 08/11/2026 12:30:00
        const datePart = raw.split(' ')[0];
        return datePart;
    }

    function commentHtml(c, isNew) {
        const initial = (c.name || '?').trim().charAt(0).toUpperCase();
        return `
            <li class="comment-item${isNew ? ' comment-new' : ''}">
                <span class="comment-avatar comment-avatar-letter" aria-hidden="true">${esc(initial)}</span>
                <div class="comment-content">
                    <div class="comment-head">
                        <strong>${esc(c.name || 'Albayan reader')}</strong>
                        ${c.time ? `<span class="comment-date">${esc(formatDate(c.time))}</span>` : ''}
                    </div>
                    <p>${esc(c.text)}</p>
                </div>
            </li>
        `;
    }

    function showComingSoon(container) {
        container.className = 'comments-placeholder';
        container.innerHTML = `
            <h3 class="comments-placeholder-title">Comments Coming Soon</h3>
            <p class="comments-placeholder-text">We're setting up a space for students and visitors to leave comments. Stay tuned!</p>
        `;
    }

    /**
     * Mount a comment box.
     * options.container - element to fill (defaults to #site-comments)
     * options.pageId    - stable id for this page (e.g. "news/tea-day-2026")
     */
    function mount(options) {
        const opts = options || {};
        const container = opts.container || document.getElementById('site-comments');
        if (!container) return;

        const form = parseForm(FORM_PREFILLED_LINK);
        if (!form || !SHEET_CSV_LINK) {
            showComingSoon(container);
            return;
        }

        const pageId = String(opts.pageId || window.location.pathname);

        container.className = 'comments-live';
        container.innerHTML = `
            <form class="comment-form" novalidate>
                <h4 class="comment-form-title">Leave a comment</h4>
                <label class="comment-name-row">
                    <span class="comment-name-label">Name:</span>
                    <input type="text" name="author" maxlength="40" required autocomplete="off" placeholder="Write your name">
                </label>
                <textarea name="text" rows="6" maxlength="${MAX_LENGTH}" required placeholder="Write something kind…" aria-label="Your comment"></textarea>
                <div class="comment-form-actions">
                    <span class="comment-status" aria-live="polite"></span>
                    <button type="submit" class="comment-submit">Post comment</button>
                </div>
            </form>
            <h3 class="comment-list-title">What readers said</h3>
            <ul class="comment-list"><li class="comment-empty">Loading comments…</li></ul>
        `;

        const list = container.querySelector('.comment-list');
        const formEl = container.querySelector('.comment-form');
        const status = container.querySelector('.comment-status');
        const button = container.querySelector('.comment-submit');

        loadComments(pageId).then(comments => {
            list.innerHTML = comments.length
                ? comments.map(c => commentHtml(c, false)).join('')
                : '<li class="comment-empty">No comments yet. Be the first!</li>';
        }).catch(() => {
            list.innerHTML = '<li class="comment-empty">Comments could not be loaded right now.</li>';
        });

        formEl.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = formEl.author.value.trim();
            const text = formEl.text.value.trim();
            if (!name) {
                status.textContent = 'Please write your name.';
                status.className = 'comment-status is-error';
                formEl.author.focus();
                return;
            }
            if (!text) {
                status.textContent = 'Please write a comment first.';
                status.className = 'comment-status is-error';
                return;
            }

            button.disabled = true;
            status.textContent = 'Posting…';
            status.className = 'comment-status';

            const body = new URLSearchParams();
            body.append(form.ids.PAGE, pageId);
            if (form.ids.NAME) {
                body.append(form.ids.NAME, name);
                body.append(form.ids.COMMENT, text);
            } else {
                body.append(form.ids.COMMENT, name + NAME_SEPARATOR + text);
            }

            try {
                // Google Forms does not send a readable reply to other websites, so "no-cors" is expected here
                await fetch(form.action, { method: 'POST', mode: 'no-cors', body });
                if (MODE !== 'approve') {
                    const empty = list.querySelector('.comment-empty');
                    if (empty) empty.remove();
                    list.insertAdjacentHTML('beforeend', commentHtml({ name, text, time: '' }, true));
                }
                formEl.text.value = '';
                status.textContent = MODE === 'approve'
                    ? 'Thank you! Your comment will appear after a teacher approves it.'
                    : 'Thank you! Your comment was posted.';
                status.className = 'comment-status is-ok';
            } catch (err) {
                status.textContent = 'Sorry, your comment could not be sent. Please try again.';
                status.className = 'comment-status is-error';
            } finally {
                button.disabled = false;
            }
        });
    }

    window.AlbayanComments = { mount };
})();
