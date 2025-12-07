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
    
    // Show selected tab (remove the '-tab' suffix)
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to clicked button
    event.target.classList.add('active');
    
    // Update stats/charts if switching to stats tab
    if (tabName === 'statistics' && typeof allBooks !== 'undefined' && allBooks.length > 0) {
        // updateStatistics();
        // renderYearChart();
    }
    
    if (tabName === 'overview' && typeof allBooks !== 'undefined' && allBooks.length > 0) {
        // updateStatistics();
        // renderYearChart();
    }
}