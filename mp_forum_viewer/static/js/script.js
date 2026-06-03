let offset = 0;
let loading = false;
let activeIntents = new Set();
let filtersOpen = false;

const PAGE_SIZE = 20;

const INTENT_MAP = {
    'FS': { label: 'Selling', color: 'icon-fs', svg: '<path d=\"M11.8 2c-1.1 0-2.2.4-3 1.2l-6.6 6.6c-1.6 1.6-1.6 4.1 0 5.7l6.6 6.6c.8.8 1.9 1.2 3 1.2s2.2-.4 3-1.2l6.6-6.6c1.6-1.6 1.6-4.1 0-5.7l-6.6-6.6c-.8-.8-1.9-1.2-3-1.2zm0 2c.6 0 1.1.2 1.5.6l6.6 6.6c.8.8.8 2.1 0 2.9l-6.6 6.6c-.4.4-.9.6-1.5.6s-1.1-.2-1.5-.6l-6.6-6.6c-.8-.8-.8-2.1 0-2.9l6.6-6.6c.4-.4.9-.6 1.5-.6zM12 7a2 2 0 1 0 0 4 2 2 0 0 0 0-4z\"/>' },
    'WTB': { label: 'Buying', color: 'icon-wtb', svg: '<path d=\"M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z\"/>' },
    'FREE': { label: 'Free', color: 'icon-free', svg: '<path d=\"M20 6h-2.18c.11-.31.18-.65.18-1a2.5 2.5 0 0 0-5-0c0 .35.07.69.18 1H11a2.5 2.5 0 0 0-5 0c0 .35.07.69.18 1H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-1c0-.28.22-.5.5-.5s.5.22.5.5-.22.5-.5.5h-.5V5zM7 5c0-.28.22-.5.5-.5s.5.22.5.5-.22.5-.5.5H7V5zm13 15H4V8h16v12z\"/>' },
    'UNKNOWN': { label: '?', color: '', svg: '<path d=\"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z\"/>' }
};

function escAttr(str) {
    return String(str ?? '');
}

window.updateImage = (postId, direction) => {
    const wrapper = document.querySelector(`.thumb-wrapper[data-id="${CSS.escape(postId)}"]`);
    if (!wrapper) return;
    const img = wrapper.querySelector('img');
    const urls = JSON.parse(wrapper.dataset.urls);
    let idx = parseInt(wrapper.dataset.index, 10);

    idx = (idx + direction + urls.length) % urls.length;
    wrapper.dataset.index = idx;
    img.src = urls[idx];

    wrapper.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === idx));
};

function formatTimeAgo(dateStr) {
    if (!dateStr || dateStr === 'N/A') return { displayText: 'N/A', fullTime: 'N/A' };
    const utcString = dateStr.replace(' ', 'T') + (dateStr.includes('Z') ? '' : 'Z');
    const serverDate = new Date(utcString);
    const msDiff = Date.now() - serverDate;

    if (isNaN(msDiff)) return { displayText: 'Invalid date', fullTime: 'Invalid date' };

    const fullTime = serverDate.toLocaleString(navigator.language, { dateStyle: 'short', timeStyle: 'medium' });
    const abbreviatedDate = serverDate.toLocaleString(navigator.language, { month: 'numeric', day: 'numeric', year: '2-digit' });

    let displayText;
    if (msDiff < 10 * 60 * 1000) displayText = `${Math.ceil(msDiff / 60000)} min ago`;
    else if (msDiff < 60 * 60 * 1000) displayText = `${Math.floor(msDiff / 60000)} min ago`;
    else if (msDiff < 24 * 60 * 60 * 1000) displayText = `${Math.floor(msDiff / 3600000)} hr ago`;
    else displayText = abbreviatedDate;

    return { displayText, fullTime };
}

function buildThumb(post, iconData) {
    const urls = post.image_urls || [];
    const wrapper = document.createElement('div');
    wrapper.className = 'thumb-wrapper';

    if (urls.length > 0) {
        const safeUrls = urls.filter(u => /^https?:\/\//i.test(u));
        if (safeUrls.length === 0) return buildIconThumb(iconData);

        wrapper.dataset.id = escAttr(post.id);
        wrapper.dataset.index = '0';
        wrapper.dataset.urls = JSON.stringify(safeUrls);

        const img = document.createElement('img');
        img.src = safeUrls[0];
        img.loading = 'lazy';
        img.alt = '';
        wrapper.appendChild(img);

        if (safeUrls.length > 1) {
            const prev = document.createElement('div');
            prev.className = 'nav-arrow prev';
            prev.textContent = '‹';
            prev.addEventListener('click', e => { e.stopPropagation(); e.preventDefault(); window.updateImage(post.id, -1); });

            const next = document.createElement('div');
            next.className = 'nav-arrow next';
            next.textContent = '›';
            next.addEventListener('click', e => { e.stopPropagation(); e.preventDefault(); window.updateImage(post.id, 1); });

            const dotContainer = document.createElement('div');
            dotContainer.className = 'dot-container';
            safeUrls.forEach((_, i) => {
                const dot = document.createElement('div');
                dot.className = 'dot' + (i === 0 ? ' active' : '');
                dotContainer.appendChild(dot);
            });

            wrapper.append(prev, next, dotContainer);
        }
    } else {
        return buildIconThumb(iconData);
    }
    return wrapper;
}

function buildIconThumb(iconData) {
    const wrapper = document.createElement('div');
    wrapper.className = 'thumb-wrapper';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', `intent-icon ${iconData.color}`);
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.innerHTML = iconData.svg;
    wrapper.appendChild(svg);
    return wrapper;
}

function buildCard(post) {
    const intent = post.intent || 'UNKNOWN';
    const iconData = INTENT_MAP[intent] || INTENT_MAP['UNKNOWN'];
    const { displayText: lastUpdatedStr, fullTime: lastUpdatedFull } = formatTimeAgo(post.last_post_ts);

    const card = document.createElement('div');
    card.className = 'post-card';
    card.appendChild(buildThumb(post, iconData));

    const content = document.createElement('div');
    content.className = 'post-content';

    const link = document.createElement('a');
    const href = String(post.url || '');
    link.href = /^https?:\/\//i.test(href) ? href : '#';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.title = escAttr(post.title);
    link.textContent = post.title || '(no title)';

    const intentBadge = document.createElement('span');
    intentBadge.className = `intent-badge badge-${intent.toLowerCase()}`;
    intentBadge.textContent = iconData.label;

    const titleRow = document.createElement('div');
    titleRow.className = 'title-row';
    titleRow.appendChild(link);
    titleRow.appendChild(intentBadge);

    const meta = document.createElement('div');
    meta.className = 'meta';

    const location = document.createElement('span');
    location.className = 'location';
    location.textContent = post.location || 'Unknown';

    const timestamp = document.createElement('span');
    timestamp.className = 'timestamp';
    timestamp.title = lastUpdatedFull;
    timestamp.textContent = lastUpdatedStr;

    meta.append(location, timestamp);
    content.append(titleRow, meta);
    card.appendChild(content);

    return card;
}

const API_BASE = `https://mp-forum-server.vercel.app/api/posts`;

async function fetchPosts() {
    if (loading) return;
    loading = true;

    const search = document.getElementById('search')?.value ?? '';
    const sort = getSortValue();
    const hasImg = document.getElementById('hasImage')?.checked ?? false;

    const params = new URLSearchParams({
        offset: String(offset),
        sort,
        search,
        has_image: hasImg ? '1' : '0',
    });
    activeIntents.forEach(i => params.append('intent', i));

    setPaginationButtonsDisabled(true);

    try {
        const res = await fetch(`${API_BASE}?${params.toString()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const responseData = await res.json();

        let posts = [];
        let totalCount = 0;

        if (responseData && typeof responseData === 'object' && !Array.isArray(responseData)) {
            posts = responseData.posts || [];
            totalCount = parseInt(responseData.total ?? 0, 10);
        } else {
            posts = Array.isArray(responseData) ? responseData : [];
            totalCount = offset + posts.length + (posts.length === PAGE_SIZE ? 1 : 0);
        }

        // 1. Render upper summary counter
        const countEl = document.getElementById('results-count');
        if (countEl) {
            countEl.textContent = `Found ${totalCount} post${totalCount === 1 ? '' : 's'}`;
        }

        // 2. Refresh main grid listing layout
        const list = document.getElementById('post-list');
        if (list) {
            list.innerHTML = '';
            if (posts.length === 0) {
                list.innerHTML = '<div class="no-results" style="padding:40px; text-align:center; color:var(--text-muted);">No posts found.</div>';
            } else {
                posts.forEach(post => list.appendChild(buildCard(post)));
            }
        }

        // 3. Compute structural navigation states
        const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;
        const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

        // Render dynamic numeric link breadcrumbs
        renderPaginationNumbers(currentPage, totalPages);

        // 4. Calibrate standard quick-arrows
        const prevBtn = document.getElementById('prev-btn');
        if (prevBtn) prevBtn.disabled = (offset === 0);

        const nextBtn = document.getElementById('next-btn');
        if (nextBtn) nextBtn.disabled = (currentPage >= totalPages || posts.length < PAGE_SIZE);

    } catch (err) {
        console.error('Failed to fetch posts:', err);
        const list = document.getElementById('post-list');
        if (list && list.children.length === 0) {
            list.innerHTML = '<div class="error-msg" style="padding:40px; text-align:center; color:red;">Failed to load posts. Please try again.</div>';
        }
    } finally {
        loading = false;
    }
}

// ─── Dynamic Breadcrumbs Generation Rule Logic ───────────────────────────────
function renderPaginationNumbers(currentPage, totalPages) {
    const container = document.getElementById('pagination-numbers');
    if (!container) return;
    container.innerHTML = '';

    const delta = 1; // Determines how many adjacent window elements are visible
    const range = [];
    const rangeWithDots = [];
    let l;

    // Collect legal visible numerical nodes
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
            range.push(i);
        }
    }

    // Insert ellipsis bounds intelligently
    for (let i of range) {
        if (l) {
            if (i - l === 2) {
                rangeWithDots.push(l + 1);
            } else if (i - l > 2) {
                rangeWithDots.push('...');
            }
        }
        rangeWithDots.push(i);
        l = i;
    }

    // Inject generated element matrix directly into DOM container targets
    rangeWithDots.forEach(p => {
        if (p === '...') {
            const span = document.createElement('span');
            span.className = 'pagination-ellipsis';
            span.textContent = '…';
            container.appendChild(span);
        } else {
            const btn = document.createElement('button');
            btn.className = 'page-num-btn' + (p === currentPage ? ' active' : '');
            btn.textContent = p;
            btn.setAttribute('aria-label', `Go to page ${p}`);
            if (p === currentPage) btn.setAttribute('aria-current', 'page');

            btn.addEventListener('click', () => {
                if (p !== currentPage && !loading) {
                    window.goToPage(p);
                }
            });
            container.appendChild(btn);
        }
    });
}

window.goToPage = (pageNum) => {
    if (loading) return;
    offset = (pageNum - 1) * PAGE_SIZE;
    fetchPosts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

function setPaginationButtonsDisabled(isDisabled) {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    if (prevBtn) prevBtn.disabled = isDisabled || (offset === 0);
    if (nextBtn) nextBtn.disabled = isDisabled;

    document.querySelectorAll('.page-num-btn').forEach(b => b.disabled = isDisabled);
}

window.changePage = (direction) => {
    if (loading) return;

    if (direction === 1) {
        offset += PAGE_SIZE;
    } else if (direction === -1) {
        offset = Math.max(0, offset - PAGE_SIZE);
    }

    fetchPosts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

function resetAndFetch() {
    offset = 0;
    loading = false;
    fetchPosts();
}

function debounce(func, delay = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
}

window.toggleIntent = (btn, val) => {
    btn.classList.toggle('active');
    activeIntents.has(val) ? activeIntents.delete(val) : activeIntents.add(val);
    const hasActive = activeIntents.size > 0 || document.getElementById('hasImage')?.checked;
    document.getElementById('filter-toggle')?.classList.toggle('has-active', !!hasActive);
    resetAndFetch();
};

window.toggleFilters = () => {
    filtersOpen = !filtersOpen;
    const panel = document.getElementById('filter-panel');
    const toggle = document.getElementById('filter-toggle');
    if (!panel || !toggle) return;
    panel.classList.toggle('open', filtersOpen);
    toggle.setAttribute('aria-expanded', String(filtersOpen));
    toggle.querySelector('.chevron').style.transform = filtersOpen ? 'rotate(180deg)' : '';
};

window.setSort = (btn, val) => {
    document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    resetAndFetch();
};

function getSortValue() {
    return document.querySelector('.sort-btn.active')?.dataset.sort ?? 'newest';
}

document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('post-list')) return;

    fetchPosts();

    document.getElementById('search')?.addEventListener('input', debounce(resetAndFetch, 400));

    document.getElementById('hasImage')?.addEventListener('change', () => {
        const hasActive = activeIntents.size > 0 || document.getElementById('hasImage')?.checked;
        document.getElementById('filter-toggle')?.classList.toggle('has-active', !!hasActive);
        resetAndFetch();
    });
});