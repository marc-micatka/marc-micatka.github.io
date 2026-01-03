// ===========================================
// CONFIGURATION
// ===========================================
const GOOGLE_SHEETS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT6eNcmziFeeUr186W7gMhlsOtCI-sJofslOPbh61gMVYOesPt9o0RVyVxWov9IAp2NrfnhiFRyd_z_/pub?gid=268068742&single=true&output=csv';

// ===========================================
// GLOBAL VARIABLES
// ===========================================

let allBooks = [];
let sortColumn = 'finishDate';
let sortDirection = 'desc';

// ===========================================
// INITIALIZE APP
// ===========================================
document.addEventListener('DOMContentLoaded', function () {
    // Check URL hash for tab
    const hash = window.location.hash.slice(1); // Remove the '#'
    const validTabs = ['statistics', 'all-data', 'reviews'];
    const initialTab = validTabs.includes(hash) ? hash : 'statistics';

    switchTab(initialTab, true); // Pass true to indicate initial load
    loadBooksData();
    console.log("Reading List page loaded.");
});

// Handle browser back/forward buttons
window.addEventListener('popstate', function (event) {
    if (event.state && event.state.tab) {
        switchTab(event.state.tab);
    }
});

// ===========================================
// EVENT LISTENERS
// ===========================================

function setupEventListeners() {
    const inputs = [
        'searchInput', 'ratingMin', 'ratingMax',
        'dateStart', 'dateEnd', 'audiobookFilter', 'reviewFilter'
    ];

    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', () => {
                // Prevent Min from exceeding Max
                if (id === 'ratingMin' || id === 'ratingMax') {
                    const min = parseFloat(document.getElementById('ratingMin').value);
                    const max = parseFloat(document.getElementById('ratingMax').value);
                    if (min > max) {
                        if (id === 'ratingMin') document.getElementById('ratingMin').value = max;
                        else document.getElementById('ratingMax').value = min;
                    }
                    document.getElementById('ratingDisplay').textContent = `${document.getElementById('ratingMin').value} - ${document.getElementById('ratingMax').value}`;
                }
                renderBooksTable();
            });
        }
    });

    // 3. Collapsible headers logic
    const collapsibles = document.querySelectorAll('.collapsible-header');
    collapsibles.forEach(header => {
        header.addEventListener('click', function () {
            this.classList.toggle('collapsed');
            const content = this.nextElementSibling;
            if (content && content.classList.contains('collapsible-content')) {
                content.classList.toggle('collapsed');
            }
        });
    });
}

function clearFilters() {
    const ids = ['searchInput', 'dateStart', 'dateEnd'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    
    document.getElementById('ratingMin').value = 0;
    document.getElementById('ratingMax').value = 10;
    document.getElementById('audiobookFilter').value = 'all';
    document.getElementById('reviewFilter').value = 'all';
    document.getElementById('ratingDisplay').textContent = "0 - 10";
    
    renderBooksTable();
}

// ===========================================
// TAB Switching & Navigation
// ===========================================

function switchTab(tabId, isInitialLoad = false) {
    // 1. Get all tab content elements and buttons
    const tabContents = document.querySelectorAll('.tab-content');
    const tabButtons = document.querySelectorAll('.tab-btn');

    // 2. Hide all tab content
    tabContents.forEach(content => {
        content.classList.remove('active');
    });

    // 3. Deactivate all tab buttons
    tabButtons.forEach(button => {
        button.classList.remove('active');
    });

    // 4. Show the selected tab content
    const activeContent = document.getElementById(tabId);
    if (activeContent) {
        activeContent.classList.add('active');
    }

    // 5. Activate the clicked button
    const activeButton = document.querySelector(`.tab-btn[onclick*="${tabId}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }

    // UPDATE URL (but not on initial load to prevent scrolling)
    if (!isInitialLoad) {
        window.history.pushState({ tab: tabId }, '', `#${tabId}`);
    } else {
        window.history.replaceState({ tab: tabId }, '', `#${tabId}`);
    }

    if (tabId === 'statistics') {
        renderStatistics();
    }
    
    // Scroll to top on initial load to prevent jumping
    if (isInitialLoad) {
        setTimeout(() => {
            window.scrollTo(0, 0);
        }, 0);
    }
}

// Helper function to link from table to review tab
function goToReview(slug) {
    switchTab('reviews');
    // Allow the DOM to update visibility before scrolling
    setTimeout(() => {
        const element = document.getElementById(slug);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Optional: Highlight the review briefly
            element.classList.add('highlight-review');
            setTimeout(() => element.classList.remove('highlight-review'), 2000);

            // Force back-to-top button to appear
            const btn = document.getElementById('backToTopBtn');
            if (btn) {
                btn.classList.add('visible');
            }
        }
    }, 50);
}

function createSlug(title) {
    if (!title) return 'unknown';
    return 'review-' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

// ===========================================
// DATA LOADING
// ===========================================
function loadBooksData() {
    const messageDiv = document.getElementById('message');
    messageDiv.innerHTML = '<div class="loading">Loading your books...</div>';

    Papa.parse(GOOGLE_SHEETS_CSV_URL, {
        download: true,
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: function (results) {
            if (results.errors.length > 0) {
                console.error('Parse errors:', results.errors);
                messageDiv.innerHTML = '<div class="error">Error parsing CSV. Check console for details.</div>';
                return;
            }

            allBooks = results.data.map(book => ({
                title: book.Title || book.title || '',
                author: book.Author || book.author || '',
                pages: parseInt(book.Page || book.pages || book.Pages) || 0,
                genre: book.Genre || book.genre || '',
                finishDate: book['Finish Date'] || book.finishDate || book['Finish date'] || '',
                rating: parseFloat(book['Rating'] || book.rating || book.Rating) || 0,
                audiobook: book['Audiobook?'] || book.audiobook || book.Audiobook || '',
                review: book['Review'] || book.Review || book.review || '',
                hasReview: (book['Review'] || book.Review || book.review || '').trim().length > 0
            }));

            messageDiv.innerHTML = '';
            setupEventListeners();

            // Render all views
            renderBooksTable();
            renderStatistics();
            renderReviews();
        },
        error: function (error) {
            console.error('Fetch error:', error);
            messageDiv.innerHTML = '<div class="error">Error loading CSV. Make sure the Google Sheets link is public and published as CSV.</div>';
        }
    });
}

// ===========================================
// TABLE RENDERING
// ===========================================
function renderBooksTable() {
    const container = document.getElementById('books-table');
    if (!container) return;

    if (allBooks.length === 0) {
        container.innerHTML = '<p>No books data available.</p>';
        return;
    }

    // 1. Get Filter Values
    const searchTerm = document.getElementById('searchInput') ? document.getElementById('searchInput').value.toLowerCase().trim() : '';
    const ratingMin = parseFloat(document.getElementById('ratingMin')?.value);
    const ratingMax = parseFloat(document.getElementById('ratingMax')?.value);
    const pagesMin = parseInt(document.getElementById('pagesMin')?.value);
    const pagesMax = parseInt(document.getElementById('pagesMax')?.value);
    const dateStartRaw = document.getElementById('dateStart')?.value;
    const dateEndRaw = document.getElementById('dateEnd')?.value;
    const dateStart = dateStartRaw ? new Date(dateStartRaw) : null;
    const dateEnd = dateEndRaw ? new Date(dateEndRaw) : null;

    // 2. Filter Logic
    let filteredBooks = allBooks.filter(book => {
        const searchTerm = document.getElementById('searchInput')?.value.toLowerCase().trim() || '';
        const ratingMin = parseFloat(document.getElementById('ratingMin')?.value);
        const ratingMax = parseFloat(document.getElementById('ratingMax')?.value);
        const dateStart = document.getElementById('dateStart')?.value ? new Date(document.getElementById('dateStart').value) : null;
        const dateEnd = document.getElementById('dateEnd')?.value ? new Date(document.getElementById('dateEnd').value) : null;
        const audiobookFilter = document.getElementById('audiobookFilter')?.value || 'all';
        const reviewFilter = document.getElementById('reviewFilter')?.value || 'all';

        // Text Search
        const titleSafe = String(book.title || '').toLowerCase();
        const authorSafe = String(book.author || '').toLowerCase();
        if (searchTerm && !titleSafe.includes(searchTerm) && !authorSafe.includes(searchTerm)) return false;

        // Rating Range
        if (book.rating < ratingMin || book.rating > ratingMax) return false;

        // Date Range
        const bookDate = parseDate(book.finishDate);
        if (dateStart && (!bookDate || bookDate < dateStart)) return false;
        if (dateEnd && (!bookDate || bookDate > dateEnd)) return false;

        // Audiobook Toggle
        const isAudio = String(book.audiobook || '').toLowerCase() === 'yes';
        if (audiobookFilter === 'yes' && !isAudio) return false;
        if (audiobookFilter === 'no' && isAudio) return false;

        // Review Toggle
        if (reviewFilter === 'yes' && !book.hasReview) return false;
        if (reviewFilter === 'no' && book.hasReview) return false;

        return true;
    });

    // 3. Sort Logic
    if (sortColumn) {
        filteredBooks.sort((a, b) => {
            let aVal = a[sortColumn];
            let bVal = b[sortColumn];

            if (sortColumn === 'finishDate') {
                const dateA = parseDate(aVal);
                const dateB = parseDate(bVal);

                // Put invalid dates at the bottom regardless of sort direction
                if (!dateA && !dateB) return 0;
                if (!dateA) return 1;  // Always put invalid dates at bottom
                if (!dateB) return -1; // Always put invalid dates at bottom

                return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
            }

            if (sortColumn === 'hasReview') {
                // Sort by presence of review (true/false)
                return sortDirection === 'asc' ? (aVal === bVal ? 0 : aVal ? 1 : -1) : (aVal === bVal ? 0 : aVal ? -1 : 1);
            }

            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
            }

            aVal = String(aVal || '').toLowerCase();
            bVal = String(bVal || '').toLowerCase();

            if (sortDirection === 'asc') {
                return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            } else {
                return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
            }
        });
    }

    // 4. Build Table
    let tableHTML = `
        <div class="table-container">
            <table class="books-table">
                <thead>
                    <tr>
                        <th class="sortable ${sortColumn === 'title' ? 'sort-' + sortDirection : ''}" onclick="sortTable('title')">Title</th>
                        <th class="sortable ${sortColumn === 'author' ? 'sort-' + sortDirection : ''}" onclick="sortTable('author')">Author</th>
                        <th class="sortable ${sortColumn === 'pages' ? 'sort-' + sortDirection : ''}" onclick="sortTable('pages')">Pages</th>
                        <th class="sortable ${sortColumn === 'genre' ? 'sort-' + sortDirection : ''}" onclick="sortTable('genre')">Genre</th>
                        <th class="sortable ${sortColumn === 'finishDate' ? 'sort-' + sortDirection : ''}" onclick="sortTable('finishDate')">Finish Date</th>
                        <th class="sortable ${sortColumn === 'rating' ? 'sort-' + sortDirection : ''}" onclick="sortTable('rating')">Rating</th>
                        <th class="sortable ${sortColumn === 'audiobook' ? 'sort-' + sortDirection : ''}" onclick="sortTable('audiobook')">Audiobook?</th>
                        <th class="sortable ${sortColumn === 'hasReview' ? 'sort-' + sortDirection : ''}" onclick="sortTable('hasReview')">Review</th>
                    </tr>
                </thead>
                <tbody>
    `;

    if (filteredBooks.length === 0) {
        tableHTML += `<tr><td colspan="8" style="text-align:center; padding: 20px;">No books match your filters.</td></tr>`;
    } else {
        filteredBooks.forEach((book) => {
            const formatCell = (book.audiobook && book.audiobook.toString().toLowerCase() === 'yes')
                ? '<span class="checkmark">✓</span>'
                : '';

            const hasReview = book.review && String(book.review).trim().length > 0;

            // Logic for Review Column and Row Hover
            let reviewCell = '';
            let rowTitle = '';

            if (hasReview) {
                const slug = createSlug(book.title);
                // The checkmark links to the review tab
                reviewCell = `<span class="review-link" onclick="goToReview('${slug}')">📄</span>`;

                // Strip HTML and truncate for hover text
                const reviewText = stripHtmlAndTruncate(book.review, 200);
                rowTitle = `title="${escapeAttribute(reviewText)}"`;
            } else {
                reviewCell = '<span style="color: #ccc;">-</span>';
            }

            tableHTML += `
                <tr ${rowTitle}>
                    <td>${escapeHtml(book.title)}</td>
                    <td>${escapeHtml(book.author)}</td>
                    <td>${book.pages || '-'}</td>
                    <td>${escapeHtml(book.genre)}</td>
                    <td>${escapeHtml(book.finishDate)}</td>
                    <td>${book.rating || '-'}</td>
                    <td>${formatCell}</td>
                    <td style="text-align: center; cursor: pointer;">${reviewCell}</td>
                </tr>
            `;
        });
    }

    tableHTML += `
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML = tableHTML;
}

// ===========================================
// REVIEWS RENDERING
// ===========================================
function renderReviews() {
    const container = document.getElementById('reviews');
    if (!container) return;

    // Filter for books with reviews
    let booksWithReviews = allBooks.filter(book => book.review && String(book.review).trim().length > 0);

    if (booksWithReviews.length === 0) {
        container.innerHTML = '<div class="no-reviews">No reviews available yet.</div>';
        return;
    }

    // Sort by Date Descending
    booksWithReviews.sort((a, b) => {
        const dateA = parseDate(a.finishDate);
        const dateB = parseDate(b.finishDate);
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateB - dateA; // Descending
    });

    let html = '<div class="reviews-container">';

    booksWithReviews.forEach((book, index) => {
        const slug = createSlug(book.title);
        const dateDisplay = book.finishDate ? `Finished: ${book.finishDate}` : 'Date Unknown';

        html += `
            <div id="${slug}" class="review-card">
                <h2 class="review-header">
                    ${escapeHtml(book.title)} - ${escapeHtml(book.author)} 
                    <span class="review-rating">${book.rating}/10 ⭐ </span>
                </h2>
                <div class="review-meta">${dateDisplay}</div>
                <div class="review-body">${book.review}</div>
                ${index < booksWithReviews.length - 1 ? '<div class="review-divider"></div>' : ''}
            </div>
        `;
    });

    html += '</div>';
    html += '<button class="back-to-top" id="backToTopBtn" onclick="scrollToTop()">BACK TO TOP ↑</button>';

    container.innerHTML = html;

    // Setup scroll listener for back-to-top button
    setupBackToTopButton();
}

// ===========================================
// UTILS
// ===========================================

function sortTable(column) {
    if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn = column;
        sortDirection = 'asc';
    }
    renderBooksTable();
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// For use in HTML attributes like title="..."
function escapeAttribute(text) {
    if (!text) return '';
    return text.replace(/"/g, '&quot;').replace(/\n/g, ' ');
}

function stripHtmlAndTruncate(html, maxLength) {
    if (!html) return '';

    // Create a temporary div to parse HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;

    // Get text content (strips all HTML tags)
    let text = temp.textContent || temp.innerText || '';

    // Remove excessive whitespace
    text = text.replace(/\s+/g, ' ').trim();

    // Truncate if needed
    if (text.length > maxLength) {
        text = text.substring(0, maxLength) + '...';
    }

    return text;
}

function parseDate(dateStr) {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
        return date;
    }
    return null;
}

// ===========================================
// STATISTICS RENDERING
// ===========================================

let statsSortColumn = 'year';
let statsSortDirection = 'desc';
let activityChartInstance = null;
let genreChartInstance = null;
let formatChartInstance = null;
let currentYearChartInstance = null;

function renderStatistics() {
    const container = document.getElementById('statistics-table');

    if (allBooks.length === 0) {
        container.innerHTML = '<p>No books data available.</p>';
        return;
    }

    // Render year specific stats first
    renderYearStats();

    // Group books by year
    const booksByYear = _.groupBy(allBooks, book => {
        const date = parseDate(book.finishDate);
        return date ? date.getFullYear() : 'Unknown';
    });

    let yearStats = [];
    Object.keys(booksByYear).forEach(year => {
        if (year === 'Unknown') return;
        const yearNum = parseInt(year);
        if (yearNum < 2015) return;

        const books = booksByYear[year];
        const totalPages = _.sumBy(books, 'pages');
        const booksFinished = books.length;

        const fictionCount = books.filter(b => {
            const genre = String(b.genre || '').toLowerCase();
            return genre.includes('fiction') && !genre.includes('non-fiction');
        }).length;

        const nonFictionCount = books.filter(b => {
            const genre = String(b.genre || '').toLowerCase();
            return genre.includes('non-fiction') || genre.includes('nonfiction');
        }).length;

        const audiobookCount = books.filter(b => {
            const ab = String(b.audiobook || '').toLowerCase();
            return ab === 'yes' || ab === 'true';
        }).length;
        const regularBookCount = booksFinished - audiobookCount;

        const daysInYear = (yearNum % 4 === 0 && (yearNum % 100 !== 0 || yearNum % 400 === 0)) ? 366 : 365;
        const avgPerDay = totalPages / daysInYear;
        const avgBookLength = totalPages / booksFinished;

        yearStats.push({
            year: yearNum,
            totalPages,
            avgPerDay,
            booksFinished,
            fictionCount,
            nonFictionCount,
            audiobookCount,
            regularBookCount,
            avgBookLength,
            booksDisplay: `${booksFinished}<br><span style="font-size: 0.85em;">(${fictionCount}/${nonFictionCount})</span>`,
            pagesDisplay: `${totalPages.toLocaleString()}<br><span style="font-size: 0.85em;">(${avgPerDay.toFixed(1)}/day)</span>`
        });
    });

    const sortedStats = [...yearStats].sort((a, b) => {
        let aVal = a[statsSortColumn];
        let bVal = b[statsSortColumn];
        if (typeof aVal === 'number' && typeof bVal === 'number') {
            return statsSortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }
        aVal = String(aVal || '').toLowerCase();
        bVal = String(bVal || '').toLowerCase();
        return statsSortDirection === 'asc' ? (aVal < bVal ? -1 : aVal > bVal ? 1 : 0) : (aVal > bVal ? -1 : aVal < bVal ? 1 : 0);
    });

    let tableHTML = `
        <div class="table-container">
            <table class="books-table stats-table">
                <thead>
                    <tr>
                        <th class="sortable ${statsSortColumn === 'year' ? 'sort-' + statsSortDirection : ''}" onclick="sortStatsTable('year')">Year</th>
                        <th class="sortable ${statsSortColumn === 'totalPages' ? 'sort-' + statsSortDirection : ''}" onclick="sortStatsTable('totalPages')">Total Pages<br><span style="font-size: 0.85em; font-weight: normal;">(Average/Day)</span></th>
                        <th class="sortable ${statsSortColumn === 'booksFinished' ? 'sort-' + statsSortDirection : ''}" onclick="sortStatsTable('booksFinished')">Books Finished<br><span style="font-size: 0.85em; font-weight: normal;">(Fiction/Non-Fiction)</span></th>
                        <th class="sortable ${statsSortColumn === 'avgBookLength' ? 'sort-' + statsSortDirection : ''}" onclick="sortStatsTable('avgBookLength')">Average Book Length</th>
                    </tr>
                </thead>
                <tbody>
    `;

    sortedStats.forEach(stat => {
        tableHTML += `
            <tr>
                <td>${stat.year}</td>
                <td>${stat.pagesDisplay}</td>
                <td>${stat.booksDisplay}</td>
                <td>${Math.round(stat.avgBookLength).toLocaleString()}</td>
            </tr>
        `;
    });

    tableHTML += `</tbody></table></div>`;
    container.innerHTML = tableHTML;

    renderCharts(yearStats);
}

function renderCharts(data) {
    // Sort by year ascending for charts so time flows left-to-right
    const chartData = [...data].sort((a, b) => a.year - b.year);
    const labels = chartData.map(d => d.year);

    // --- Chart 1: Activity (Pages/Day vs Books Finished) ---
    const ctxActivity = document.getElementById('activityChart')?.getContext('2d');
    if (ctxActivity) {
        if (activityChartInstance) activityChartInstance.destroy();

        activityChartInstance = new Chart(ctxActivity, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Books Finished',
                        data: chartData.map(d => d.booksFinished),
                        backgroundColor: 'rgba(0, 0, 131, 0.5)',
                        borderColor: '#000083',
                        borderWidth: 1,
                        yAxisID: 'y1',
                        order: 2
                    },
                    {
                        label: 'Avg Pages / Day',
                        data: chartData.map(d => d.avgPerDay),
                        type: 'line',
                        borderColor: '#800000',
                        backgroundColor: 'rgba(128, 0, 0, 0.2)',
                        borderWidth: 3,
                        tension: 0.3,
                        yAxisID: 'y',
                        order: 1
                    }
                ]
            },
            options: {
                responsive: true,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    title: { display: true, text: 'Reading Habits Over Time' }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: { display: true, text: 'Avg Pages / Day' }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: { drawOnChartArea: false },
                        title: { display: true, text: 'Books Finished' }
                    }
                }
            }
        });
    }

    // --- Chart 2: Fiction vs Non-Fiction (Stacked) ---
    const ctxGenre = document.getElementById('genreChart')?.getContext('2d');
    if (ctxGenre) {
        if (genreChartInstance) genreChartInstance.destroy();

        genreChartInstance = new Chart(ctxGenre, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Fiction',
                        data: chartData.map(d => d.fictionCount),
                        backgroundColor: 'rgba(0, 0, 131, 0.6)',
                        borderColor: '#000083',
                        borderWidth: 1
                    },
                    {
                        label: 'Non-Fiction',
                        data: chartData.map(d => d.nonFictionCount),
                        backgroundColor: 'rgba(128, 0, 0, 0.6)',
                        borderColor: '#800000',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: { display: true, text: 'Books by Genre' },
                },
                scales: {
                    x: { stacked: true },
                    y: { stacked: true, beginAtZero: true }
                }
            }
        });
    }

    // --- Chart 3: Audio vs Regular (Stacked) ---
    const ctxFormat = document.getElementById('formatChart')?.getContext('2d');
    if (ctxFormat) {
        if (formatChartInstance) formatChartInstance.destroy();

        formatChartInstance = new Chart(ctxFormat, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Books',
                        data: chartData.map(d => d.regularBookCount),
                        backgroundColor: 'rgba(0, 0, 131, 0.6)',
                        borderColor: '#000083',
                        borderWidth: 1
                    },
                    {
                        label: 'Audiobooks',
                        data: chartData.map(d => d.audiobookCount),
                        backgroundColor: 'rgba(128, 0, 0, 0.6)',
                        borderColor: '#800000',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: { display: true, text: 'Books by Format' },
                },
                scales: {
                    x: { stacked: true },
                    y: { stacked: true, beginAtZero: true }
                }
            }
        });
    }
}

function sortStatsTable(column) {
    if (statsSortColumn === column) {
        statsSortDirection = statsSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        statsSortColumn = column;
        statsSortDirection = 'asc';
    }
    renderStatistics();
}

// ===========================================
// Current YEAR STATISTICS RENDERING
// ===========================================
function renderYearStats(selectedYear = null) {
    const container = document.getElementById('stats-current-year');
    if (!container) return;

    // Use selectedYear if provided, otherwise current year
    const displayYear = selectedYear || new Date().getFullYear();
    
    // Get all available years for dropdown
    const availableYears = [...new Set(allBooks
        .map(book => {
            const date = parseDate(book.finishDate);
            return date ? date.getFullYear() : null;
        })
        .filter(year => year && year >= 2015)
    )].sort((a, b) => b - a); // Sort descending

    // Add current year to availableYears if not present
    const currentYear = new Date().getFullYear();
    if (!availableYears.includes(currentYear)) {
        availableYears.unshift(currentYear);
    }

    // Filter books from selected year
    const booksCurrentYear = allBooks.filter(book => {
        const date = parseDate(book.finishDate);
        return date && date.getFullYear() === displayYear;
    });

    if (booksCurrentYear.length === 0) {
        container.innerHTML = `
            <div class="year-selector-container">
                <label for="yearSelector">Select Year:</label>
                <select id="yearSelector" onchange="renderYearStats(parseInt(this.value))">
                    ${availableYears.map(year => 
                        `<option value="${year}" ${year === displayYear ? 'selected' : ''}>${year}</option>`
                    ).join('')}
                </select>
            </div>
            <p style="text-align: center; color: #666;">No books finished in ${displayYear} yet.</p>
        `;
        return;
    }

    // Calculate fiction/non-fiction counts and audiobook splits
    const fictionBooks = booksCurrentYear.filter(b => {
        const genre = String(b.genre || '').toLowerCase();
        return genre.includes('fiction') && !genre.includes('non-fiction');
    });

    const nonFictionBooks = booksCurrentYear.filter(b => {
        const genre = String(b.genre || '').toLowerCase();
        return genre.includes('non-fiction') || genre.includes('nonfiction');
    });

    // Count audiobooks within each category
    const fictionAudio = fictionBooks.filter(b => {
        const ab = String(b.audiobook || '').toLowerCase();
        return ab === 'yes' || ab === 'true';
    }).length;

    const fictionRegular = fictionBooks.length - fictionAudio;

    const nonFictionAudio = nonFictionBooks.filter(b => {
        const ab = String(b.audiobook || '').toLowerCase();
        return ab === 'yes' || ab === 'true';
    }).length;

    const nonFictionRegular = nonFictionBooks.length - nonFictionAudio;

    // Get top 5 and bottom 5 rated books
    const ratedBooks = booksCurrentYear.filter(b => b.rating > 0);
    const sortedByRating = [...ratedBooks].sort((a, b) => b.rating - a.rating);
    const topRated = sortedByRating.slice(0, 5);
    const bottomRated = sortedByRating.slice(-5).reverse();

    let html = `
        <!-- Year Selector -->
        <div class="year-selector-container">
            <label for="yearSelector">Select Year:</label>
            <select id="yearSelector" onchange="renderYearStats(parseInt(this.value))">
                ${availableYears.map(year => 
                    `<option value="${year}" ${year === displayYear ? 'selected' : ''}>${year}</option>`
                ).join('')}
            </select>
        </div>

        <!-- Fiction/Non-Fiction Chart (Full Width) -->
        <div style="background: #fff; border: 1px solid #eee; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); margin-bottom: 30px;">
            <h4 style="margin-top: 0; text-align: center; color: #333;">${displayYear} Reading by Genre</h4>
            <div style="max-width: 600px; margin: 0 auto;">
                <canvas id="currentYearChart" style="max-height: 200px;"></canvas>
            </div>
            <div style="text-align: center; margin-top: 15px; color: #666;">
                <strong>${booksCurrentYear.length}</strong> books finished
            </div>
        </div>

        <!-- Top and Bottom Rated Books Side by Side -->
        <div style="display: flex; flex-wrap: wrap; gap: 30px; margin-bottom: 30px;">
            <!-- Top Rated Books -->
            <div style="flex: 1; min-width: 300px; background: #fff; border: 1px solid #eee; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                <h4 style="margin-top: 0; text-align: center; color: #333;">Top Rated Books (${displayYear})</h4>
                ${topRated.length > 0 ? generateBookList(topRated) : '<p style="text-align: center; color: #666;">No rated books yet.</p>'}
            </div>

            <!-- Bottom Rated Books -->
            ${bottomRated.length > 0 && bottomRated.length >= 5 ? `
            <div style="flex: 1; min-width: 300px; background: #fff; border: 1px solid #eee; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                <h4 style="margin-top: 0; text-align: center; color: #333;">Lowest Rated Books (${displayYear})</h4>
                ${generateBookList(bottomRated)}
            </div>
            ` : ''}
        </div>
    `;

    container.innerHTML = html;

    // Render the horizontal stacked bar chart
    const ctx = document.getElementById('currentYearChart')?.getContext('2d');
    if (ctx) {
        if (currentYearChartInstance) currentYearChartInstance.destroy();

        currentYearChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Fiction', 'Non-Fiction'],
                datasets: [
                    {
                        label: 'Books',
                        data: [fictionRegular, nonFictionRegular],
                        backgroundColor: 'rgba(0, 0, 131, 0.6)',
                        borderColor: '#000083',
                        borderWidth: 1
                    },
                    {
                        label: 'Audiobooks',
                        data: [fictionAudio, nonFictionAudio],
                        backgroundColor: 'rgba(128, 0, 0, 0.6)',
                        borderColor: '#800000',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom'
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    },
                    y: {
                        stacked: true
                    }
                }
            }
        });
    }
}
function generateBookList(books) {
    let html = '<ul style="margin: 0; padding-left: 20px; line-height: 1.6; list-style: none;">';
    books.forEach(book => {
        const ratingColor = book.rating >= 8 ? '#28a745' : book.rating >= 6 ? '#ffc107' : '#dc3545';
        html += `
            <li style="margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <div><strong>${escapeHtml(book.title)}</strong></div>
                        <div style="font-size: 0.75em; font-style: italic; color: #666;">${escapeHtml(book.author)}</div>
                    </div>
                    <span style="color: ${ratingColor}; font-weight: bold; margin-left: 12px; white-space: nowrap;">${book.rating}/10</span>
                </div>
            </li>
        `;
    });
    html += '</ul>';
    return html;
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setupBackToTopButton() {
    const btn = document.getElementById('backToTopBtn');
    if (!btn) return;

    const toggleButton = () => {
        if (window.scrollY > 100) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    };

    window.addEventListener('scroll', toggleButton);
    toggleButton();
}