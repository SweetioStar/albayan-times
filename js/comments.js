/* ============================================
   ALBAYAN TIMES - COMMENTS (Google Form + Google Sheet)
   ============================================
   No accounts needed. Comments are sent to a Google
   Form, saved in its Google Sheet, and shown on the
   page from that sheet.

   To HIDE a comment: in the sheet, type  no  in the
   "Show" column of that row (or delete the row).

   EDIT / DELETE: people can edit or delete their own
   comments from the same device and browser they used
   to post. Each edit or delete is saved as a new row in
   the sheet, ending with a short code such as
   ⟦e:k3x9q2:...⟧ — that code is how the site knows
   which comment it belongs to. Please leave the codes as
   they are.

   IMPORTANT: In the Google Sheet, File > Share > Publish
   to web > "Published content and settings" must have
   "Automatically republish when changes are made" ticked,
   or new comments will never appear for other people.
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
    const STORE_KEY = 'albayan-my-comments';
    const TOKEN_RE = /\s*⟦([ced]):([^⟧]*)⟧\s*$/;

    /* ---------------- helpers ---------------- */
    function esc(str) {
        if (str === null || str === undefined) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function randomId(len) {
        const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
        const bytes = new Uint8Array(len);
        (window.crypto || window.msCrypto).getRandomValues(bytes);
        return Array.from(bytes, b => chars[b % chars.length]).join('');
    }

    /* Small SHA-256 (works on http and https, so every visitor checks codes the same way) */
    function sha256(ascii) {
        const rightRotate = (v, a) => (v >>> a) | (v << (32 - a));
        const K = [], H = [];
        let primeCounter = 0;
        const isComposite = {};
        for (let candidate = 2; primeCounter < 64; candidate++) {
            if (!isComposite[candidate]) {
                for (let i = 0; i < 313; i += candidate) isComposite[i] = candidate;
                H[primeCounter] = (Math.pow(candidate, 0.5) * 0x100000000) | 0;
                K[primeCounter++] = (Math.pow(candidate, 1 / 3) * 0x100000000) | 0;
            }
        }
        const hash = H.slice(0, 8);
        const words = [];
        const bitLen = ascii.length * 8;
        ascii += '\x80';
        while (ascii.length % 64 - 56) ascii += '\x00';
        for (let i = 0; i < ascii.length; i++) {
            const j = ascii.charCodeAt(i);
            words[i >> 2] |= j << ((3 - i) % 4) * 8;
        }
        words[words.length] = ((bitLen / 0x100000000) | 0);
        words[words.length] = bitLen;
        for (let j = 0; j < words.length;) {
            const w = words.slice(j, j += 16);
            const old = hash.slice(0);
            for (let i = 0; i < 64; i++) {
                const w15 = w[i - 15], w2 = w[i - 2];
                const a = hash[0], e = hash[4];
                const temp1 = hash[7] + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
                    ((e & hash[5]) ^ ((~e) & hash[6])) + K[i] +
                    (w[i] = (i < 16) ? w[i] : (w[i - 16] + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                        w[i - 7] + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) | 0);
                const temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
                    ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
                hash.unshift((temp1 + temp2) | 0);
                hash[4] = (hash[4] + temp1) | 0;
                hash.pop();
            }
            for (let i = 0; i < 8; i++) hash[i] = (hash[i] + old[i]) | 0;
        }
        let result = '';
        for (let i = 0; i < 8; i++) {
            for (let j = 3; j + 1; j--) {
                const b = (hash[i] >> (j * 8)) & 255;
                result += ((b < 16) ? 0 : '') + b.toString(16);
            }
        }
        return result;
    }
    const lock = secret => sha256(secret).slice(0, 16);

    /* My own comments, remembered on this device */
    function loadMine() {
        try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}') || {}; } catch (e) { return {}; }
    }
    function saveMine(mine) {
        try { localStorage.setItem(STORE_KEY, JSON.stringify(mine)); } catch (e) { /* storage off: edit/delete only this visit */ }
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
                if (['PAGE', 'COMMENT'].includes(v)) ids[v] = key;
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

    function splitName(raw) {
        const cut = raw.indexOf(NAME_SEPARATOR);
        if (cut > 0 && cut <= 40) return { name: raw.slice(0, cut).trim(), text: raw.slice(cut + NAME_SEPARATOR.length).trim() };
        return { name: '', text: raw.trim() };
    }

    /* Build the list of comments for this page, applying edits and deletes in order */
    async function loadComments(pageId) {
        const res = await fetch(SHEET_CSV_LINK + (SHEET_CSV_LINK.includes('?') ? '&' : '?') + 't=' + Date.now(), { cache: 'no-store' });
        if (!res.ok) throw new Error('sheet');
        const rows = parseCSV(await res.text());
        if (rows.length < 2) return [];
        const header = rows[0];
        const col = {
            time: findColumn(header, ['timestamp']),
            page: findColumn(header, ['page']),
            text: findColumn(header, ['comment', 'your comment']),
            show: findColumn(header, ['show'])
        };
        if (col.page < 0 || col.text < 0) return [];

        const byId = {};
        const order = [];
        rows.slice(1).forEach((r, rowIndex) => {
            if ((r[col.page] || '').trim() !== pageId) return;
            const raw = (r[col.text] || '').trim();
            if (!raw) return;
            const show = col.show >= 0 ? (r[col.show] || '').trim().toLowerCase() : '';
            const visible = MODE === 'approve' ? show === 'yes' : show !== 'no';
            const time = col.time >= 0 ? (r[col.time] || '').trim() : '';

            const m = raw.match(TOKEN_RE);
            const body = m ? raw.slice(0, m.index) : raw;
            if (!m) {                                   // older comment without a code
                if (!visible) return;
                const c = { id: 'row' + rowIndex, ...splitName(body), time };
                byId[c.id] = c; order.push(c.id);
                return;
            }
            const [type, data] = [m[1], m[2].split(':')];
            if (type === 'c') {
                const [id, hash] = data;
                if (!id || byId[id]) return;
                byId[id] = { id, hash, ...splitName(body), time, hidden: !visible };
                order.push(id);
            } else {
                const [id, secret, nextHash] = data;
                const c = byId[id];
                if (!c || !secret || lock(secret) !== c.hash || !visible) return;
                if (type === 'd') { c.deleted = true; return; }
                const parts = splitName(body);
                if (!parts.text) return;
                c.text = parts.text;
                if (parts.name) c.name = parts.name;
                c.hash = nextHash || c.hash;
                c.edited = true;
            }
        });
        return order.map(id => byId[id]).filter(c => !c.hidden && !c.deleted);
    }

    function formatDate(raw) {
        if (!raw) return '';
        return raw.split(' ')[0];
    }

    function commentHtml(c, isMine, isNew) {
        const initial = (c.name || '?').trim().charAt(0).toUpperCase();
        return `
            <li class="comment-item${isNew ? ' comment-new' : ''}" data-id="${esc(c.id)}">
                <span class="comment-avatar comment-avatar-letter" aria-hidden="true">${esc(initial)}</span>
                <div class="comment-content">
                    <div class="comment-head">
                        <strong>${esc(c.name || 'Albayan reader')}</strong>
                        ${c.time ? `<span class="comment-date">${esc(formatDate(c.time))}</span>` : ''}
                        ${c.edited ? '<span class="comment-edited">(edited)</span>' : ''}
                        ${isMine ? `
                            <span class="comment-actions">
                                <button type="button" class="comment-action" data-act="edit">Edit</button>
                                <button type="button" class="comment-action comment-action-delete" data-act="delete">Delete</button>
                            </span>` : ''}
                    </div>
                    <p class="comment-text">${esc(c.text)}</p>
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
            <div class="comment-panel">
                <h3 class="comment-list-title">What readers said <span class="comment-count"></span></h3>
                <ul class="comment-list"><li class="comment-empty">Loading comments…</li></ul>
            </div>
        `;

        const list = container.querySelector('.comment-list');
        const formEl = container.querySelector('.comment-form');
        const status = container.querySelector('.comment-status');
        const button = container.querySelector('.comment-submit');
        const countEl = container.querySelector('.comment-count');
        const panel = container.querySelector('.comment-panel');

        // On wide screens the comments panel matches the form's height, so neither side has empty space
        const matchHeights = () => {
            if (!panel) return;
            panel.style.height = window.innerWidth > 860 ? formEl.offsetHeight + 'px' : '';
        };
        matchHeights();
        window.addEventListener('resize', matchHeights);

        let comments = [];
        const mine = loadMine();

        const isMine = c => !!(mine[c.id] && mine[c.id].page === pageId);

        function render(newId) {
            // Show my latest version (the published sheet can be a few minutes behind)
            const shown = comments.map(c => {
                const m = mine[c.id];
                if (m && m.page === pageId && m.updated && (!c.edited || m.text !== c.text)) {
                    return { ...c, text: m.text, name: m.name || c.name, edited: m.edited || c.edited };
                }
                return c;
            }).filter(c => !(mine[c.id] && mine[c.id].deleted));

            // My comments that the published sheet doesn't have yet
            Object.keys(mine).forEach(id => {
                const m = mine[id];
                if (m.page !== pageId || m.deleted || shown.some(c => c.id === id)) return;
                shown.push({ id, name: m.name, text: m.text, time: '', edited: m.edited });
            });

            list.innerHTML = shown.length
                ? shown.map(c => commentHtml(c, isMine(c), c.id === newId)).join('')
                : '<li class="comment-empty"><span class="comment-empty-icon">💬</span><strong>No comments yet</strong><span>Be the first to say something kind!</span></li>';
            countEl.textContent = shown.length ? shown.length : '';
        }

        function setStatus(text, kind) {
            status.textContent = text;
            status.className = 'comment-status' + (kind ? ' is-' + kind : '');
            if (kind === 'ok') setTimeout(() => { if (status.textContent === text) status.textContent = ''; }, 4000);
        }

        async function send(commentValue) {
            const body = new URLSearchParams();
            body.append(form.ids.PAGE, pageId);
            body.append(form.ids.COMMENT, commentValue);
            // Google Forms does not send a readable reply to other websites, so "no-cors" is expected here
            await fetch(form.action, { method: 'POST', mode: 'no-cors', body });
        }

        loadComments(pageId).then(result => {
            comments = result;
            // Forget local copies that the sheet now shows exactly
            render();
        }).catch(() => {
            list.innerHTML = '<li class="comment-empty">Comments could not be loaded right now.</li>';
        });

        /* ---- post ---- */
        formEl.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = formEl.author.value.trim();
            const text = formEl.text.value.trim();
            if (!name) { setStatus('Please write your name.', 'error'); formEl.author.focus(); return; }
            if (!text) { setStatus('Please write a comment.', 'error'); return; }

            button.disabled = true;
            setStatus('Posting…');
            const id = randomId(8);
            const secret = randomId(16);
            try {
                await send(`${name}${NAME_SEPARATOR}${text} ⟦c:${id}:${lock(secret)}⟧`);
                mine[id] = { page: pageId, secret, name, text, updated: Date.now() };
                saveMine(mine);
                formEl.text.value = '';
                if (MODE === 'approve') {
                    setStatus('Thank you!', 'ok');
                } else {
                    render(id);
                    list.scrollTop = list.scrollHeight;
                    setStatus('Thank you!', 'ok');
                }
            } catch (err) {
                setStatus('Not sent. Try again.', 'error');
            } finally {
                button.disabled = false;
            }
        });

        /* ---- edit / delete my own comments ---- */
        list.addEventListener('click', async (e) => {
            const btn = e.target.closest('button[data-act]');
            if (!btn) return;
            const item = btn.closest('.comment-item');
            const id = item && item.dataset.id;
            const m = id && mine[id];
            if (!m) return;
            const act = btn.dataset.act;

            if (act === 'edit') {
                const p = item.querySelector('.comment-text');
                item.querySelector('.comment-actions').hidden = true;
                p.outerHTML = `
                    <div class="comment-edit">
                        <textarea maxlength="${MAX_LENGTH}" rows="3">${esc(m.text)}</textarea>
                        <div class="comment-edit-actions">
                            <button type="button" class="comment-action" data-act="cancel">Cancel</button>
                            <button type="button" class="comment-action comment-action-save" data-act="save">Save</button>
                        </div>
                    </div>`;
                const ta = item.querySelector('.comment-edit textarea');
                ta.focus();
                ta.setSelectionRange(ta.value.length, ta.value.length);
                return;
            }

            if (act === 'cancel') { render(); return; }

            if (act === 'save') {
                const text = item.querySelector('.comment-edit textarea').value.trim();
                if (!text) return;
                if (text === m.text) { render(); return; }
                btn.disabled = true;
                const nextSecret = randomId(16);
                try {
                    await send(`${m.name}${NAME_SEPARATOR}${text} ⟦e:${id}:${m.secret}:${lock(nextSecret)}⟧`);
                    Object.assign(m, { text, secret: nextSecret, edited: true, updated: Date.now() });
                    saveMine(mine);
                    render();
                    setStatus('Saved!', 'ok');
                } catch (err) {
                    btn.disabled = false;
                    setStatus('Not saved. Try again.', 'error');
                }
                return;
            }

            if (act === 'delete') {
                const head = item.querySelector('.comment-actions');
                head.innerHTML = `
                    <span class="comment-confirm">Delete?</span>
                    <button type="button" class="comment-action comment-action-delete" data-act="confirm-delete">Yes</button>
                    <button type="button" class="comment-action" data-act="cancel">No</button>`;
                return;
            }

            if (act === 'confirm-delete') {
                btn.disabled = true;
                try {
                    await send(`⟦d:${id}:${m.secret}⟧`);
                    m.deleted = true;
                    m.updated = Date.now();
                    saveMine(mine);
                    render();
                    setStatus('Deleted.', 'ok');
                } catch (err) {
                    btn.disabled = false;
                    setStatus('Not deleted. Try again.', 'error');
                }
            }
        });
    }

    window.AlbayanComments = { mount };
})();
