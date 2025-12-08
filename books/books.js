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
    searchInput.addEventListener('input', renderBooksTable);
    renderBooksTable();
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
    const container = document.getElementById('statistics');
    
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
    const yearStats = [];
    
    Object.keys(booksByYear).forEach(year => {
        if (year === 'Unknown') return;
        
        const yearNum = parseInt(year);
        
        // Only include data from 2015 onwards
        if (yearNum < 2015) return;
        
        const books = booksByYear[year];
        const totalPages = _.sumBy(books, 'pages');
        const booksFinished = books.length;
        
        // Count fiction vs non-fiction (assuming genre field indicates this)
        const fictionCount = books.filter(b => {
            const genre = String(b.genre || '').toLowerCase();
            return genre.includes('fiction') && !genre.includes('non-fiction');
        }).length;
        
        const nonFictionCount = books.filter(b => {
            const genre = String(b.genre || '').toLowerCase();
            return genre.includes('non-fiction') || genre.includes('nonfiction');
        }).length;
        
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
            avgBookLength,
            booksDisplay: `${booksFinished}<br><span style="font-size: 0.85em;">(${fictionCount}/${nonFictionCount})</span>`,
            pagesDisplay: `${totalPages.toLocaleString()}<br><span style="font-size: 0.85em;">(${avgPerDay.toFixed(1)}/day)</span>`
        });
    });
    
    // Sort the stats
    yearStats.sort((a, b) => {
        let aVal = a[statsSortColumn];
        let bVal = b[statsSortColumn];
        
        // Handle different data types
        if (typeof aVal === 'number' && typeof bVal === 'number') {
            return statsSortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        // String comparison
        aVal = String(aVal || '').toLowerCase();
        bVal = String(bVal || '').toLowerCase();
        
        if (statsSortDirection === 'asc') {
            return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        } else {
            return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
        }
    });
    
    // Build table HTML
    let tableHTML = `
        <h2>Reading Statistics by Year</h2>
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
    
    yearStats.forEach(stat => {
        tableHTML += `
            <tr>
                <td>${stat.year}</td>
                <td>${stat.pagesDisplay}</td>
                <td>${stat.booksDisplay}</td>
                <td>${Math.round(stat.avgBookLength).toLocaleString()}</td>
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

function sortStatsTable(column) {
    if (statsSortColumn === column) {
        // Toggle direction if same column
        statsSortDirection = statsSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        // New column, default to ascending
        statsSortColumn = column;
        statsSortDirection = 'asc';
    }
    renderStatistics();
}