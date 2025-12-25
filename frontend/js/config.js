const API_BASE = "http://127.0.0.1:8000";

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
    window.location.href = 'admin-login.html';
  }
  return response;
}
