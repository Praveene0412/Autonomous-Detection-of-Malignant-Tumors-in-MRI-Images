// script.js - Complete frontend logic with all fixes

// Simple helper
function $(id) { return document.getElementById(id); }

// Page elements
const pages = Array.from(document.querySelectorAll('.page'));

// Auth elements
const loginForm = $('loginForm');
const loginIdentifier = $('loginIdentifier');
const loginPassword = $('loginPassword');
const loginMessage = $('loginMessage');

const registerForm = $('registerForm');
const regIdentifier = $('regIdentifier');
const regPassword = $('regPassword');
const regConfirmPassword = $('regConfirmPassword');
const regMessage = $('regMessage');

const forgotPasswordForm = $('forgotPasswordForm');
const forgotIdentifier = $('forgotIdentifier');
const forgotPasswordMessage = $('forgotPasswordMessage');

// Upload & preview
const imageUpload = $('imageUpload');
const fileName = $('fileName');
const previewImg = $('previewImg');
const submitBtn = $('submitBtn');
const processingIndicator = $('processingIndicator');

// Result
const resultContainer = $('resultContainer');
const resultContent = $('resultContent');

// History
const historyTableBody = $('historyTableBody');
const clearHistoryBtn = $('clearHistoryBtn');

// Admin
const adminUsersTableBody = $('adminUsersTableBody');
const totalUsersCount = $('totalUsersCount');
const adminUsersCount = $('adminUsersCount');

// State
let currentUser = null;

// ----------------- Utility Functions -----------------
function showMessage(element, message, isSuccess = true) {
  if (!element) return;
  element.textContent = message;
  element.className = isSuccess ? 'success-msg' : 'error-msg';
  setTimeout(() => {
    element.textContent = '';
    element.className = '';
  }, 5000);
}

// Format date helper
function formatDate(dateString) {
  if (!dateString) return "N/A";
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "N/A";
    }
    
    // Format: DD/MM/YYYY, HH:MM:SS AM/PM
    const options = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    };
    
    return date.toLocaleString('en-IN', options);
  } catch (err) {
    console.error('Date format error:', err);
    return "N/A";
  }
}

// ----------------- Page Switching -----------------
function showPage(pageId) {
  pages.forEach(p => p.classList.remove('active'));
  const page = document.getElementById(pageId);
  page.classList.add('active');

  // Navigation active highlight
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

  if (pageId !== 'loginPage') {
    document.body.classList.add('after-login');
    document.body.classList.remove('login-mode');
  } else {
    document.body.classList.add('login-mode');
    document.body.classList.remove('after-login');
  }

  if (pageId === 'homePage') {
    document.querySelectorAll('.nav-home').forEach(b => b.classList.add('active'));
  } else if (pageId === 'previewPage') {
    document.querySelectorAll('.nav-preview').forEach(b => b.classList.add('active'));
  } else if (pageId === 'historyPage') {
    document.querySelectorAll('.nav-history').forEach(b => b.classList.add('active'));
    loadHistory();
  } else if (pageId === 'adminPage') {
    document.querySelectorAll('.nav-admin').forEach(b => b.classList.add('active'));
    loadUsers();
  }
}

// Navigation event listeners
document.querySelectorAll('.nav-home, #homeNavBtn').forEach(btn => {
  btn.addEventListener('click', () => showPage('homePage'));
});

document.querySelectorAll('.nav-preview, #previewNavBtn').forEach(btn => {
  btn.addEventListener('click', () => showPage('previewPage'));
});

document.querySelectorAll('.nav-history, #historyNavBtn').forEach(btn => {
  btn.addEventListener('click', () => showPage('historyPage'));
});

document.querySelectorAll('.nav-admin, #adminBtn').forEach(btn => {
  btn.addEventListener('click', () => showPage('adminPage'));
});

// Logout handlers
document.querySelectorAll('.nav-logout, #logoutBtn').forEach(btn => {
  btn.addEventListener('click', handleLogout);
});

// ----------------- Auth Flows -----------------

// Login
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginMessage.textContent = '';
  
  const identifier = loginIdentifier.value.trim();
  const password = loginPassword.value.trim();

  if (!identifier || !password) {
    showMessage(loginMessage, 'Please fill both fields', false);
    return;
  }

  try {
    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });
    const data = await res.json();
    
    if (!data.success) {
      showMessage(loginMessage, data.message || 'Login failed', false);
      return;
    }

    showMessage(loginMessage, 'Login successful!', true);
document.body.classList.add('after-login');
document.body.classList.remove('login-mode');
await postLoginUpdate();
setTimeout(() => showPage('homePage'), 500);

  } catch (err) {
    showMessage(loginMessage, 'Server error. Please try again.', false);
  }
});

// Register
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  regMessage.textContent = '';
  
  const identifier = regIdentifier.value.trim();
  const password = regPassword.value.trim();
  const confirmPassword = regConfirmPassword.value.trim();
  
  if (!identifier || !password || !confirmPassword) {
    showMessage(regMessage, 'All fields are required', false);
    return;
  }

  try {
    const res = await fetch('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password, confirmPassword })
    });
    const data = await res.json();
    
    if (data.success) {
      showMessage(regMessage, data.message, true);
      setTimeout(() => {
        showPage('loginPage');
        registerForm.reset();
      }, 1500);
    } else {
      showMessage(regMessage, data.message, false);
    }
  } catch (err) {
    showMessage(regMessage, 'Server error. Please try again.', false);
  }
});

// Forgot Password (kept but not used now)
if (forgotPasswordForm) {
  forgotPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    forgotPasswordMessage.textContent = '';
    
    const identifier = forgotIdentifier.value.trim();
    
    if (!identifier) {
      showMessage(forgotPasswordMessage, 'Please enter your email or phone', false);
      return;
    }

    try {
      const res = await fetch('/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier })
      });
      const data = await res.json();
      
      showMessage(forgotPasswordMessage, data.message, data.success);
      
      if (data.success) {
        setTimeout(() => {
          showPage('loginPage');
          forgotPasswordForm.reset();
        }, 2000);
      }
    } catch (err) {
      showMessage(forgotPasswordMessage, 'Server error. Please try again.', false);
    }
  });
}

// Logout function
async function handleLogout() {
  try {
    const res = await fetch('/logout', { method: 'POST' });
    const data = await res.json();
    
    if (data.success) {
      currentUser = null;
      document.body.classList.remove('after-login');
      document.body.classList.add('login-mode');

      document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
      
      // Clear all forms
      loginForm.reset();
      if (registerForm) registerForm.reset();
      if (forgotPasswordForm) forgotPasswordForm.reset();
      
      // Clear upload data
      if (imageUpload) imageUpload.value = '';
      if (fileName) fileName.textContent = 'No file selected.';
      if (previewImg) {
        previewImg.style.display = 'none';
        previewImg.src = '';
      }
      
      // Clear result content
      if (resultContent) {
        resultContent.innerHTML = '<p>No analysis results yet. Upload an image from the Home page.</p>';
      }
      
      // Clear history table
      if (historyTableBody) {
        historyTableBody.innerHTML = '<tr><td colspan="5" class="no-data">Loading history...</td></tr>';
      }
      
      // Clear admin users table
      if (adminUsersTableBody) {
        adminUsersTableBody.innerHTML = '<tr><td colspan="5" class="no-data">Loading users...</td></tr>';
      }
      
      // Clear stats
      if (totalUsersCount) totalUsersCount.textContent = '0';
      if (adminUsersCount) adminUsersCount.textContent = '1';
      
      // Clear any messages
      if (loginMessage) loginMessage.textContent = '';
      if (regMessage) regMessage.textContent = '';
      if (forgotPasswordMessage) forgotPasswordMessage.textContent = '';
      
      showPage('loginPage');
    } else {
      alert('Logout failed. Please try again.');
    }
  } catch (err) {
    console.error('Logout error:', err);
    alert('Server error during logout');
  }
}

// Post-login update
async function postLoginUpdate() {
  try {
    const res = await fetch('/whoami');
    const data = await res.json();
    currentUser = data;
    
    if (data.isAdmin) {
      document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = 'inline-block';
      });
    } else {
      document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = 'none';
      });
    }
  } catch (err) {
    console.warn('whoami failed', err);
  }
}

// Initial session check
(async function initialCheck() {
  try {
    const res = await fetch('/whoami');
    const data = await res.json();
    currentUser = data;
    
    if (data.isAdmin) {
      document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = 'inline-block';
      });
    }
  } catch (err) {
    console.warn('Initial check failed', err);
  }
})();

// ----------------- Page Navigation Links -----------------
if ($('showRegisterLink')) {
  $('showRegisterLink').addEventListener('click', (e) => {
    e.preventDefault();
    showPage('registerPage');
  });
}

if ($('showLoginLink')) {
  $('showLoginLink').addEventListener('click', (e) => {
    e.preventDefault();
    showPage('loginPage');
  });
}

// IMPORTANT CHANGE: Forgot Password goes to Register page
if ($('forgotPasswordLink')) {
  $('forgotPasswordLink').addEventListener('click', (e) => {
    e.preventDefault();
    showPage('registerPage');
  });
}

if ($('showLoginFromForgotLink')) {
  $('showLoginFromForgotLink').addEventListener('click', (e) => {
    e.preventDefault();
    showPage('loginPage');
  });
}

// ----------------- Upload & Analysis -----------------
if (imageUpload) {
  imageUpload.addEventListener('change', (ev) => {
    const f = ev.target.files && ev.target.files[0];
    if (!f) {
      fileName.textContent = 'No file selected.';
      previewImg.style.display = 'none';
      previewImg.src = '';
      return;
    }
    fileName.textContent = f.name;
    const url = URL.createObjectURL(f);
    previewImg.src = url;
    previewImg.style.display = 'block';
  });
}

if (submitBtn) {
  submitBtn.addEventListener('click', async () => {
    const file = imageUpload.files && imageUpload.files[0];
    if (!file) {
      alert('Please select an image first');
      return;
    }

    processingIndicator.style.display = 'flex';
    submitBtn.disabled = true;
    const form = new FormData();
    form.append('image', file);

    try {
      const res = await fetch('/analyze-image', { method: 'POST', body: form });
      const data = await res.json();

      processingIndicator.style.display = 'none';
      submitBtn.disabled = false;

      if (!data.success) {
        resultContent.innerHTML = `<p style="color:#d32f2f">${data.message || 'Analysis failed'}</p>`;
        showPage('previewPage');
        return;
      }

      const r = data.result;
      const title = r.tumorDetected 
        ? `<div class="result-title result-positive">Brain Tumor Detected</div>` 
        : `<div class="result-title result-negative">No Tumor Detected</div>`;
      
      resultContent.innerHTML = `
        ${title}
        <div style="margin-top:15px"><strong>File:</strong> ${r.originalName || r.filename}</div>
        <div style="margin-top:8px"><strong>Confidence:</strong> ${r.confidence}%</div>
        <div style="margin-top:8px;color:#666;font-size:14px">${r.message || ''}</div>
      `;
      
      showPage('previewPage');
    } catch (err) {
      processingIndicator.style.display = 'none';
      submitBtn.disabled = false;
      resultContent.innerHTML = `<p style="color:#d32f2f">Server error while analyzing. Please try again.</p>`;
      showPage('previewPage');
    }
  });
}

// ----------------- History Management -----------------
async function loadHistory() {
  if (!historyTableBody) return;
  
  historyTableBody.innerHTML = '<tr><td colspan="5" class="no-data">Loading history...</td></tr>';
  
  try {
    const res = await fetch('/analysis-history');
    
    if (res.status === 403) {
      historyTableBody.innerHTML = '<tr><td colspan="5" class="no-data">Access denied. Admin only.</td></tr>';
      return;
    }
    
    const data = await res.json();
    
    if (!data.success) {
      historyTableBody.innerHTML = '<tr><td colspan="5" class="no-data">Error loading history</td></tr>';
      return;
    }

    const analyses = data.analyses || [];
    
    if (analyses.length === 0) {
      historyTableBody.innerHTML = '<tr><td colspan="5" class="no-data">No analysis history yet</td></tr>';
      return;
    }

    historyTableBody.innerHTML = '';
    analyses.forEach((a, index) => {
      const tr = document.createElement('tr');
      const resultClass = a.analysisResult.tumorDetected ? 'tumor-yes' : 'tumor-no';
      const resultText = a.analysisResult.tumorDetected ? 'Tumor Detected' : 'No Tumor';
      
      // Use formatDate helper for proper formatting
      const formattedDate = formatDate(a.createdAt);
      
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${a.originalName || a.filename}</td>
        <td class="${resultClass}">${resultText}</td>
        <td>${a.analysisResult.confidence}%</td>
        <td>${formattedDate}</td>
      `;
      historyTableBody.appendChild(tr);
    });
  } catch (err) {
    console.error('Load history error:', err);
    historyTableBody.innerHTML = '<tr><td colspan="5" class="no-data">Error loading history</td></tr>';
  }
}

// Clear history
if (clearHistoryBtn) {
  clearHistoryBtn.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to clear all analysis history? This cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch('/clear-history', { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        alert('History cleared successfully!');
        loadHistory();
      } else {
        alert('Failed to clear history: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Clear history error:', err);
      alert('Server error while clearing history');
    }
  });
}

// ----------------- Admin User Management -----------------
async function loadUsers() {
  if (!adminUsersTableBody) return;

  adminUsersTableBody.innerHTML = '<tr><td colspan="5" class="no-data">Loading users...</td></tr>';

  try {
    const res = await fetch('/users');
    if (res.status === 403) {
      adminUsersTableBody.innerHTML = '<tr><td colspan="5" class="no-data">Access denied. Admin only.</td></tr>';
      return;
    }

    const data = await res.json();
    if (!data.success) {
      adminUsersTableBody.innerHTML = '<tr><td colspan="5" class="no-data">Error loading users</td></tr>';
      return;
    }

    const users = data.users || [];
    if (totalUsersCount) totalUsersCount.textContent = users.length;

    const adminCount = users.filter(u =>
      u.email === 'adminbt2025@gmail.com' || u.phone === '9036948454'
    ).length;
    if (adminUsersCount) adminUsersCount.textContent = adminCount;

    if (users.length === 0) {
      adminUsersTableBody.innerHTML = '<tr><td colspan="5" class="no-data">No users found</td></tr>';
      return;
    }

    adminUsersTableBody.innerHTML = '';

    users.forEach((u, index) => {
      const tr = document.createElement('tr');

      const isAdmin = u.email === 'adminbt2025@gmail.com' || u.phone === '9036948454';
      const userType = isAdmin ? 
        '<span style="color:#e74c3c;font-weight:bold">Admin</span>' : 
        'User';

      // Use formatDate helper for proper formatting
      const formattedDate = formatDate(u.createdAt);

      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${u.email || u.phone}</td>
        <td>${formattedDate}</td>
        <td>${userType}</td>
        <td>
          ${isAdmin ? '' : `<button class="delete-user-btn" data-id="${u._id}" style="background:#d32f2f;color:white;border:none;border-radius:5px;padding:5px 10px;cursor:pointer;">Delete</button>`}
        </td>
      `;

      adminUsersTableBody.appendChild(tr);
    });

    // Attach delete event handler
    document.querySelectorAll('.delete-user-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const userId = btn.getAttribute('data-id');
        if (!confirm("Are you sure you want to delete this user?")) return;

        try {
          const res = await fetch(`/delete-user/${userId}`, { method: "DELETE" });
          const result = await res.json();
          alert(result.message);

          if (result.success) {
            loadUsers(); // refresh table
          }
        } catch (err) {
          console.error('Delete user error:', err);
          alert('Server error while deleting user');
        }
      });
    });

  } catch (err) {
    console.error('Load users error:', err);
    adminUsersTableBody.innerHTML = '<tr><td colspan="5" class="no-data">Error loading users</td></tr>';
  }
}

// ----------------- Password Toggle -----------------
document.querySelectorAll('.password-toggle').forEach(toggle => {
  toggle.addEventListener('click', () => {
    const targetId = toggle.getAttribute('data-target');
    const input = targetId ? $(targetId) : toggle.previousElementSibling;
    
    if (!input) return;
    
    if (input.type === 'password') {
      input.type = 'text';
      toggle.querySelector('i').classList.remove('fa-eye');
      toggle.querySelector('i').classList.add('fa-eye-slash');
    } else {
      input.type = 'password';
      toggle.querySelector('i').classList.remove('fa-eye-slash');
      toggle.querySelector('i').classList.add('fa-eye');
    }
  });
});
