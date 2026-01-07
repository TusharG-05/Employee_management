// js/employee.js

async function employeeLogin() {
  const emp_id = document.getElementById("emp_id").value;
  const password = document.getElementById("password").value;

  if (!emp_id || !password) {
    alert("Please enter emp_id and password");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/employee/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emp_id, password })
    });

    if (!res.ok) throw new Error("Login failed");

    const data = await res.json();
    setToken(data.access_token);
    localStorage.setItem("emp_id", emp_id);
    location.href = "employee-dashboard.html";
  } catch (err) {
    alert("Invalid employee credentials");
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
    document.getElementById("profile").innerHTML = `
        <div class="text-center mb-3">
            <div class="bg-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style="width: 80px; height: 80px;">
                <i class="bi bi-person-fill fs-1 text-white"></i>
            </div>
            <h5 class="text-white">${profile.name}</h5>
            <span class="badge bg-info text-dark">${profile.role.toUpperCase()}</span>
        </div>
        <div class="mt-4 pt-3 border-top border-secondary">
            <div class="d-flex justify-content-between mb-2">
                <span class="text-muted small">Employee ID</span>
                <span class="text-white">${profile.emp_id}</span>
            </div>
            <div class="d-flex justify-content-between mb-2">
                <span class="text-muted small">Department</span>
                <span class="text-white">${profile.dept}</span>
            </div>
            <div class="d-flex justify-content-between">
                <span class="text-muted small">Salary</span>
                <span class="text-success fw-bold">$${profile.salary}</span>
            </div>
        </div>
    `;
  }

  // Attendance
  const attRes = await apiRequest(`/employee/attendance/${emp_id}`);
  const section = document.getElementById("attendance-section");
  if (attRes.ok) {
    const attendance = await attRes.json();
    const status = (attendance && attendance.status) ? attendance.status : "No record";

    section.innerHTML = `
        <div class="d-flex align-items-center justify-content-between p-3 bg-dark-custom rounded border border-secondary mb-4">
            <div>
                <h6 class="text-muted mb-1 small uppercase">Today's Status</h6>
                <h4 class="mb-0 text-white">${status}</h4>
            </div>
            <div class="d-flex gap-2">
                <button onclick="markAttendance('PRESENT')" class="btn btn-sm btn-success">Mark Present</button>
            </div>
        </div>
    `;
  } else {
    section.innerHTML = `
        <div class="d-flex align-items-center justify-content-between p-3 bg-dark-custom rounded border border-secondary mb-4">
            <div>
                <h6 class="text-muted mb-1 small uppercase">Today's Status</h6>
                <h4 class="mb-0 text-white">NOT MARKED</h4>
            </div>
            <div class="d-flex gap-2">
                <button onclick="markAttendance('PRESENT')" class="btn btn-sm btn-success">Mark Present</button>
            </div>
        </div>
      `;
  }
}

async function markAttendance(status) {
  try {
    const res = await apiRequest('/employee/attendance', {
      method: 'POST',
      body: JSON.stringify(status)
    });
    if (res.ok) {
      alert("Attendance marked successfully");
      loadEmployeeDashboard();
    }
  } catch (err) {
    alert("Failed to mark attendance");
  }
}

async function applyLeave() {
  const dateInput = document.getElementById('leave_date').value;
  const reasonInput = document.getElementById('leave_reason').value;

  if (!dateInput) {
    alert("Please select a date");
    return;
  }

  try {
    const res = await apiRequest('/employee/leave', {
      method: 'POST',
      body: JSON.stringify({ leave_date: dateInput, reason: reasonInput })
    });

    if (res.ok) {
      alert("Leave application submitted");
      document.getElementById('leave_date').value = '';
      document.getElementById('leave_reason').value = '';
      const modal = bootstrap.Modal.getInstance(document.getElementById('applyLeaveModal'));
      modal.hide();
      loadLeaveRequests();
    } else {
      const err = await res.json();
      alert(err.detail || "Submission failed");
    }
  } catch (err) {
    alert("Server error");
  }
}

async function loadLeaveRequests() {
  const container = document.getElementById('leave-list');
  container.innerHTML = '<div class="text-center py-3"><div class="spinner-border text-primary spinner-border-sm"></div></div>';

  try {
    const res = await apiRequest('/employee/leave');
    const leaves = await res.json();

    if (leaves.length === 0) {
      container.innerHTML = '<p class="text-muted text-center py-3">No leave applications found</p>';
      return;
    }

    container.innerHTML = `
            <div class="table-responsive">
                <table class="table table-dark-custom table-sm align-middle">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Reason</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody id="leave-table-body"></tbody>
                </table>
            </div>
        `;

    const tbody = document.getElementById('leave-table-body');
    leaves.forEach(l => {
      const row = document.createElement('tr');
      row.innerHTML = `
                <td>${l.leave_date}</td>
                <td class="text-truncate" style="max-width: 150px;">${l.reason || 'N/A'}</td>
                <td><span class="badge ${l.status === 'ACCEPTED' ? 'bg-success' : (l.status === 'REJECTED' ? 'bg-danger' : 'bg-warning')}">${l.status}</span></td>
            `;
      tbody.appendChild(row);
    });
  } catch (err) {
    container.innerHTML = '<p class="text-danger text-center">Error loading leaves</p>';
  }
}

function logout() {
  localStorage.removeItem("emp_id");
  clearToken();
  location.href = "index.html";
}