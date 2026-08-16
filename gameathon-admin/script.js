// Global variables
let allApplications = [];
let filteredApplications = [];
let utrValidationCache = {};

// Chart instances
let trendChartInstance = null;
let statusChartInstance = null;

const savedAdminTheme = localStorage.getItem('gameathon-admin-theme');
const initialAdminTheme = savedAdminTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
document.documentElement.dataset.theme = initialAdminTheme;

function toggleAdminTheme() {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('gameathon-admin-theme', next);
    updateAdminThemeIcon();
    
    // Re-render charts to match theme
    if (document.getElementById('trendChart')) {
        renderCharts();
    }
}

function updateAdminThemeIcon() {
    const icon = document.querySelector('#themeAdminBtn i');
    if (icon) icon.className = document.documentElement.dataset.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// API Configuration
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:5002/api' 
    : 'https://gameathon-admin.onrender.com/api';

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    updateAdminThemeIcon();
    loadDashboard();
});

// Load dashboard data
async function loadDashboard() {
    showLoading();
    try {
        await fetchApplications();
        hideLoading();
    } catch (error) {
        hideLoading();
        showToast('Error loading data: ' + error.message, 'error');
    }
}

// Show loading spinner
function showLoading() {
    document.getElementById('loading').style.display = 'flex';
    document.getElementById('mainContainer').style.display = 'none';
}

// Hide loading spinner
function hideLoading() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('mainContainer').style.display = 'flex'; // Changed to flex for new layout
}

// Fetch applications from API
async function fetchApplications() {
    try {
        const response = await fetch(`${API_BASE_URL}/applications`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        allApplications = await response.json();
        filteredApplications = [...allApplications];
        
        // Validate UTR numbers
        await validateAllUTRs();
        
        // Update UI based on which page we are on
        if (document.getElementById('totalApps')) {
            updateStatistics();
            renderCharts();
        }
        
        if (document.getElementById('applicationsContainer')) {
            renderApplications();
        }
        
        showToast('Data loaded successfully!', 'success');
    } catch (error) {
        console.error('Error fetching applications:', error);
        throw error;
    }
}

// Validate all UTR numbers
async function validateAllUTRs() {
    const utrCounts = {};
    
    // Count UTR occurrences
    allApplications.forEach(app => {
        if (app.utrNumber) {
            const utr = app.utrNumber.toUpperCase();
            utrCounts[utr] = (utrCounts[utr] || 0) + 1;
        }
    });
    
    // Set validation status for each application
    allApplications.forEach(app => {
        if (app.nationality === 'Foreign') {
            utrValidationCache[app._id] = {
                isUnique: true,
                status: 'not-required'
            };
        } else if (app.utrNumber) {
            const utr = app.utrNumber.toUpperCase();
            utrValidationCache[app._id] = {
                isUnique: utrCounts[utr] === 1,
                duplicateCount: utrCounts[utr],
                status: utrCounts[utr] === 1 ? 'unique' : 'duplicate'
            };
        } else {
            utrValidationCache[app._id] = {
                isUnique: false,
                status: 'missing'
            };
        }
    });
}

// Update statistics (Dashboard only)
function updateStatistics() {
    const stats = {
        total: allApplications.length,
        pending: allApplications.filter(app => (app.status || 'pending') === 'pending').length,
        approved: allApplications.filter(app => app.status === 'approved').length,
        rejected: allApplications.filter(app => app.status === 'rejected').length,
        unique: Object.values(utrValidationCache).filter(v => v.isUnique).length,
        duplicate: Object.values(utrValidationCache).filter(v => v.status === 'duplicate').length
    };
    
    document.getElementById('totalApps').textContent = stats.total;
    document.getElementById('pendingApps').textContent = stats.pending;
    document.getElementById('approvedApps').textContent = stats.approved;
    document.getElementById('rejectedApps').textContent = stats.rejected;
    document.getElementById('uniqueUTR').textContent = stats.unique;
    document.getElementById('duplicateUTR').textContent = stats.duplicate;
}

// Render Charts (Dashboard only)
function renderCharts() {
    const isDark = document.documentElement.dataset.theme === 'dark';
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? '#334155' : '#e2e8f0';

    // Status Donut Chart
    const statusCtx = document.getElementById('statusChart').getContext('2d');
    const approved = allApplications.filter(app => app.status === 'approved').length;
    const pending = allApplications.filter(app => (app.status || 'pending') === 'pending').length;
    const rejected = allApplications.filter(app => app.status === 'rejected').length;

    if (statusChartInstance) {
        statusChartInstance.destroy();
    }

    statusChartInstance = new Chart(statusCtx, {
        type: 'doughnut',
        data: {
            labels: ['Approved', 'Pending', 'Rejected'],
            datasets: [{
                data: [approved, pending, rejected],
                backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                borderWidth: 0,
                cutout: '75%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: textColor, padding: 20 } }
            }
        }
    });

    // Trend Bar Chart
    const trendCtx = document.getElementById('trendChart').getContext('2d');
    
    // Group by date
    const dateCounts = {};
    allApplications.forEach(app => {
        const date = new Date(app.registrationDate || new Date()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        dateCounts[date] = (dateCounts[date] || 0) + 1;
    });

    // Sort dates
    const sortedDates = Object.keys(dateCounts).sort((a, b) => new Date(a) - new Date(b)).slice(-7); // Last 7 active days
    const trendData = sortedDates.map(date => dateCounts[date]);

    if (trendChartInstance) {
        trendChartInstance.destroy();
    }

    trendChartInstance = new Chart(trendCtx, {
        type: 'bar',
        data: {
            labels: sortedDates.length ? sortedDates : ['No Data'],
            datasets: [{
                label: 'Registrations',
                data: trendData.length ? trendData : [0],
                backgroundColor: '#3b82f6',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor, stepSize: 1 } },
                x: { grid: { display: false }, ticks: { color: textColor } }
            }
        }
    });
}

// Render applications (Table only)
function renderApplications() {
    const container = document.getElementById('applicationsContainer');
    if (!container) return; // Guard
    
    if (filteredApplications.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <i class="fas fa-inbox" style="font-size: 24px; margin-bottom: 10px;"></i>
                    <p>No applications found.</p>
                </td>
            </tr>
        `;
        return;
    }
    
    container.innerHTML = filteredApplications.map(app => renderApplicationRow(app)).join('');
}

// Render single application row
function renderApplicationRow(app) {
    const validation = utrValidationCache[app._id];
    const statusClass = app.status || 'pending';
    
    // Format date
    const registrationDate = new Date(app.registrationDate).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    // Status badges
    let statusBadgeText = statusClass.charAt(0).toUpperCase() + statusClass.slice(1);
    const statusBadge = `<span class="badge ${statusClass}">${statusBadgeText}</span>`;
    
    let utrBadge = '';
    if (validation) {
        if (validation.status === 'missing') {
            utrBadge = `<span class="badge missing" title="Missing UTR">No UTR</span>`;
        } else if (validation.status === 'not-required') {
            utrBadge = `<span class="badge unique" title="Foreign">Foreign</span>`;
        } else if (validation.isUnique) {
            utrBadge = `<span class="badge unique" title="Unique UTR">Unique</span>`;
        } else {
            utrBadge = `<span class="badge duplicate" title="Duplicate UTR">Dup (${validation.duplicateCount})</span>`;
        }
    }
    
    // Action buttons
    let actionButtons = `
        <button class="action-btn" title="Edit Application" onclick="event.stopPropagation(); editApplication('${app._id}')">
            <i class="fas fa-edit"></i>
        </button>
    `;
    
    if (statusClass === 'pending') {
        const acceptDisabled = validation && !validation.isUnique ? 'disabled' : '';
        actionButtons += `
            <button class="action-btn accept" title="Approve" onclick="event.stopPropagation(); updateStatus('${app._id}', 'approved')" ${acceptDisabled}>
                <i class="fas fa-check"></i>
            </button>
            <button class="action-btn reject" title="Reject" onclick="event.stopPropagation(); updateStatus('${app._id}', 'rejected')">
                <i class="fas fa-times"></i>
            </button>
        `;
    }
    
    actionButtons += `
        <button class="action-btn reject" title="Delete" onclick="event.stopPropagation(); deleteApplication('${app._id}', '${String(app.teamName || '').replace(/'/g, "\\'")}')">
            <i class="fas fa-trash"></i>
        </button>
    `;
    
    return `
        <tr class="clickable-row" onclick="openDetailsPanel('${app._id}')">
            <td>
                <div class="team-info">
                    <span class="team-name">${app.teamName}</span>
                    <span class="team-leader">${app.teamLeader} | ${app.email}</span>
                </div>
            </td>
            <td>${app.college}</td>
            <td>${registrationDate}</td>
            <td>
                <div style="display: flex; gap: 6px;">
                    ${statusBadge}
                    ${utrBadge}
                </div>
            </td>
            <td>
                <div class="action-menu">
                    ${actionButtons}
                </div>
            </td>
        </tr>
    `;
}

// Details Panel functions
function openDetailsPanel(id) {
    const app = allApplications.find(a => a._id === id);
    if (!app) return;
    
    document.getElementById('panelTeamName').textContent = app.teamName;
    
    const registrationDate = new Date(app.registrationDate).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'short', day: 'numeric'
    });
    
    let teamMembersHtml = '';
    if (app.teamMembers && app.teamMembers.length > 0) {
        teamMembersHtml = `
            <div class="detail-section">
                <h4>Team Members</h4>
                <div>
                    ${app.teamMembers.map(member => `<span class="member-tag">${member}</span>`).join('')}
                </div>
            </div>
        `;
    }
    
    let paymentLink = 'N/A';
    if (app.paymentScreenshot) {
        const screenshotUrl = /^https?:/i.test(app.paymentScreenshot) ? app.paymentScreenshot : `/${app.paymentScreenshot.replace(/^\/?(?:\.\/)?/, '')}`;
        paymentLink = `<a href="${screenshotUrl}" target="_blank" rel="noopener" style="color: var(--brand-primary);">View Screenshot</a>`;
    }

    const panelBody = document.getElementById('panelBody');
    panelBody.innerHTML = `
        <div class="detail-section">
            <h4>Contact Info</h4>
            <div class="detail-item">
                <i class="fas fa-user"></i>
                <div class="detail-item-content">
                    <div class="detail-label">Leader</div>
                    <div class="detail-value">${app.teamLeader}</div>
                </div>
            </div>
            <div class="detail-item">
                <i class="fas fa-envelope"></i>
                <div class="detail-item-content">
                    <div class="detail-label">Email</div>
                    <div class="detail-value">${app.email}</div>
                </div>
            </div>
            <div class="detail-item">
                <i class="fas fa-phone"></i>
                <div class="detail-item-content">
                    <div class="detail-label">Phone</div>
                    <div class="detail-value">${app.phone}</div>
                </div>
            </div>
            <div class="detail-item">
                <i class="fas fa-university"></i>
                <div class="detail-item-content">
                    <div class="detail-label">College</div>
                    <div class="detail-value">${app.college}</div>
                </div>
            </div>
        </div>

        <div class="detail-section">
            <h4>Event Details</h4>
            <div class="detail-item">
                <i class="fas fa-users"></i>
                <div class="detail-item-content">
                    <div class="detail-label">Size</div>
                    <div class="detail-value">${app.memberCount} Members</div>
                </div>
            </div>
            <div class="detail-item">
                <i class="fas fa-tag"></i>
                <div class="detail-item-content">
                    <div class="detail-label">Participation Type</div>
                    <div class="detail-value">${app.participationType || 'N/A'}</div>
                </div>
            </div>
            <div class="detail-item">
                <i class="fas fa-graduation-cap"></i>
                <div class="detail-item-content">
                    <div class="detail-label">Training</div>
                    <div class="detail-value">${app.trainingOption || 'N/A'}</div>
                </div>
            </div>
        </div>

        <div class="detail-section">
            <h4>Payment Info</h4>
            <div class="detail-item">
                <i class="fas fa-credit-card"></i>
                <div class="detail-item-content">
                    <div class="detail-label">UTR Number</div>
                    <div class="detail-value">${app.nationality === 'Foreign' ? 'N/A (Foreign)' : (app.utrNumber || 'Not provided')}</div>
                </div>
            </div>
            <div class="detail-item">
                <i class="fas fa-calendar"></i>
                <div class="detail-item-content">
                    <div class="detail-label">Registered Date</div>
                    <div class="detail-value">${registrationDate}</div>
                </div>
            </div>
            <div class="detail-item">
                <i class="fas fa-image"></i>
                <div class="detail-item-content">
                    <div class="detail-label">Screenshot</div>
                    <div class="detail-value">${paymentLink}</div>
                </div>
            </div>
        </div>
        
        ${teamMembersHtml}
    `;

    document.getElementById('panelOverlay').classList.add('active');
    document.getElementById('detailsPanel').classList.add('active');
}

function closeDetailsPanel() {
    document.getElementById('panelOverlay').classList.remove('active');
    document.getElementById('detailsPanel').classList.remove('active');
}

// Apply filters
function applyFilters() {
    const searchInput = document.getElementById('searchInput');
    const statusFilterEl = document.getElementById('statusFilter');
    const utrFilterEl = document.getElementById('utrFilter');
    
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const statusFilter = statusFilterEl ? statusFilterEl.value : 'all';
    const utrFilter = utrFilterEl ? utrFilterEl.value : 'all';
    
    filteredApplications = allApplications.filter(app => {
        // Search filter
        const matchesSearch = !searchTerm || 
            app.teamName?.toLowerCase().includes(searchTerm) ||
            app.teamLeader?.toLowerCase().includes(searchTerm) ||
            app.email?.toLowerCase().includes(searchTerm) ||
            app.utrNumber?.toLowerCase().includes(searchTerm);
        
        // Status filter
        const matchesStatus = statusFilter === 'all' || (app.status || 'pending') === statusFilter;
        
        // UTR filter
        const validation = utrValidationCache[app._id];
        let matchesUTR = true;
        if (utrFilter !== 'all' && validation) {
            if (utrFilter === 'unique') matchesUTR = validation.isUnique;
            else if (utrFilter === 'duplicate') matchesUTR = !validation.isUnique && validation.status !== 'missing';
            else if (utrFilter === 'missing') matchesUTR = validation.status === 'missing';
        }
        
        return matchesSearch && matchesStatus && matchesUTR;
    });
    
    if (document.getElementById('applicationsContainer')) {
        renderApplications();
    }
}

// Clear filters
function clearFilters() {
    if (document.getElementById('searchInput')) document.getElementById('searchInput').value = '';
    if (document.getElementById('statusFilter')) document.getElementById('statusFilter').value = 'all';
    if (document.getElementById('utrFilter')) document.getElementById('utrFilter').value = 'all';
    
    filteredApplications = [...allApplications];
    
    if (document.getElementById('applicationsContainer')) {
        renderApplications();
    }
}

// Silent fetch to update data in the background without showing loaders
async function fetchApplicationsSilent() {
    try {
        const response = await fetch(`${API_BASE_URL}/applications`);
        if (!response.ok) return;
        
        allApplications = await response.json();
        await validateAllUTRs();
        
        // Re-apply filters which will also render the table
        applyFilters();
        
        // Update dashboard if we are on it
        if (document.getElementById('totalApps')) {
            updateStatistics();
            renderCharts();
        }
    } catch (error) {
        console.error('Silent fetch failed:', error);
    }
}

// Update application status
async function updateStatus(id, status) {
    try {
        const response = await fetch(`${API_BASE_URL}/applications/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Ensure UI is perfectly synced by re-fetching
        await fetchApplicationsSilent();
        
        showToast(`Application ${status} successfully!`, 'success');
    } catch (error) {
        console.error('Error updating status:', error);
        showToast('Failed to update application status', 'error');
    }
}

async function deleteApplication(id, teamName) {
    if (!window.confirm(`Delete ${teamName || 'this application'}? This cannot be undone.`)) return;
    try {
        const response = await fetch(`${API_BASE_URL}/applications/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Delete failed');
        
        await fetchApplicationsSilent();
        showToast('Application deleted', 'success');
    } catch (error) { showToast(error.message, 'error'); }
}

async function resendEmail(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/applications/${id}/resend-email`, { method: 'POST' });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || result.message || 'Email failed');
        showToast('Acceptance email sent', 'success');
    } catch (error) { showToast(error.message, 'error'); }
}

// Edit application
function editApplication(id) {
    const app = allApplications.find(a => a._id === id);
    if (!app) return;
    
    // Populate form
    document.getElementById('editId').value = app._id;
    document.getElementById('editTeamName').value = app.teamName || '';
    document.getElementById('editTeamLeader').value = app.teamLeader || '';
    document.getElementById('editEmail').value = app.email || '';
    document.getElementById('editPhone').value = app.phone || '';
    document.getElementById('editCollege').value = app.college || '';
    document.getElementById('editMemberCount').value = app.memberCount || '';
    document.getElementById('editParticipationType').value = app.participationType || '';
    document.getElementById('editTrainingOption').value = app.trainingOption || '';
    document.getElementById('editUTRNumber').value = app.utrNumber || '';
    document.getElementById('editPaymentScreenshot').value = app.paymentScreenshot || '';
    
    // Handle team members array
    if (app.teamMembers && app.teamMembers.length > 0) {
        document.getElementById('editTeamMembers').value = app.teamMembers.join(', ');
    } else {
        document.getElementById('editTeamMembers').value = '';
    }
    
    // Show modal
    document.getElementById('editModal').style.display = 'block';
}

// Close edit modal
function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    document.getElementById('utrValidation').innerHTML = '';
}

// Save edit
async function saveEdit() {
    const id = document.getElementById('editId').value;
    
    // Collect form data
    const updateData = {
        teamName: document.getElementById('editTeamName').value,
        teamLeader: document.getElementById('editTeamLeader').value,
        email: document.getElementById('editEmail').value,
        phone: document.getElementById('editPhone').value,
        college: document.getElementById('editCollege').value,
        memberCount: document.getElementById('editMemberCount').value,
        participationType: document.getElementById('editParticipationType').value,
        trainingOption: document.getElementById('editTrainingOption').value,
        utrNumber: document.getElementById('editUTRNumber').value,
        paymentScreenshot: document.getElementById('editPaymentScreenshot').value
    };
    
    // Handle team members
    const teamMembersText = document.getElementById('editTeamMembers').value;
    if (teamMembersText.trim()) {
        updateData.teamMembers = teamMembersText.split(',').map(member => member.trim()).filter(member => member);
    } else {
        updateData.teamMembers = [];
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/applications/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Ensure UI is perfectly synced by re-fetching
        await fetchApplicationsSilent();
        
        closeEditModal();
        showToast('Application updated successfully!', 'success');
    } catch (error) {
        console.error('Error updating application:', error);
        showToast('Failed to update application', 'error');
    }
}

// Validate UTR number
async function validateUTR(utrNumber) {
    const validationDiv = document.getElementById('utrValidation');
    
    if (!utrNumber) {
        validationDiv.innerHTML = '';
        return;
    }
    
    try {
        const excludeId = document.getElementById('editId').value;
        const response = await fetch(`${API_BASE_URL}/applications/check-utr`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                utrNumber: utrNumber.toUpperCase(),
                excludeId 
            })
        });
        
        const result = await response.json();
        
        if (result.isUnique) {
            validationDiv.innerHTML = '<div class="validation-message success"><i class="fas fa-check-circle"></i> UTR is unique</div>';
        } else {
            validationDiv.innerHTML = `<div class="validation-message error"><i class="fas fa-exclamation-triangle"></i> UTR already exists (${result.count} occurrences)</div>`;
        }
    } catch (error) {
        console.error('Error validating UTR:', error);
        validationDiv.innerHTML = '<div class="validation-message error"><i class="fas fa-times-circle"></i> Error checking UTR</div>';
    }
}

// Refresh data
async function refreshData() {
    try {
        showToast('Refreshing data...', 'info');
        await fetchApplications();
        clearFilters();
    } catch (error) {
        showToast('Error refreshing data: ' + error.message, 'error');
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;
    const toast = document.createElement('div');
    
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        info: 'fas fa-info-circle'
    };
    
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon ${type}">
            <i class="${icons[type]}"></i>
        </div>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 4000);
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('editModal');
    if (event.target === modal) {
        closeEditModal();
    }
}
