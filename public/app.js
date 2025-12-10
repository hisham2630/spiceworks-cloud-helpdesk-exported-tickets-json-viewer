// Application state
let currentPage = 1;
let currentSearch = '';
let currentStatus = '';
let currentStartDate = '';
let currentEndDate = '';
const itemsPerPage = 20;

// DOM Elements
const ticketsContainer = document.getElementById('tickets-container');
const paginationContainer = document.getElementById('pagination');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const statusFilter = document.getElementById('status-filter');
const startDateInput = document.getElementById('start-date');
const endDateInput = document.getElementById('end-date');
const clearFiltersBtn = document.getElementById('clear-filters-btn');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const modal = document.getElementById('ticket-modal');
const modalBody = document.getElementById('modal-body');
const closeBtn = document.querySelector('.close');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    loadTickets();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    statusFilter.addEventListener('change', handleSearch);
    startDateInput.addEventListener('change', handleSearch);
    endDateInput.addEventListener('change', handleSearch);
    clearFiltersBtn.addEventListener('click', clearFilters);
    
    closeBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

// Load statistics
async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        const stats = await response.json();
        
        document.getElementById('total-tickets').textContent = stats.total;
        document.getElementById('open-tickets').textContent = stats.open;
        document.getElementById('closed-tickets').textContent = stats.closed;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Handle search
function handleSearch() {
    currentSearch = searchInput.value.trim();
    currentStatus = statusFilter.value;
    currentStartDate = startDateInput.value;
    currentEndDate = endDateInput.value;
    currentPage = 1;
    loadTickets();
}

// Clear all filters
function clearFilters() {
    searchInput.value = '';
    statusFilter.value = '';
    startDateInput.value = '';
    endDateInput.value = '';
    currentSearch = '';
    currentStatus = '';
    currentStartDate = '';
    currentEndDate = '';
    currentPage = 1;
    loadTickets();
}

// Load tickets
async function loadTickets() {
    try {
        showLoading();
        hideError();
        
        const params = new URLSearchParams({
            page: currentPage,
            limit: itemsPerPage,
            search: currentSearch,
            status: currentStatus,
            startDate: currentStartDate,
            endDate: currentEndDate
        });
        
        const response = await fetch(`/api/tickets?${params}`);
        if (!response.ok) throw new Error('Failed to fetch tickets');
        
        const data = await response.json();
        
        displayTickets(data.tickets);
        displayPagination(data.pagination);
        hideLoading();
    } catch (error) {
        console.error('Error loading tickets:', error);
        showError('Failed to load tickets. Please try again.');
        hideLoading();
    }
}

// Display tickets
function displayTickets(tickets) {
    if (tickets.length === 0) {
        ticketsContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #999;">
                <h3>No tickets found</h3>
                <p>Try adjusting your search or filters</p>
            </div>
        `;
        return;
    }
    
    ticketsContainer.innerHTML = tickets.map(ticket => `
        <div class="ticket-card" onclick="viewTicket(${ticket.import_id})">
            <div class="ticket-header">
                <div class="ticket-number">Ticket #${ticket.ticket_number || 'N/A'}</div>
                <div class="ticket-status status-${ticket.status}">${ticket.status || 'unknown'}</div>
            </div>
            <div class="ticket-summary">${escapeHtml(ticket.summary || 'No summary')}</div>
            <div class="ticket-meta">
                <div class="meta-item">
                    <span class="meta-label">Created:</span>
                    <span>${formatDate(ticket.created_at)}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Assigned to:</span>
                    <span>${escapeHtml(ticket.assigned_user)}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Priority:</span>
                    <span>${getPriorityLabel(ticket.priority)}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Comments:</span>
                    <span>${ticket.comment_count || 0}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Display pagination
function displayPagination(pagination) {
    const { page, totalPages, total } = pagination;
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let html = '';
    
    // Previous button
    html += `
        <button class="page-btn" ${page === 1 ? 'disabled' : ''} onclick="changePage(${page - 1})">
            Previous
        </button>
    `;
    
    // Page numbers
    const maxPagesToShow = 5;
    let startPage = Math.max(1, page - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage < maxPagesToShow - 1) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    if (startPage > 1) {
        html += `<button class="page-btn" onclick="changePage(1)">1</button>`;
        if (startPage > 2) html += `<span class="page-info">...</span>`;
    }
    
    for (let i = startPage; i <= endPage; i++) {
        html += `
            <button class="page-btn ${i === page ? 'active' : ''}" onclick="changePage(${i})">
                ${i}
            </button>
        `;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += `<span class="page-info">...</span>`;
        html += `<button class="page-btn" onclick="changePage(${totalPages})">${totalPages}</button>`;
    }
    
    // Next button
    html += `
        <button class="page-btn" ${page === totalPages ? 'disabled' : ''} onclick="changePage(${page + 1})">
            Next
        </button>
    `;
    
    html += `<span class="page-info">Total: ${total} tickets</span>`;
    
    paginationContainer.innerHTML = html;
}

// Change page
function changePage(page) {
    currentPage = page;
    loadTickets();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// View ticket details
async function viewTicket(ticketId) {
    try {
        const response = await fetch(`/api/tickets/${ticketId}`);
        if (!response.ok) throw new Error('Failed to fetch ticket details');
        
        const ticket = await response.json();
        displayTicketModal(ticket);
    } catch (error) {
        console.error('Error loading ticket details:', error);
        alert('Failed to load ticket details. Please try again.');
    }
}

// Display ticket modal
function displayTicketModal(ticket) {
    const comments = ticket.Comments || [];
    
    modalBody.innerHTML = `
        <div class="modal-ticket-header">
            <div class="modal-ticket-number">Ticket #${ticket.ticket_number || 'N/A'}</div>
            <div class="ticket-status status-${ticket.status}">${ticket.status || 'unknown'}</div>
        </div>
        
        <h2 class="modal-ticket-summary">${escapeHtml(ticket.summary || 'No summary')}</h2>
        
        <div class="modal-ticket-meta">
            <div class="modal-meta-item">
                <div class="modal-meta-label">Status</div>
                <div class="modal-meta-value">${ticket.status || 'Unknown'}</div>
            </div>
            <div class="modal-meta-item">
                <div class="modal-meta-label">Priority</div>
                <div class="modal-meta-value">${getPriorityLabel(ticket.priority)}</div>
            </div>
            <div class="modal-meta-item">
                <div class="modal-meta-label">Assigned To</div>
                <div class="modal-meta-value">${escapeHtml(ticket.assigned_user)}</div>
            </div>
            <div class="modal-meta-item">
                <div class="modal-meta-label">Created By</div>
                <div class="modal-meta-value">${escapeHtml(ticket.created_user)}</div>
            </div>
            <div class="modal-meta-item">
                <div class="modal-meta-label">Created At</div>
                <div class="modal-meta-value">${formatDate(ticket.created_at)}</div>
            </div>
            <div class="modal-meta-item">
                <div class="modal-meta-label">Updated At</div>
                <div class="modal-meta-value">${formatDate(ticket.updated_at)}</div>
            </div>
            ${ticket.closed_at ? `
                <div class="modal-meta-item">
                    <div class="modal-meta-label">Closed At</div>
                    <div class="modal-meta-value">${formatDate(ticket.closed_at)}</div>
                </div>
            ` : ''}
        </div>
        
        <div class="modal-section">
            <h3 class="modal-section-title">Description</h3>
            <div class="modal-description">${escapeHtml(ticket.description || 'No description provided')}</div>
        </div>
        
        <div class="modal-section">
            <h3 class="modal-section-title">Comments (${comments.length})</h3>
            ${comments.length > 0 ? `
                <div class="comments-list">
                    ${comments.map(comment => `
                        <div class="comment-card">
                            <div class="comment-header">
                                <span class="comment-author">${escapeHtml(comment.user_name)}</span>
                                <span class="comment-date">${formatDate(comment.created_at)}</span>
                            </div>
                            ${comment.body ? `<div class="comment-body">${escapeHtml(comment.body)}</div>` : ''}
                            ${comment.action ? `<div class="comment-action">Action: ${escapeHtml(comment.action)}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            ` : '<div class="no-comments">No comments yet</div>'}
        </div>
    `;
    
    modal.style.display = 'block';
}

// Close modal
function closeModal() {
    modal.style.display = 'none';
}

// Utility functions
function showLoading() {
    loadingDiv.style.display = 'block';
    ticketsContainer.style.display = 'none';
}

function hideLoading() {
    loadingDiv.style.display = 'none';
    ticketsContainer.style.display = 'block';
}

function showError(message) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function hideError() {
    errorDiv.style.display = 'none';
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
}

function getPriorityLabel(priority) {
    const priorities = {
        '1': 'Low',
        '2': 'Medium',
        '3': 'High',
        '4': 'Critical'
    };
    return priorities[priority] || 'Unknown';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
