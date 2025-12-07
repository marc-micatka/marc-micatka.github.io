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
    setupModalListeners();
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
// MODAL SETUP
// ===========================================
function setupModalListeners() {
    // Close modal when clicking on X or outside the modal
    window.onclick = function(event) {
        const modal = document.getElementById('reviewModal');
        if (event.target === modal) {
            closeModal();
        }
    }
}

function showReview(reviewText, bookTitle) {
    const modal = document.getElementById('reviewModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    modalTitle.textContent = bookTitle;
    modalBody.textContent = reviewText;
    modal.style.display = 'block';
}

function closeModal() {
    const modal = document.getElementById('reviewModal');
    modal.style.display = 'none';
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
                        <th>Review</th>
                    </tr>
                </thead>
                <tbody>
    `;

    
    
    filteredBooks.forEach((book, index) => {
        // Format column: show green checkmark if audiobook is "Yes"
        const formatCell = (book.audiobook && book.audiobook.toString().toLowerCase() === 'yes') 
            ? '<span class="checkmark">✓</span>' 
            : '';
        
        // Review column: show button if review exists
        const reviewCell = (book.review && book.review.toString().trim() !== '') 
            ? `<button class="review-btn" onclick="showReview(\`${escapeHtml(book.review).replace(/`/g, '\\`')}\`, \`${escapeHtml(book.title).replace(/`/g, '\\`')}\`)">View</button>` 
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
                <td>${reviewCell}</td>
            </tr>
        `;
    });
    
    tableHTML += `
                </tbody>
            </table>
        </div>
        
        <!-- Modal for displaying reviews -->
        <div id="reviewModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 id="modalTitle">Review</h2>
                    <span class="close" onclick="closeModal()">&times;</span>
                </div>
                <div class="modal-body" id="modalBody"></div>
            </div>
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