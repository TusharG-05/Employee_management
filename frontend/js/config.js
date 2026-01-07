const API_BASE = ""; // Relative path as frontend is hosted on the same origin

// Function to get stored token
function getToken() {
  return localStorage.getItem('token');
}

// Function to set token
function setToken(token) {
  localStorage.setItem('token', token);
}

// Function to clear token
function clearToken() {
  localStorage.removeItem('token');
}

// Helper to make authenticated requests
async function apiRequest(url, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers
  });
  if (response.status === 401) {
    // Token expired or invalid
    clearToken();
    alert('Session expired. Please login again.');
    if (window.location.pathname.includes('admin')) {
      window.location.href = 'admin-login.html';
    } else {
      window.location.href = 'employee-login.html';
    }
  }
  return response;
}

function getUserType() {
  const path = window.location.pathname;
  if (path.includes('admin')) return 'admin';
  if (path.includes('employee')) return 'employee';
  return null;
}
