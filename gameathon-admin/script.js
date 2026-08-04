// Global variables
let allApplications = [];
let filteredApplications = [];
let utrValidationCache = {};

const savedAdminTheme = localStorage.getItem('gameathon-admin-theme');
const initialAdminTheme = savedAdminTheme || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
document.documentElement.dataset.theme = initialAdminTheme;

function toggleAdminTheme() {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('gameathon-admin-theme', next);
    updateAdminThemeIcon();
}

function updateAdminThemeIcon() {
    const icon = document.querySelector('#themeAdminBtn i');
    if (icon) icon.className = document.documentElement.dataset.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// API Configuration
const API_BASE_URL = 'http://localhost:5002/api';

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
        showToast('Error loading dashboard: ' + error.message, 'error');
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
    document.getElementById('mainContainer').style.display = 'block';
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
        
        // Update UI
        updateStatistics();
        renderApplications();
        
        showToast('Dashboard loaded successfully!', 'success');
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
        if (app.utrNumber) {
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

// Update statistics
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

// Render applications
function renderApplications() {
    const container = document.getElementById('applicationsContainer');
    
    if (filteredApplications.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-inbox"></i>
                <h3>No Applications Found</h3>
                <p>No applications match your current filter criteria.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filteredApplications.map(app => renderApplicationCard(app)).join('');
}

// Render single application card
function renderApplicationCard(app) {
    const validation = utrValidationCache[app._id];
    const statusClass = app.status || 'pending';
    
    // Format date
    const registrationDate = new Date(app.registrationDate).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    // UTR badge
    let utrBadge = '';
    if (validation) {
        if (validation.status === 'missing') {
            utrBadge = `<span class="badge missing"><i class="fas fa-exclamation-circle"></i> Missing UTR</span>`;
        } else if (validation.isUnique) {
            utrBadge = `<span class="badge unique"><i class="fas fa-check-circle"></i> Unique UTR</span>`;
        } else {
            utrBadge = `<span class="badge duplicate"><i class="fas fa-exclamation-triangle"></i> Duplicate UTR (${validation.duplicateCount})</span>`;
        }
    }
    
    // Status badge
    const statusIcons = {
        pending: 'fas fa-clock',
        approved: 'fas fa-check-circle',
        rejected: 'fas fa-times-circle'
    };
    
    const statusBadge = `<span class="badge ${statusClass}"><i class="${statusIcons[statusClass]}"></i> ${statusClass.charAt(0).toUpperCase() + statusClass.slice(1)}</span>`;
    
    // Team members
    let teamMembersHtml = '';
    if (app.teamMembers && app.teamMembers.length > 0) {
        teamMembersHtml = `
            <div class="team-members">
                <h4>Team Members</h4>
                <div class="members-list">
                    ${app.teamMembers.map(member => `<span class="member-tag">${member}</span>`).join('')}
                </div>
            </div>
        `;
    }
    
    // Duplicate warning
    let duplicateWarning = '';
    if (validation && !validation.isUnique && validation.status !== 'missing') {
        duplicateWarning = `
            <div class="duplicate-warning">
                <i class="fas fa-exclamation-triangle"></i>
                <span>UTR Duplicate Warning: This UTR number appears ${validation.duplicateCount} times in the database</span>
            </div>
        `;
    }
    
    // Action buttons
    let actionButtons = `
        <button class="btn btn-secondary" onclick="editApplication('${app._id}')">
            <i class="fas fa-edit"></i> Edit
        </button>
    `;
    
    if (statusClass === 'pending') {
        const acceptDisabled = validation && !validation.isUnique ? 'disabled' : '';
        actionButtons += `
            <button class="btn btn-success" onclick="updateStatus('${app._id}', 'approved')" ${acceptDisabled}>
                <i class="fas fa-check"></i> Accept
            </button>
            <button class="btn btn-danger" onclick="updateStatus('${app._id}', 'rejected')">
                <i class="fas fa-times"></i> Reject
            </button>
        `;
    }
    if (statusClass === 'approved') {
        actionButtons += `<button class="btn btn-success" onclick="resendEmail('${app._id}')"><i class="fas fa-envelope"></i> Resend email</button>`;
    }
    actionButtons += `<button class="btn btn-danger" onclick="deleteApplication('${app._id}', '${String(app.teamName || '').replace(/'/g, "\\'")}')"><i class="fas fa-trash"></i> Delete</button>`;
    
    // Payment screenshot link
    let paymentLink = '';
    if (app.paymentScreenshot) {
        const screenshotUrl = /^https?:/i.test(app.paymentScreenshot) ? app.paymentScreenshot : `/${app.paymentScreenshot.replace(/^\/?(?:\.\/)?/, '')}`;
        paymentLink = `<a href="${screenshotUrl}" target="_blank" rel="noopener" class="btn btn-link">View Payment Screenshot</a>`;
    }
    
    return `
        <div class="application-card ${statusClass}">
            <div class="card-header">
                <div class="card-title">
                    <h3>${app.teamName}</h3>
                    <p>Leader: ${app.teamLeader}</p>
                </div>
                <div class="badges">
                    ${statusBadge}
                    ${utrBadge}
                </div>
            </div>
            
            <div class="card-content">
                <div class="info-grid">
                    <div class="info-section">
                        <h4>Contact Information</h4>
                        <div class="info-item">
                            <i class="fas fa-envelope"></i>
                            <span>${app.email}</span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-phone"></i>
                            <span>${app.phone}</span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-university"></i>
                            <span>${app.college}</span>
                        </div>
                    </div>
                    
                    <div class="info-section">
                        <h4>Team Details</h4>
                        <div class="info-item">
                            <i class="fas fa-users"></i>
                            <span>Members: ${app.memberCount}</span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-tag"></i>
                            <span>Type: ${app.participationType || 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-graduation-cap"></i>
                            <span>Training: ${app.trainingOption || 'N/A'}</span>
                        </div>
                    </div>
                    
                    <div class="info-section">
                        <h4>Payment Details</h4>
                        <div class="info-item">
                            <i class="fas fa-credit-card"></i>
                            <span>UTR: ${app.utrNumber || 'Not provided'}</span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-calendar"></i>
                            <span>Registered: ${registrationDate}</span>
                        </div>
                        ${paymentLink ? `<div class="info-item">${paymentLink}</div>` : ''}
                    </div>
                </div>
                
                ${teamMembersHtml}
                ${duplicateWarning}
            </div>
            
            <div class="card-actions">
                ${actionButtons}
            </div>
        </div>
    `;
}

// Apply filters
function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const utrFilter = document.getElementById('utrFilter').value;
    
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
    
    renderApplications();
}

// Clear filters
function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('statusFilter').value = 'all';
    document.getElementById('utrFilter').value = 'all';
    
    filteredApplications = [...allApplications];
    renderApplications();
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
        
        // Update local data
        const appIndex = allApplications.findIndex(app => app._id === id);
        if (appIndex !== -1) {
            allApplications[appIndex].status = status;
        }
        
        // Re-apply filters and update UI
        applyFilters();
        updateStatistics();
        
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
        allApplications = allApplications.filter(app => app._id !== id);
        await validateAllUTRs(); applyFilters(); updateStatistics();
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
        
        const updatedApp = await response.json();
        
        // Update local data
        const appIndex = allApplications.findIndex(app => app._id === id);
        if (appIndex !== -1) {
            allApplications[appIndex] = updatedApp;
        }
        
        // Revalidate UTRs and update UI
        await validateAllUTRs();
        applyFilters();
        updateStatistics();
        
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
