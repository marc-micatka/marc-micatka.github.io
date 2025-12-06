// ===========================================
// CONFIGURATION - UPDATE THIS URL
// ===========================================

const GOOGLE_SHEETS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQHLDF-rhQE2RIGdme9IO4lKEnIPxS2gX1pgeCNFPjjmabkWILZqZMthukx_1cjNDd9citMi-Q0A-SK/pub?gid=1749726170&single=true&output=csv';

    // ===========================================
    // GLOBAL VARIABLES
    // ===========================================
    
    let allBooks = [];
    
    // ===========================================
    // TAB NAVIGATION
    // ===========================================
    
    function switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Remove active class from all buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab
        document.getElementById(tabName + '-tab').classList.add('active');
        
        // Add active class to clicked button
        event.target.classList.add('active');
        
        // Update stats/charts if switching to stats tab
        if (tabName === 'stats' && allBooks.length > 0) {
            updateStatistics();
            renderYearChart();
        }
    }
    
    // ===========================================
    // INITIALIZE APP
    // ===========================================
    
    document.addEventListener('DOMContentLoaded', function() {
        loadBooksData();
        // setupEventListeners is called AFTER data load and filter population
    });
    
    // ===========================================
    // DATA LOADING
    // ===========================================
    
    function loadBooksData() {
        const messageDiv = document.getElementById('message');
        messageDiv.innerHTML = '<div class="loading">Loading your books...</div>';
        
        if (GOOGLE_SHEETS_CSV_URL === 'YOUR_GOOGLE_SHEETS_CSV_URL') {
            messageDiv.innerHTML = '<div class="error">Please configure your Google Sheets CSV URL in the code!</div>';
            return;
        }
        
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
                    rating: parseFloat(book['Rating (0-10)'] || book.rating || book.Rating) || 0,
                    notes: book['Notes/Comments'] || book.notes || book.Notes || ''
                }));
                
                messageDiv.innerHTML = '';
                updateStatistics();
                populateFilters();
                setupEventListeners(); // Call setupEventListeners after populating
            },
            error: function(error) {
                console.error('Fetch error:', error);
                messageDiv.innerHTML = '<div class="error">Error loading CSV. Make sure the Google Sheets link is public and published as CSV.</div>';
            }
        });
    }
    
    // ===========================================
    // STATISTICS CALCULATION
    // ===========================================
    
    function updateStatistics() {
        const totalBooks = allBooks.length;
        const totalPages = allBooks.reduce((sum, book) => sum + (book.pages || 0), 0);
        const avgRating = (allBooks.reduce((sum, book) => sum + (book.rating || 0), 0) / totalBooks).toFixed(1);
        
        const currentYear = new Date().getFullYear();
        const booksThisYear = allBooks.filter(book => {
            if (!book.finishDate) return false;
            const year = new Date(book.finishDate).getFullYear();
            return year === currentYear;
        }).length;
        
        document.getElementById('totalBooks').textContent = totalBooks;
        document.getElementById('totalPages').textContent = totalPages.toLocaleString();
        document.getElementById('avgRating').textContent = avgRating;
        document.getElementById('booksThisYear').textContent = booksThisYear;
        
        // Update detailed stats
        const statsDetails = document.getElementById('statsDetails');
        if (statsDetails) {
            const genreCounts = {};
            allBooks.forEach(book => {
                genreCounts[book.genre] = (genreCounts[book.genre] || 0) + 1;
            });
            
            let html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">';
            Object.entries(genreCounts).sort((a, b) => b[1] - a[1]).forEach(([genre, count]) => {
                html += `<div style="padding: 15px; background: #f8f9fa; border-radius: 4px;">
                    <div style="font-size: 24px; font-weight: bold; color: #667eea;">${count}</div>
                    <div style="font-size: 14px; color: #666;">${genre}</div>
                </div>`;
            });
            html += '</div>';
            statsDetails.innerHTML = html;
        }
    }
    
    // ===========================================
    // YEAR CHART
    // ===========================================
    
    function renderYearChart() {
        const yearCounts = {};
        allBooks.forEach(book => {
            if (book.finishDate) {
                const year = new Date(book.finishDate).getFullYear();
                yearCounts[year] = (yearCounts[year] || 0) + 1;
            }
        });
        
        const years = Object.keys(yearCounts).sort();
        const maxCount = Math.max(...Object.values(yearCounts));
        
        const chartDiv = document.getElementById('yearChart');
        chartDiv.innerHTML = '';
        
        years.forEach(year => {
            const count = yearCounts[year];
            const height = (count / maxCount) * 100;
            
            const bar = document.createElement('div');
            bar.className = 'year-bar';
            bar.style.height = height + '%';
            bar.innerHTML = `
                <div class="count">${count}</div>
                <div class="label">${year}</div>
            `;
            chartDiv.appendChild(bar);
        });
    }
    
    // ===========================================
    // FILTER POPULATION
    // ===========================================
    
    function populateFilters() {
        const genres = [...new Set(allBooks.map(book => book.genre).filter(g => g))];
        const genreSelect = document.getElementById('genreFilter');
        genres.sort().forEach(genre => {
            const option = document.createElement('option');
            option.value = genre;
            option.textContent = genre;
            genreSelect.appendChild(option);
        });
        
        const years = [...new Set(allBooks.map(book => {
            if (!book.finishDate) return null;
            return new Date(book.finishDate).getFullYear();
        }).filter(y => y))];
        const yearSelect = document.getElementById('yearFilter');
        years.sort((a, b) => b - a).forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearSelect.appendChild(option);
        });
    }

    // ===========================================
    // SEARCH & CLEAR BUTTON HANDLER (NEW)
    // ===========================================
    
    function updateSearchAndClearButton() {
        const searchInput = document.getElementById('searchInput');
        const clearBtn = document.getElementById('clearSearchBtn');
        
        // 1. Toggle visibility of the clear button
        if (searchInput.value.length > 0) {
            clearBtn.style.visibility = 'visible';
        } else {
            clearBtn.style.visibility = 'hidden';
        }
        
        // 2. Trigger filtering
        displayBooks(); 
    }
    
    // ===========================================
    // EVENT LISTENERS (UPDATED)
    // ===========================================
    
    function setupEventListeners() {
        const searchInput = document.getElementById('searchInput');
        const clearBtn = document.getElementById('clearSearchBtn');
        
        // Listen for input changes (typing)
        searchInput.addEventListener('input', updateSearchAndClearButton);
        
        // Listen for clear button click
        clearBtn.addEventListener('click', function() {
            searchInput.value = ''; // Clear the input
            updateSearchAndClearButton(); // Hide the button and trigger displayBooks
        });
        
        // Existing listeners
        document.getElementById('genreFilter').addEventListener('change', displayBooks);
        document.getElementById('yearFilter').addEventListener('change', displayBooks);
        document.getElementById('ratingFilter').addEventListener('change', displayBooks);
        document.getElementById('sortBy').addEventListener('change', displayBooks);

        // Initial check for clear button visibility and initial display
        updateSearchAndClearButton();
    }
    
// ===========================================
    // DISPLAY BOOKS
    // ===========================================
    
    function displayBooks() {
        // Safe check for the search input element
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) return;

        const searchTerm = searchInput.value.toLowerCase().trim(); // Added trim() to clean whitespace
        const genreFilter = document.getElementById('genreFilter').value;
        const yearFilter = document.getElementById('yearFilter').value;
        const ratingFilter = parseFloat(document.getElementById('ratingFilter').value) || 0;
        const sortBy = document.getElementById('sortBy').value;
        
        let filteredBooks = allBooks.filter(book => {
            // FIX: Convert title/author to String() to prevent crashes on numbers (e.g., book title "1984")
            const titleSafe = String(book.title || '').toLowerCase();
            const authorSafe = String(book.author || '').toLowerCase();

            const matchesSearch = !searchTerm || 
                titleSafe.includes(searchTerm) || 
                authorSafe.includes(searchTerm);
            
            const matchesGenre = !genreFilter || book.genre === genreFilter;
            
            const matchesYear = !yearFilter || 
                (book.finishDate && new Date(book.finishDate).getFullYear() == yearFilter);
            
            const matchesRating = book.rating >= ratingFilter;
            
            return matchesSearch && matchesGenre && matchesYear && matchesRating;
        });
        
        // ... (Rest of the sorting logic remains the same) ...
        
        filteredBooks.sort((a, b) => {
            switch(sortBy) {
                case 'date-desc':
                    return new Date(b.finishDate || 0) - new Date(a.finishDate || 0);
                case 'date-asc':
                    return new Date(a.finishDate || 0) - new Date(b.finishDate || 0);
                case 'rating-desc':
                    return b.rating - a.rating;
                case 'rating-asc':
                    return a.rating - b.rating;
                case 'title':
                    return String(a.title).localeCompare(String(b.title)); // Added String() safety here too
                case 'pages-desc':
                    return b.pages - a.pages;
                default:
                    return 0;
            }
        });
        
        const tbody = document.getElementById('booksTableBody');
        tbody.innerHTML = '';
        
        // Note: Colspan is 7 based on index.html columns
        if (filteredBooks.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #999; padding: 50px;">No books found matching your filters.</td></tr>';
            return;
        }
        
        filteredBooks.forEach((book, index) => {
            const row = createBookRow(book, index);
            tbody.appendChild(row);
        });
    }
    // ===========================================
    // CREATE BOOK ROW
    // ===========================================
    
    function createBookRow(book, index) {
        const row = document.createElement('tr');
                
        // Title cell
        const titleCell = document.createElement('td');
        titleCell.className = 'title-cell';
        titleCell.textContent = book.title;
        row.appendChild(titleCell);
        
        // Author cell
        const authorCell = document.createElement('td');
        authorCell.className = 'author-cell';
        authorCell.textContent = book.author;
        row.appendChild(authorCell);
        
        // Pages cell
        const pagesCell = document.createElement('td');
        pagesCell.className = 'pages-cell';
        pagesCell.textContent = book.pages || '-';
        row.appendChild(pagesCell);
        
        // Genre cell
        const genreCell = document.createElement('td');
        genreCell.className = 'genre-cell';
        genreCell.textContent = book.genre;

        row.appendChild(genreCell);
        
        // Rating cell
        const ratingCell = document.createElement('td');
        ratingCell.className = 'rating-cell';
        ratingCell.textContent = book.rating ? `★ ${book.rating}/10` : '-';
        row.appendChild(ratingCell);
        
        // Date cell
        const dateCell = document.createElement('td');
        dateCell.className = 'date-cell';
        if (book.finishDate) {
            const date = new Date(book.finishDate);
            dateCell.textContent = date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short',
                day: 'numeric'
            });
        } else {
            dateCell.textContent = '-';
        }
        row.appendChild(dateCell);
        
        // Notes cell
        const notesCell = document.createElement('td');
        notesCell.className = 'notes-cell';
        notesCell.textContent = book.notes || '-';
        row.appendChild(notesCell);
        
        return row;
    }