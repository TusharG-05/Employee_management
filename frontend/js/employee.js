// js/employee.js

async function employeeLogin() {
  console.log("employeeLogin function called");

  const emp_id = document.getElementById("emp_id").value;
  const password = document.getElementById("password").value;

  if (!emp_id || !password) {
    alert("Please enter emp_id and password");
    return;
  }

  console.log("Attempting login for:", emp_id);
  console.log("API_BASE:", API_BASE);

  try {
    const url = `${API_BASE}/employee/login`;
    console.log("Fetching URL:", url);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emp_id, password })
    });

    console.log("Response status:", res.status);
    console.log("Response ok:", res.ok);

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: "Login failed" }));
      console.error("Login error:", errorData);
      throw new Error(errorData.detail || "Login failed");
    }

    const data = await res.json();
    console.log("Login successful, token received");
    setToken(data.access_token);
    localStorage.setItem("emp_id", emp_id);
    location.href = "employee-dashboard.html";
  } catch (err) {
    console.error("Login exception:", err);
    alert("Login failed: " + err.message);
  }
}

async function loadEmployeeDashboard() {
  const emp_id = localStorage.getItem("emp_id");
  if (!emp_id) {
    location.href = "employee-login.html";
    return;
  }

  // Profile
  const profileRes = await apiRequest(`/employee/profile/${emp_id}`);
  if (profileRes.ok) {
    const profile = await profileRes.json();
    const profileContainer = document.getElementById("profile");
    profileContainer.innerHTML = `
        <div class="fade-in">
          <div class="text-center mb-4">
            <div class="profile-avatar">
              <i class="bi bi-person-fill"></i>
            </div>
            <h5 class="text-white mb-2">${profile.name}</h5>
            <span class="badge bg-info">${profile.role.toUpperCase()}</span>
          </div>
          <div class="mt-4 pt-3 border-top border-secondary">
            <div class="d-flex justify-content-between align-items-center mb-3 p-2 rounded" style="background: rgba(15, 23, 42, 0.5);">
              <div class="d-flex align-items-center">
                <i class="bi bi-person-badge text-muted me-2"></i>
                <span class="text-muted small">Employee ID</span>
              </div>
              <span class="text-white fw-semibold">${profile.emp_id}</span>
            </div>
            <div class="d-flex justify-content-between align-items-center mb-3 p-2 rounded" style="background: rgba(15, 23, 42, 0.5);">
              <div class="d-flex align-items-center">
                <i class="bi bi-building text-muted me-2"></i>
                <span class="text-muted small">Department</span>
              </div>
              <span class="text-white fw-semibold">${profile.dept}</span>
            </div>
            <div class="d-flex justify-content-between align-items-center p-2 rounded" style="background: rgba(15, 23, 42, 0.5);">
              <div class="d-flex align-items-center">
                <i class="bi bi-currency-dollar text-muted me-2"></i>
                <span class="text-muted small">Salary</span>
              </div>
              <span class="text-success fw-bold fs-5">₹${profile.salary.toLocaleString()}</span>
            </div>
          </div>
        </div>
    `;
  } else {
    document.getElementById("profile").innerHTML = `
      <div class="text-center py-4">
        <i class="bi bi-exclamation-triangle text-warning fs-1"></i>
        <p class="text-muted mt-3">Failed to load profile</p>
      </div>
    `;
  }

  // Attendance
  await loadAttendanceSection();
}

async function loadAttendanceSection() {
  const emp_id = localStorage.getItem("emp_id");
  const section = document.getElementById("attendance-section");

  // Show loading state
  section.innerHTML = `
    <div class="text-center py-4">
      <div class="spinner-border spinner-border-sm text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
  `;

  const attRes = await apiRequest(`/employee/attendance/${emp_id}`);

  if (attRes.ok) {
    const attendance = await attRes.json();
    const status = (attendance && attendance.status) ? attendance.status : "NOT MARKED";
    const statusClass = status === 'present' ? 'success' : status === 'leave' ? 'info' : 'warning';
    const statusIcon = status === 'present' ? 'bi-check-circle' : status === 'leave' ? 'bi-calendar-event' : 'bi-clock';

    section.innerHTML = `
        <div class="fade-in">
          <div class="card card-custom mb-3" style="background: rgba(15, 23, 42, 0.6);">
            <div class="card-body">
              <div class="d-flex align-items-center justify-content-between">
                <div>
                  <h6 class="text-muted mb-2 small text-uppercase">
                    <i class="bi bi-calendar3 me-1"></i>Today's Status
                  </h6>
                  <div class="d-flex align-items-center gap-2">
                    <span class="badge bg-${statusClass} status-badge">
                      <i class="bi ${statusIcon}"></i>${status.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div>
                  <button onclick="markAttendance('present')" class="btn btn-success" id="markAttendanceBtn">
                    <i class="bi bi-check-circle me-1"></i>Mark Present
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
    `;
  } else {
    section.innerHTML = `
        <div class="fade-in">
          <div class="card card-custom mb-3" style="background: rgba(15, 23, 42, 0.6);">
            <div class="card-body">
              <div class="d-flex align-items-center justify-content-between">
                <div>
                  <h6 class="text-muted mb-2 small text-uppercase">
                    <i class="bi bi-calendar3 me-1"></i>Today's Status
                  </h6>
                  <span class="badge bg-warning status-badge">
                    <i class="bi bi-clock"></i>NOT MARKED
                  </span>
                </div>
                <div>
                  <button onclick="markAttendance('present')" class="btn btn-success" id="markAttendanceBtn">
                    <i class="bi bi-check-circle me-1"></i>Mark Present
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
    `;
  }
}

async function markAttendance(status) {
  const btn = document.getElementById('markAttendanceBtn');
  if (!btn) return;

  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Marking...';

  try {
    const res = await apiRequest('/employee/attendance', {
      method: 'POST',
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      showToast('Attendance marked successfully!', 'success');
      setTimeout(() => {
        loadAttendanceSection();
      }, 500);
    } else {
      const error = await res.json().catch(() => ({ detail: 'Failed to mark attendance' }));
      showToast(error.detail || 'Failed to mark attendance', 'error');
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  } catch (err) {
    showToast('Network error. Please try again.', 'error');
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

async function applyLeave() {
  const dateInput = document.getElementById('leave_date').value;
  const reasonInput = document.getElementById('leave_reason').value;
  const submitBtn = document.getElementById('submitLeaveBtn');

  if (!dateInput) {
    showToast('Please select a leave date', 'error');
    document.getElementById('leave_date').focus();
    return;
  }

  if (!reasonInput || reasonInput.trim().length < 5) {
    showToast('Please provide a reason (at least 5 characters)', 'error');
    document.getElementById('leave_reason').focus();
    return;
  }

  // Disable button and show loading
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Submitting...';

  // Check for duplicate leave on the same day
  try {
    const leaveRes = await apiRequest('/employee/leave');
    if (leaveRes.ok) {
      const leaves = await leaveRes.json();
      // Compare dates properly - convert both to date strings for comparison
      const hasDuplicate = leaves.some(leave => {
        const leaveDateStr = typeof leave.leave_date === 'string'
          ? leave.leave_date.split('T')[0]
          : leave.leave_date;
        return leaveDateStr === dateInput;
      });
      if (hasDuplicate) {
        showToast('You have already applied for leave on this date', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        return;
      }
    }
  } catch (err) {
    console.error("Error checking existing leaves:", err);
  }

  try {
    const res = await apiRequest('/employee/leave', {
      method: 'POST',
      body: JSON.stringify({ leave_date: dateInput, reason: reasonInput })
    });

    if (res.ok) {
      showToast('Leave application submitted successfully!', 'success');
      document.getElementById('leave_date').value = '';
      document.getElementById('leave_reason').value = '';

      // Close modal with animation
      const modal = bootstrap.Modal.getInstance(document.getElementById('applyLeaveModal'));
      modal.hide();

      // Refresh leave list after a short delay
      setTimeout(() => {
        loadLeaveRequests();
      }, 300);
    } else {
      const error = await res.json().catch(() => ({ detail: 'Submission failed' }));
      showToast(error.detail || 'Submission failed', 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  } catch (err) {
    showToast('Network error. Please try again.', 'error');
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const bgClass = type === 'success' ? 'bg-success' : (type === 'error' ? 'bg-danger' : 'bg-primary');
  const icon = type === 'success' ? 'check-circle-fill' : (type === 'error' ? 'exclamation-triangle-fill' : 'bell-fill');

  const toast = document.createElement('div');
  toast.className = `toast align-items-center text-white ${bgClass} border-0 show`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  toast.setAttribute('aria-atomic', 'true');

  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        <i class="bi bi-${icon} me-2"></i> ${message}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 500);
  }, 4000);
}

async function loadLeaveRequests() {
  const container = document.getElementById('leave-list');
  if (!container) {
    console.warn("Leave list container not found");
    return;
  }

  // Store previous content to detect changes
  const previousContent = container.innerHTML;

  container.innerHTML = `
    <div class="text-center py-4">
      <div class="spinner-border spinner-border-sm text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="text-muted mt-2 mb-0 small">Loading leave requests...</p>
    </div>
  `;

  try {
    const res = await apiRequest('/employee/leave');
    if (!res.ok) {
      throw new Error("Failed to fetch leave requests");
    }

    const leaves = await res.json();

    if (leaves.length === 0) {
      container.innerHTML = `
        <div class="empty-state fade-in">
          <i class="bi bi-calendar-x text-muted"></i>
          <h6 class="text-muted mt-3">No leave applications</h6>
          <p class="text-muted small">You haven't applied for any leave yet.</p>
          <button class="btn btn-primary btn-sm mt-2" data-bs-toggle="modal" data-bs-target="#applyLeaveModal">
            <i class="bi bi-plus-circle me-1"></i>Apply for Leave
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="fade-in">
        <div class="table-responsive">
          <table class="table table-dark-custom align-middle">
            <thead>
              <tr>
                <th><i class="bi bi-calendar3 me-1"></i>Date</th>
                <th><i class="bi bi-text-paragraph me-1"></i>Reason</th>
                <th class="text-center"><i class="bi bi-info-circle me-1"></i>Status</th>
              </tr>
            </thead>
            <tbody id="leave-table-body"></tbody>
          </table>
        </div>
      </div>
    `;

    const tbody = document.getElementById('leave-table-body');
    if (!tbody) {
      console.error("Leave table body not found");
      return;
    }

    leaves.forEach((l, index) => {
      const row = document.createElement('tr');
      row.className = 'fade-in';
      row.style.animationDelay = `${index * 0.05}s`;

      const statusClass = l.status === 'ACCEPTED' ? 'bg-success' :
        l.status === 'REJECTED' ? 'bg-danger' : 'bg-warning';
      const statusIcon = l.status === 'ACCEPTED' ? 'bi-check-circle' :
        l.status === 'REJECTED' ? 'bi-x-circle' : 'bi-clock';

      // Format date
      const leaveDate = new Date(l.leave_date);
      const formattedDate = leaveDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      row.innerHTML = `
        <td>
          <div class="d-flex align-items-center">
            <i class="bi bi-calendar3 text-muted me-2"></i>
            <span>${formattedDate}</span>
          </div>
        </td>
        <td>
          <div class="text-truncate" style="max-width: 200px;" title="${l.reason || 'N/A'}">
            ${l.reason || '<span class="text-muted">No reason provided</span>'}
          </div>
        </td>
        <td class="text-center">
          <span class="badge ${statusClass} status-badge">
            <i class="bi ${statusIcon}"></i>${l.status}
          </span>
        </td>
      `;
      tbody.appendChild(row);
    });

    // Add a subtle animation to indicate update if content changed
    if (previousContent && previousContent !== container.innerHTML) {
      container.style.transition = 'opacity 0.3s';
      container.style.opacity = '0.7';
      setTimeout(() => {
        container.style.opacity = '1';
      }, 100);
    }
  } catch (err) {
    console.error("Error loading leave requests:", err);
    container.innerHTML = `
      <div class="empty-state fade-in">
        <i class="bi bi-exclamation-triangle text-danger fs-1"></i>
        <h6 class="text-danger mt-3">Error loading leave requests</h6>
        <p class="text-muted small">Please refresh the page or try again later.</p>
        <button class="btn btn-primary btn-sm mt-2" onclick="loadLeaveRequests()">
          <i class="bi bi-arrow-clockwise me-1"></i>Retry
        </button>
      </div>
    `;
  }
}

function logout() {
  localStorage.removeItem("emp_id");
  clearToken();
  location.href = "index.html";
}

// Make functions global for WebSocket updates
window.loadLeaveRequests = loadLeaveRequests;
window.loadAttendanceSection = loadAttendanceSection;