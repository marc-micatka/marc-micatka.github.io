// ===========================================
// CONFIGURATION
// ===========================================

const GOOGLE_SHEETS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQHLDF-rhQE2RIGdme9IO4lKEnIPxS2gX1pgeCNFPjjmabkWILZqZMthukx_1cjNDd9citMi-Q0A-SK/pub?gid=1749726170&single=true&output=csv';

// ===========================================
// GLOBAL VARIABLES
// ===========================================
    
let allBooks = [];
let sortColumn = 'finishDate';
let sortDirection = 'desc';

// ===========================================
// INITIALIZE APP
// ===========================================
document.addEventListener('DOMContentLoaded', function() {
    loadBooksData();
    console.log("Reading List page loaded.");
});


// ===========================================
// EVENT LISTENERS (UPDATED)
// ===========================================

function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    
    // Listen for input changes (typing)
    if (searchInput) {
        searchInput.addEventListener('input', renderBooksTable);
    }
    
    // [ADD THIS] Collapsible headers logic
    const collapsibles = document.querySelectorAll('.collapsible-header');
    collapsibles.forEach(header => {
        header.addEventListener('click', function() {
            // Toggle the 'collapsed' class on the header (for the arrow rotation)
            this.classList.toggle('collapsed');
            
            // Find the next sibling (the content div) and toggle its visibility
            const content = this.nextElementSibling;
            if (content && content.classList.contains('collapsible-content')) {
                content.classList.toggle('collapsed');
            }
        });
    });
}

// ===========================================
// TAB Switching
// ===========================================
/**
 * Handles switching between tabs in the reading list view.
 *
 * @param {string} tabId The ID of the tab content to show (e.g., 'overview', 'statistics').
 */
function switchTab(tabId) {
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
    
    // Render statistics when switching to that tab
    if (tabId === 'statistics') {
        renderStatistics();
    }
    
    console.log(`Switched to tab: ${tabId}`);
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
        complete: function(results) {
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
                review: book['Review'] || book.Review || book.review || ''
            }));
            
            messageDiv.innerHTML = '';
            setupEventListeners();
            renderBooksTable();
        },
        error: function(error) {
            console.error('Fetch error:', error);
            messageDiv.innerHTML = '<div class="error">Error loading CSV. Make sure the Google Sheets link is public and published as CSV.</div>';
        }
    });
}

// ===========================================
// TABLE RENDERING
// ===========================================
function renderBooksTable() {
    // Check for search input
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    const searchTerm = searchInput.value.toLowerCase().trim();


    const container = document.getElementById('books-table');
    
    if (allBooks.length === 0) {
        container.innerHTML = '<p>No books data available.</p>';
        return;
    }
    
    let filteredBooks = allBooks.filter(book => {
        const titleSafe = String(book.title || '').toLowerCase();
        const authorSafe = String(book.author || '').toLowerCase();

        const matchesSearch = !searchTerm || 
            titleSafe.includes(searchTerm) || 
            authorSafe.includes(searchTerm);
        
        return matchesSearch;
    });
    
    // Sort books if a column is selected
    if (sortColumn) {
        filteredBooks.sort((a, b) => {
            let aVal = a[sortColumn];
            let bVal = b[sortColumn];
            
            // Handle dates specially
            if (sortColumn === 'finishDate') {
                const dateA = parseDate(aVal);
                const dateB = parseDate(bVal);
                
                if (!dateA && !dateB) return 0;
                if (!dateA) return sortDirection === 'asc' ? 1 : -1;
                if (!dateB) return sortDirection === 'asc' ? -1 : 1;
                
                return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
            }
            
            // Handle different data types
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
            }
            
            // String comparison
            aVal = String(aVal || '').toLowerCase();
            bVal = String(bVal || '').toLowerCase();
            
            if (sortDirection === 'asc') {
                return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            } else {
                return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
            }
        });
    }
    
    // Build table HTML
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
                    </tr>
                </thead>
                <tbody>
    `;

    
    
    filteredBooks.forEach((book, index) => {
        // Format column: show green checkmark if audiobook is "Yes"
        const formatCell = (book.audiobook && book.audiobook.toString().toLowerCase() === 'yes') 
            ? '<span class="checkmark">✓</span>' 
            : '';
        
        
        tableHTML += `
            <tr>
                <td>${escapeHtml(book.title)}</td>
                <td>${escapeHtml(book.author)}</td>
                <td>${book.pages || '-'}</td>
                <td>${escapeHtml(book.genre)}</td>
                <td>${escapeHtml(book.finishDate)}</td>
                <td>${book.rating || '-'}</td>
                <td>${formatCell}</td>
            </tr>
        `;
    });
    
    tableHTML += `
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = tableHTML;
}

function sortTable(column) {
    if (sortColumn === column) {
        // Toggle direction if same column
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        // New column, default to ascending
        sortColumn = column;
        sortDirection = 'asc';
    }
    renderBooksTable();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Parse date strings in various formats
function parseDate(dateStr) {
    if (!dateStr) return null;
    
    // Try to parse common formats: MM/DD/YYYY, M/D/YYYY, YYYY-MM-DD, etc.
    const date = new Date(dateStr);
    
    // Check if valid date
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

function renderStatistics() {
    const container = document.getElementById('statistics-table');
    
    if (allBooks.length === 0) {
        container.innerHTML = '<p>No books data available.</p>';
        return;
    }
    
    // Group books by year
    const booksByYear = _.groupBy(allBooks, book => {
        const date = parseDate(book.finishDate);
        return date ? date.getFullYear() : 'Unknown';
    });
    
    // Calculate statistics for each year
    let yearStats = [];
    
    Object.keys(booksByYear).forEach(year => {
        if (year === 'Unknown') return;
        
        const yearNum = parseInt(year);
        
        // Only include data from 2015 onwards
        if (yearNum < 2015) return;
        
        const books = booksByYear[year];
        const totalPages = _.sumBy(books, 'pages');
        const booksFinished = books.length;
        
        // Count fiction vs non-fiction
        const fictionCount = books.filter(b => {
            const genre = String(b.genre || '').toLowerCase();
            return genre.includes('fiction') && !genre.includes('non-fiction');
        }).length;
        
        const nonFictionCount = books.filter(b => {
            const genre = String(b.genre || '').toLowerCase();
            return genre.includes('non-fiction') || genre.includes('nonfiction');
        }).length;

        // Count Audiobooks
        const audiobookCount = books.filter(b => {
            const ab = String(b.audiobook || '').toLowerCase();
            return ab === 'yes' || ab === 'true';
        }).length;
        const regularBookCount = booksFinished - audiobookCount;
        
        // Calculate days in year (accounting for leap years)
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
    
    // 1. Render the Table (Same as before, just sorting logic applied)
    const sortedStats = [...yearStats].sort((a, b) => {
        let aVal = a[statsSortColumn];
        let bVal = b[statsSortColumn];
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
            return statsSortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }
        aVal = String(aVal || '').toLowerCase();
        bVal = String(bVal || '').toLowerCase();
        
        if (statsSortDirection === 'asc') {
            return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        } else {
            return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
        }
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

    // 2. Render the Charts
    renderCharts(yearStats);
}

function renderCharts(data) {
    // Sort by year ascending for charts so time flows left-to-right
    const chartData = [...data].sort((a, b) => a.year - b.year);
    const labels = chartData.map(d => d.year);

    // --- Chart 1: Activity (Pages/Day vs Books Finished) ---
    const ctxActivity = document.getElementById('activityChart').getContext('2d');
    
    if (activityChartInstance) activityChartInstance.destroy();

    activityChartInstance = new Chart(ctxActivity, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Books Finished',
                    data: chartData.map(d => d.booksFinished),
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                    yAxisID: 'y1',
                    order: 2
                },
                {
                    label: 'Avg Pages / Day',
                    data: chartData.map(d => d.avgPerDay),
                    type: 'line',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
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

    // --- Chart 2: Fiction vs Non-Fiction (Stacked) ---
    const ctxGenre = document.getElementById('genreChart').getContext('2d');
    if (genreChartInstance) genreChartInstance.destroy();

    genreChartInstance = new Chart(ctxGenre, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Fiction',
                    data: chartData.map(d => d.fictionCount),
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                },
                {
                    label: 'Non-Fiction',
                    data: chartData.map(d => d.nonFictionCount),
                    backgroundColor: 'rgba(255, 206, 86, 0.6)',
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: 'Fiction vs. Non-Fiction' },
            },
            scales: {
                x: { stacked: true },
                y: { stacked: true, beginAtZero: true }
            }
        }
    });

    // --- Chart 3: Audio vs Regular (Stacked) ---
    const ctxFormat = document.getElementById('formatChart').getContext('2d');
    if (formatChartInstance) formatChartInstance.destroy();

    formatChartInstance = new Chart(ctxFormat, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Audiobook',
                    data: chartData.map(d => d.audiobookCount),
                    backgroundColor: 'rgba(153, 102, 255, 0.6)',
                },
                {
                    label: 'Regular (Print/E-book)',
                    data: chartData.map(d => d.regularBookCount),
                    backgroundColor: 'rgba(255, 159, 64, 0.6)',
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: 'Audiobook vs. Regular' },
            },
            scales: {
                x: { stacked: true },
                y: { stacked: true, beginAtZero: true }
            }
        }
    });
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