const API_HOST = window.location.hostname;
const API_PORT = "8000";
const API_BASE = `http://${API_HOST}:${API_PORT}`;
const WS_BASE = `ws://${API_HOST}:${API_PORT}`;


// Function to get stored token
function getToken() {
  return sessionStorage.getItem('token');
}

// Function to set token
function setToken(token) {
  sessionStorage.setItem('token', token);
}

// Function to clear token
function clearToken() {
  sessionStorage.removeItem('token');
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
